"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Search, 
  MessageSquare, 
  Eye, 
  Users, 
  Clock,
  ChevronLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getAllConversations, getAllUsers } from "@/lib/firestoreData";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminMonitorPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // حماية الصفحة
  useEffect(() => {
    if (!userLoading && user?.email !== "gdark9951@gmail.com") {
      router.push("/dashboard");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [convs, usersData] = await Promise.all([
        getAllConversations(),
        getAllUsers()
      ]);
      setConversations(convs);
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error loading monitor data:", error);
    }
    setLoading(false);
  };

  const getUserName = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u?.name || "مستخدم غير معروف";
  };

  const getUserRole = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u?.role === "professor" ? "مشرف" : "طالب";
  };

  const filteredConversations = conversations.filter(c => {
    const names = c.participants.map(p => getUserName(p).toLowerCase()).join(" ");
    return names.includes(searchQuery.toLowerCase());
  });

  if (userLoading || user?.email !== "gdark9951@gmail.com") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-primary-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary-200" />
            مركز الرقابة الإدارية
          </h1>
          <p className="text-primary-100 mt-2 text-lg">
            أهلاً بك يا مدير النظام. يمكنك هنا مراقبة كافة المحادثات وضمان جودة التواصل.
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input 
            type="text"
            placeholder="البحث عن محادثة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-white/50 outline-none transition-all placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-medad-border dark:border-dark-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي المحادثات</p>
              <p className="text-2xl font-bold">{conversations.length}</p>
            </div>
          </div>
        </div>
        {/* Can add more stats here */}
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-dark-border animate-pulse rounded-2xl" />
          ))
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((chat) => (
            <motion.div
              key={chat.id}
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-dark-card border border-medad-border dark:border-dark-border rounded-2xl p-6 shadow-sm hover:shadow-google-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-4">
                    {chat.participants.map((p, i) => (
                      <div key={p} className={`w-12 h-12 rounded-full border-4 border-white dark:border-dark-card flex items-center justify-center text-white font-bold text-sm shadow-md ${i === 0 ? "bg-primary-500" : "bg-purple-500"}`}>
                        {getUserName(p).charAt(0)}
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-medad-ink dark:text-dark-text">
                        {getUserName(chat.participants[0])}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-lg text-medad-ink dark:text-dark-text">
                        {getUserName(chat.participants[1])}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      آخر نشاط: {chat.updated_at?.toDate().toLocaleString('ar-EG') || "غير معروف"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 max-w-md hidden md:block">
                  <div className="bg-medad-paper dark:bg-dark-hover p-3 rounded-xl border border-dashed border-gray-300 dark:border-dark-border">
                    <p className="text-xs text-gray-400 mb-1">آخر رسالة:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {chat.lastMessage || "لا توجد رسائل بعد"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/admin/monitor/${chat.id}`}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20"
                >
                  <Eye className="w-5 h-5" />
                  دخول وضع الرقابة
                </Link>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center bg-medad-paper dark:bg-dark-hover rounded-3xl border-2 border-dashed border-gray-200 dark:border-dark-border">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl text-gray-500">لا توجد محادثات نشطة حالياً لمراقبتها</p>
          </div>
        )}
      </div>
    </div>
  );
}
