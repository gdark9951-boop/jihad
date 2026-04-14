"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Search,
  Filter,
  CheckCheck,
  Check,
  Users,
  UserCircle,
  Image as ImageIcon,
  File,
  X,
  Archive,
  Pin,
  Volume2,
  VolumeX,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useUser, type User } from "@/contexts/UserContext";
import UserSearchModal from "@/components/UserSearchModal";
import { useNotifications } from "@/contexts/NotificationContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  Timestamp, 
  doc, 
  updateDoc,
  limit,
  getDocs
} from "firebase/firestore";

type ContactType = "supervisor" | "assistant" | "group" | "student";
type MessageStatus = "sent" | "delivered" | "read";

interface Message {
  id: number;
  sender: "me" | "other";
  senderName?: string;
  text: string;
  time: string;
  status?: MessageStatus;
  attachment?: {
    type: "image" | "file";
    name: string;
    url: string;
  };
}

interface Conversation {
  id: string; // Changed to string for Firestore IDs
  name: string;
  role: string;
  type: ContactType;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  pinned?: boolean;
  muted?: boolean;
  messages: Message[];
  participants?: string[];
}

export default function ChatPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { addNotification } = useNotifications();
  const [message, setMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ContactType>("all");
  const [isTyping, setIsTyping] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ البدء بقائمة فارغة - سيتم تحميل المحادثات من localStorage أو قاعدة البيانات
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // ✅ تحميل المحادثات من Firestore في الوقت الفعلي
  useEffect(() => {
    if (!currentUser?.id) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.id),
      orderBy("updated_at", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convList = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        
        // جلب بيانات الطرف الآخر
        const otherId = data.participants.find((p: string) => p !== currentUser.id);
        let otherUser: any = null;
        
        if (otherId) {
          const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", otherId)));
          if (!userDoc.empty) {
            otherUser = userDoc.docs[0].data();
          }
        }

        return {
          id: d.id,
          name: otherUser?.name || "مستخدم",
          role: otherUser?.role === 'professor' ? "مشرف البحث" : "طالب",
          type: otherUser?.role === 'professor' ? "supervisor" : "student",
          avatar: otherUser?.name?.charAt(0) || "م",
          lastMessage: data.lastMessage || "",
          time: data.updated_at?.toDate().toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' }) || "",
          unread: 0,
          online: true,
          pinned: data.pinned_by?.includes(currentUser.id),
          messages: [],
          participants: data.participants
        } as Conversation;
      }));

      setConversations(convList);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // ✅ تحميل الرسائل للمحادثة المختارة في الوقت الفعلي
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, "conversations", selectedChat.toString(), "messages"),
      orderBy("created_at", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: Message[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id as any,
          sender: data.sender_id === currentUser?.id ? "me" : "other",
          text: data.text,
          time: data.created_at?.toDate().toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' }) || "",
          status: data.status,
          senderName: data.sender_name
        };
      });
      setMessages(msgList);
    });

    return () => unsubscribe();
  }, [selectedChat, currentUser?.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleAddUser = async (selectedUser: User) => {
    if (!currentUser?.id) return;

    // التحقق من وجود محادثة مسبقة في Firestore
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.id)
    );
    
    const querySnapshot = await getDocs(q);
    const existing = querySnapshot.docs.find(d => 
      d.data().participants.includes(selectedUser.id)
    );

    if (existing) {
      setSelectedChat(existing.id as any);
      setShowUserSearch(false);
      return;
    }

    // إنشاء محادثة جديدة في Firestore
    try {
      const docRef = await addDoc(collection(db, "conversations"), {
        participants: [currentUser.id, selectedUser.id],
        updated_at: Timestamp.now(),
        lastMessage: "ابدأ المحادثة...",
        created_at: Timestamp.now()
      });
      setSelectedChat(docRef.id as any);
      setShowUserSearch(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleSend = async () => {
    if (message.trim() && selectedChat && currentUser?.id) {
      const chatMsg = message.trim();
      setMessage("");

      try {
        const messagesRef = collection(db, "conversations", selectedChat.toString(), "messages");
        await addDoc(messagesRef, {
          sender_id: currentUser.id,
          text: chatMsg,
          created_at: Timestamp.now(),
          status: "sent"
        });

        const convRef = doc(db, "conversations", selectedChat.toString());
        await updateDoc(convRef, {
          lastMessage: chatMsg,
          updated_at: Timestamp.now()
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handlePinConversation = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      const convRef = doc(db, "conversations", id);
      const conv = conversations.find(c => c.id === id);
      const pinnedBy = conv?.pinned ? [] : [currentUser.id]; // Simplified for now
      await updateDoc(convRef, { pinned_by: pinnedBy });
    } catch (error) {
      console.error("Error pinning conversation:", error);
    }
  };

  const handleMuteConversation = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      const convRef = doc(db, "conversations", id);
      const conv = conversations.find(c => c.id === id);
      const mutedBy = conv?.muted ? [] : [currentUser.id];
      await updateDoc(convRef, { muted_by: mutedBy });
    } catch (error) {
      console.error("Error muting conversation:", error);
    }
  };

  const markAsRead = async (id: string) => {
    // Implement read status in Firestore if needed
  };

  const filteredConversations = conversations
    .filter((conv) => {
      const matchesSearch =
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "all" || conv.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Pinned conversations first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedChat,
  );

  const getContactTypeLabel = (type: ContactType | "all") => {
    switch (type) {
      case "supervisor":
        return "المشرفين";
      case "assistant":
        return "المساعدين";
      case "group":
        return "المجموعات";
      case "student":
        return "الطلاب";
      case "all":
      default:
        return "الكل";
    }
  };

  const getContactTypeColor = (type: ContactType) => {
    switch (type) {
      case "supervisor":
        return "from-blue-500 to-blue-600";
      case "assistant":
        return "from-green-500 to-green-600";
      case "group":
        return "from-purple-500 to-purple-600";
      case "student":
        return "from-orange-500 to-orange-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUser={handleAddUser}
      />

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-dark-muted hover:text-medad-primary dark:hover:text-primary-400 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>رجوع</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medad-ink dark:text-dark-text mb-2">
            المحادثات
          </h1>
          <p className="text-gray-600 dark:text-dark-muted">
            تواصل مع {currentUser?.role === "student" ? "مشرفك" : "طلابك"}{" "}
            والزملاء
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUserSearch(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>
            {currentUser?.role === "student" ? "بحث عن مشرف" : "بحث عن طالب"}
          </span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 md:gap-6 h-[calc(100vh-200px)] md:h-[calc(100vh-280px)] min-h-[500px] md:min-h-[600px]">
        {/* Conversations List - Hidden on mobile when chat is selected */}
        <div
          className={`${selectedChat !== null ? "hidden lg:flex" : "flex"} card flex-col h-full overflow-hidden`}
        >
          {/* Search and Filter */}
          <div className="p-4 border-b border-medad-border dark:border-dark-border space-y-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في المحادثات..."
                className="w-full pr-10 pl-4 py-2 bg-medad-paper dark:bg-dark-hover border border-medad-border dark:border-dark-border rounded-google focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(
                ["all", "supervisor", "assistant", "group", "student"] as const
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filterType === type
                      ? "bg-primary-600 text-white"
                      : "bg-medad-paper dark:bg-dark-hover text-gray-600 dark:text-dark-muted hover:bg-medad-hover dark:hover:bg-dark-border"
                  }`}
                >
                  {getContactTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-dark-muted">
                  لا توجد محادثات
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  whileHover={{ x: 5 }}
                  onClick={() => {
                    setSelectedChat(conv.id);
                    markAsRead(conv.id);
                  }}
                  className={`p-3 cursor-pointer border-b border-medad-border dark:border-dark-border transition-colors ${
                    selectedChat === conv.id
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : "hover:bg-medad-hover dark:hover:bg-dark-hover"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-11 h-11 bg-gradient-to-br ${getContactTypeColor(conv.type)} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
                      >
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-card rounded-full"></div>
                      )}
                      {conv.type === "group" && (
                        <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5">
                          <Users className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-medad-ink dark:text-dark-text text-sm truncate">
                            {conv.name}
                          </h3>
                          {conv.pinned && (
                            <Pin className="w-3 h-3 text-primary-600" />
                          )}
                          {conv.muted && (
                            <VolumeX className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-dark-muted flex-shrink-0 mr-2">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-dark-muted mb-1 truncate">
                        {conv.role}
                      </p>
                      <p
                        className={`text-xs truncate ${conv.unread > 0 ? "text-medad-ink dark:text-dark-text font-medium" : "text-gray-600 dark:text-dark-muted"}`}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="card flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-medad-border dark:border-dark-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </button>

                <div className="relative">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${getContactTypeColor(selectedConversation.type)} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}
                  >
                    {selectedConversation.avatar}
                  </div>
                  {selectedConversation.online && (
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-dark-card rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-medad-ink dark:text-dark-text">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-xs flex items-center gap-2">
                    {selectedConversation.online ? (
                      <span className="text-green-600 dark:text-green-400">
                        متصل الآن
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-dark-muted">
                        غير متصل
                      </span>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-dark-muted">
                      {selectedConversation.role}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePinConversation(selectedConversation.id)}
                  className={`p-2 rounded-google transition-colors ${
                    selectedConversation.pinned
                      ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600"
                      : "hover:bg-medad-hover dark:hover:bg-dark-hover"
                  }`}
                  title={
                    selectedConversation.pinned ? "إلغاء التثبيت" : "تثبيت"
                  }
                >
                  <Pin className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    handleMuteConversation(selectedConversation.id)
                  }
                  className={`p-2 rounded-google transition-colors ${
                    selectedConversation.muted
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                      : "hover:bg-medad-hover dark:hover:bg-dark-hover"
                  }`}
                  title={
                    selectedConversation.muted ? "إلغاء الكتم" : "كتم الإشعارات"
                  }
                >
                  {selectedConversation.muted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google"
                  title="مكالمة صوتية"
                >
                  <Phone className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google"
                  title="مكالمة فيديو"
                >
                  <Video className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-medad-paper dark:bg-dark-bg min-h-0">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${msg.sender === "me" ? "justify-start" : "justify-end"}`}
                  >
                    <div className="max-w-[70%]">
                      {msg.sender === "other" && msg.senderName && (
                        <p className="text-xs text-gray-500 dark:text-dark-muted mb-1 mr-2">
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.sender === "me"
                            ? "bg-primary-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-dark-card text-medad-ink dark:text-dark-text rounded-bl-sm shadow-sm border border-medad-border dark:border-dark-border"
                        }`}
                      >
                        <p className="text-sm leading-relaxed break-words" dir="auto">
                          {msg.text}
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <span
                            className={`text-xs ${msg.sender === "me" ? "text-primary-100" : "text-gray-500 dark:text-dark-muted"}`}
                          >
                            {msg.time}
                          </span>
                          {msg.sender === "me" && msg.status && (
                            <>
                              {msg.status === "sent" && (
                                <Check className="w-4 h-4 text-primary-200" />
                              )}
                              {msg.status === "delivered" && (
                                <CheckCheck className="w-4 h-4 text-primary-200" />
                              )}
                              {msg.status === "read" && (
                                <CheckCheck className="w-4 h-4 text-blue-200" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-medad-border dark:border-dark-border">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-medad-border dark:border-dark-border bg-white dark:bg-dark-card flex-shrink-0">
              <div className="flex items-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors flex-shrink-0"
                  title="إرفاق ملف"
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors flex-shrink-0"
                  title="إرفاق صورة"
                >
                  <ImageIcon className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </motion.button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="اكتب رسالتك... (Shift + Enter لسطر جديد)"
                  rows={1}
                  dir="auto"
                  className="flex-1 px-4 py-2.5 bg-medad-paper dark:bg-dark-hover border border-medad-border dark:border-dark-border rounded-google focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-32 text-sm text-right rtl:text-right ltr:text-left"
                  style={{ minHeight: "40px" }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="btn-primary px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm">إرسال</span>
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          /* No Chat Selected */
          <div className="card flex items-center justify-center h-full overflow-hidden">
            <div className="text-center p-8">
              <MessageSquare className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-medad-ink dark:text-dark-text mb-2">
                اختر محادثة للبدء
              </h3>
              <p className="text-gray-600 dark:text-dark-muted max-w-md">
                اختر محادثة من القائمة على اليمين أو ابدأ محادثة جديدة مع المشرف
                أو زملائك
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
