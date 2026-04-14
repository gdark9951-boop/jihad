"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  ArrowRight, 
  User, 
  Clock, 
  Lock,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getConversationById, getAllUsers } from "@/lib/firestoreData";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AdminMonitorDetailPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // حماية الصفحة
  useEffect(() => {
    if (!userLoading && user?.email !== "gdark9951@gmail.com") {
      router.push("/dashboard");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const conv = await getConversationById(chatId);
        const users = await getAllUsers();
        
        if (conv) {
          setConversation(conv);
          const parts = users.filter(u => conv.participants.includes(u.id));
          setParticipants(parts);
        } else {
          router.push("/dashboard/admin/monitor");
        }
      } catch (error) {
        console.error("Error loading chat detail:", error);
      }
      setLoading(false);
    };

    if (chatId) fetchData();
  }, [chatId]);

  // المراقبة اللحظية للرسائل (Spy Mode)
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "conversations", chatId, "messages");
    const q = query(messagesRef, orderBy("created_at", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      
      // التمرير لأسفل تلقائياً عند وصول رسالة جديدة
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  const getParticipant = (id: string) => {
    return participants.find(p => p.id === id);
  };

  if (userLoading || loading || user?.email !== "gdark9951@gmail.com") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto shadow-2xl rounded-3xl overflow-hidden border border-medad-border bg-white dark:bg-dark-bg animate-in zoom-in-95 duration-500">
      {/* Spy Mode Header */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/monitor" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowRight className="w-6 h-6" />
            </Link>
            <div className="bg-red-500/10 border border-red-500/50 px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Spy Mode Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {participants.map(p => (
                <div key={p.id} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold">
                  {p.name?.charAt(0)}
                </div>
              ))}
            </div>
            <div className="text-right hidden sm:block">
              <h2 className="font-bold text-sm">مراقبة محادثة سرية</h2>
              <p className="text-[10px] text-slate-400">تحت إشراف مدير النظام: مصطفى تحسين</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/40 p-3 flex items-center justify-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
          أنت الآن تشاهد المحادثة بوضع "القراءة فقط". لن يتم تسجيل دخولك ولن يظهر اسمك للمشاركين.
        </p>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50 dark:bg-dark-card/20">
        <AnimatePresence>
          {messages.length > 0 ? (
            messages.map((item, index) => {
              const sender = getParticipant(item.sender_id);
              const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== item.sender_id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-4 ${isFirstInGroup ? "mt-4" : "mt-2"}`}
                >
                  <div className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-dark-hover flex items-center justify-center flex-shrink-0 ${!isFirstInGroup ? "opacity-0" : ""}`}>
                    {sender?.image ? (
                      <Image src={sender.image} alt="" fill className="rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    {isFirstInGroup && (
                      <div className="flex items-center gap-2 ml-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {sender?.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-dark-hover">
                          {sender?.role === "professor" ? "مشرف" : "طالب"}
                        </span>
                      </div>
                    )}
                    
                    <div className="inline-block bg-white dark:bg-dark-paper border border-medad-border dark:border-dark-border p-4 rounded-2xl rounded-tr-none shadow-sm max-w-lg">
                      <p className="text-sm text-slate-800 dark:text-dark-text leading-relaxed">
                        {item.text}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-2 opacity-40">
                        <Clock className="w-3 h-3" />
                        <span className="text-[9px]">
                          {item.created_at?.toDate().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-dark-muted py-20">
              <Lock className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-medium opacity-30">جيء بالمحادثة.. لم يتم تداول أي رسائل بعد</p>
            </div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-white dark:bg-dark-card border-t border-medad-border flex items-center justify-center">
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <Shield className="w-3 h-3" />
          <span>هذه الجلسة محمية ومشفرة بإشراف الإدارة العامة لنظام مداد</span>
        </div>
      </div>
    </div>
  );
}
