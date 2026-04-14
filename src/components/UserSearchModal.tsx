"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  UserPlus,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useUser, type User } from "@/contexts/UserContext";

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSelectUser,
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const { user: currentUser } = useUser();

  const handleSearch = useCallback(async (searchVal: string) => {
    setSearchQuery(searchVal);

    if (searchVal.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const { db } = await import("@/lib/firebase");
      const { collection, query: fsQuery, where, getDocs, limit: fireLimit } = await import("firebase/firestore");

      // تحديد نوع المستخدمين المطلوب البحث عنهم
      let targetRole: string;
      if (currentUser?.role === "student") {
        targetRole = "professor"; // الطالب يبحث عن الأساتذة
      } else if (currentUser?.role === "professor") {
        targetRole = "student"; // الأستاذ يبحث عن الطلاب
      } else {
        targetRole = "student"; // افتراضياً
      }

      const usersRef = collection(db, "users");
      // ملاحظة: Firestore لا يدعم البحث بالتشابه بشكل مباشر، سنقوم بالبحث بالاسم الكامل أو الفلترة محلياً للبحث المرن
      // للتبسيط الآن، سنبحث عن الدور المطلوب ونجلب عينة ثم نفلتر بالاسم
      const q = fsQuery(
        usersRef,
        where("role", "==", targetRole),
        fireLimit(50)
      );

      const querySnapshot = await getDocs(q);
      const allUsers: User[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id || doc.id,
          name: data.name || "مستخدم",
          email: data.email || "",
          role: data.role as any
        };
      });

      // فلترة النتائج بناءً على البحث
      const filtered = allUsers.filter(u => 
        u.id !== currentUser?.id && 
        (u.name.toLowerCase().includes(searchVal.toLowerCase()) || 
         u.email.toLowerCase().includes(searchVal.toLowerCase()))
      ).slice(0, 20);

      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    }
  }, [currentUser?.id, currentUser?.role]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student":
        return "طالب";
      case "professor":
        return "أستاذ";
      case "admin":
        return "مدير";
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <GraduationCap className="w-4 h-4" />;
      case "professor":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
              <div className="bg-white dark:bg-dark-card rounded-[24px] shadow-google-lg dark:shadow-dark border border-medad-border dark:border-dark-border overflow-hidden flex flex-col max-h-full">
                {/* Header */}
                <div className="p-6 border-b border-medad-border dark:border-dark-border flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text">
                      {currentUser?.role === "student"
                        ? "البحث عن مشرف"
                        : "البحث عن طالب"}
                    </h2>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-dark-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={
                        currentUser?.role === "student"
                          ? "ابحث عن أستاذ..."
                          : "ابحث عن طالب..."
                      }
                      className="w-full pr-12 pl-4 py-3 bg-medad-paper dark:bg-dark-hover border border-medad-border dark:border-dark-border rounded-google focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-medad-ink dark:text-dark-text"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="overflow-y-auto p-4 flex-1 min-h-0">
                  {searchQuery === "" ? (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-gray-300 dark:text-dark-muted mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-dark-muted">
                        ابدأ بكتابة الاسم أو البريد الإلكتروني للبحث
                      </p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 dark:text-dark-muted mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-dark-muted">
                        لم يتم العثور على نتائج
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <motion.button
                          key={user.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectUser(user)}
                          className="w-full p-4 bg-medad-paper dark:bg-dark-hover hover:bg-medad-hover dark:hover:bg-dark-border rounded-google transition-all border border-medad-border dark:border-dark-border text-right"
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {user.name.charAt(0)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-medad-ink dark:text-dark-text">
                                  {user.name}
                                </h3>
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                                  {getRoleIcon(user.role)}
                                  {getRoleLabel(user.role)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-dark-muted truncate">
                                {user.email}
                              </p>
                            </div>

                            {/* Add Button */}
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                                <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
