"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  UserPlus, 
  Shield, 
  GraduationCap, 
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getAllUsers, updateUserRole } from "@/lib/firestoreData";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // حماية الصفحة: فقط مصطفى تحسين يستطيع الوصول
  useEffect(() => {
    if (!userLoading && user?.email !== "gdark9951@gmail.com") {
      router.push("/dashboard");
    }
  }, [user, userLoading, router]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "student" ? "professor" : "student";
    setUpdatingId(userId);
    setStatus(null);

    const success = await updateUserRole(userId, newRole);
    
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setStatus({ type: "success", message: "تم تحديث الرتبة بنجاح" });
    } else {
      setStatus({ type: "error", message: "فشل تحديث الرتبة" });
    }
    
    setUpdatingId(null);
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userLoading || user?.email !== "gdark9951@gmail.com") {
    return (
      <div className="flex items-center justify-center h-screen bg-medad-paper dark:bg-dark-bg">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-medad-ink dark:text-dark-text flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-600" />
            إدارة مستخدمي النظام
          </h1>
          <p className="text-gray-500 dark:text-dark-muted mt-2">
            تحكم في رتب المستخدمين وتعيين المشرفين والطلاب
          </p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text"
            placeholder="البحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-white dark:bg-dark-card border border-medad-border dark:border-dark-border rounded-google py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-google flex items-center gap-3 ${
            status.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {status.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.message}
        </motion.div>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-dark-border animate-pulse rounded-google" />
          ))
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-dark-card border border-medad-border dark:border-dark-border rounded-google p-6 shadow-sm hover:shadow-google-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                    {item.name?.charAt(0) || "م"}
                  </div>
                  <div>
                    <h3 className="font-bold text-medad-ink dark:text-dark-text">{item.name}</h3>
                    <p className="text-xs text-gray-500 truncate w-40">{item.email}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  item.role === "professor" 
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}>
                  {item.role === "professor" ? "مشرف" : "طالب"}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-medad-border dark:border-dark-border">
                <button
                  onClick={() => handleUpdateRole(item.id, item.role)}
                  disabled={updatingId === item.id}
                  className="flex-1 bg-medad-paper dark:bg-dark-hover hover:bg-medad-hover dark:hover:bg-dark-border text-medad-ink dark:text-dark-text py-2 rounded-google text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {updatingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      تغيير الرتبة إلى {item.role === "student" ? "مشرف" : "طالب"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500 dark:text-dark-muted">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl">لا يوجد مستخدمون مطابقون لبحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}
