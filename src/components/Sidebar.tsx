"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FileText,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Search,
  Sparkles,
  BarChart3,
  Users,
  Calendar,
  Menu,
  X,
  Award,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  // قوائم الطلاب
  const studentMenuItems: MenuItem[] = [
    { id: "home", label: "الرئيسية", icon: Home, href: "/dashboard" },
    {
      id: "research",
      label: "بحثي",
      icon: FileText,
      href: "/dashboard/research",
    },
    {
      id: "sources",
      label: "المصادر",
      icon: BookOpen,
      href: "/dashboard/sources",
    },
    { id: "gallery", label: "استكشف", icon: Award, href: "/dashboard/gallery" },
    {
      id: "chat",
      label: "المحادثات",
      icon: MessageSquare,
      href: "/dashboard/chat",
      badge: 3,
    },
    {
      id: "progress",
      label: "التقدم",
      icon: BarChart3,
      href: "/dashboard/progress",
    },
    {
      id: "schedule",
      label: "الجدول",
      icon: Calendar,
      href: "/dashboard/schedule",
    },
  ];

  // قوائم المشرفين
  const professorMenuItems: MenuItem[] = [
    { id: "home", label: "الرئيسية", icon: Home, href: "/dashboard" },
    {
      id: "students",
      label: "طلابي",
      icon: Users,
      href: "/dashboard/supervisor/students",
    },
    {
      id: "review",
      label: "مركز المراجعة",
      icon: MessageSquare,
      href: "/dashboard/supervisor/review",
    },
    {
      id: "publish",
      label: "إدارة النشر",
      icon: Sparkles,
      href: "/dashboard/publish",
    },
    { id: "gallery", label: "المعرض", icon: Award, href: "/dashboard/gallery" },
    {
      id: "chat",
      label: "المحادثات",
      icon: MessageSquare,
      href: "/dashboard/chat",
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  // قوائم المديرين
  const adminMenuItems: MenuItem[] = [
    {
      id: "admin",
      label: "لوحة التحكم",
      icon: BarChart3,
      href: "/dashboard/admin",
    },
    {
      id: "users",
      label: "إدارة المستخدمين",
      icon: Users,
      href: "/dashboard/admin/users",
    },
    {
      id: "monitor",
      label: "مركز الرقابة",
      icon: Shield,
      href: "/dashboard/admin/monitor",
    },
    {
      id: "gallery",
      label: "معرض الأبحاث",
      icon: Award,
      href: "/dashboard/gallery",
    },
    {
      id: "announcements",
      label: "الإعلانات",
      icon: Bell,
      href: "/dashboard/admin/announcements",
    },
    {
      id: "settings",
      label: "الإعدادات",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  const isSystemAdmin = user?.email === "gdark9951@gmail.com";

  // اختيار القائمة حسب الدور
  let menuItems: MenuItem[] = studentMenuItems;
  
  if (isSystemAdmin) {
    menuItems = adminMenuItems;
  } else if (user?.role === "professor") {
    menuItems = professorMenuItems;
  } else if (user?.role === "admin") {
    menuItems = adminMenuItems;
  }

  const bottomItems: MenuItem[] = [
    {
      id: "settings",
      label: "الإعدادات",
      icon: Settings,
      href: "/dashboard/settings",
    },
    { id: "logout", label: "تسجيل الخروج", icon: LogOut, href: "/login" },
  ];

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "100%" },
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="open"
        animate={isOpen ? "open" : "closed"}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-dark-card border-l border-medad-border dark:border-dark-border shadow-google-lg dark:shadow-dark z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-medad-border dark:border-dark-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-medad-ink dark:text-dark-text">
                مداد<span className="text-primary-600">.</span>
              </h1>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-medad-ink dark:text-dark-text" />
            </button>
          </div>

          {/* User Info */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 p-3 bg-medad-paper dark:bg-dark-hover rounded-google cursor-pointer hover:bg-medad-hover dark:hover:bg-dark-border transition-all"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-sm border border-white/20 relative">
              {user?.image ? (
                <Image 
                  src={user.image} 
                  alt={user.name} 
                  fill
                  className="object-cover"
                  unoptimized // جوجل بروفايل أحياناً يحتاج unoptimized لتجنب مشاكل النطاقات
                />
              ) : (
                user?.name?.charAt(0) || "ض"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-medad-ink dark:text-dark-text text-sm truncate">
                {user?.name || "ضيف"}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                {isSystemAdmin
                  ? "مدير النظام"
                  : user?.role === "student"
                    ? "طالب"
                    : user?.role === "professor"
                      ? "أستاذ"
                      : "مدير"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={isActive ? "sidebar-item-active" : "sidebar-item"}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${isActive ? "rotate-180" : ""}`}
                  />
                </Link>
              </motion.div>
            );
          })}

          {/* AI Assistant Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white p-4 rounded-google shadow-google-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">المساعد الذكي</span>
          </motion.button>
        </nav>

        {/* Bottom Items */}
        <div className="border-t border-medad-border dark:border-dark-border p-4 space-y-1">
          {bottomItems.map((item) => {
            const isLogout = item.id === "logout";
            return (
              <Link
                key={item.id}
                href={item.href}
                className="sidebar-item"
                onClick={() => {
                  setIsOpen(false);
                  if (isLogout && typeof window !== "undefined") {
                    localStorage.removeItem("currentUser");
                  }
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.aside>
    </>
  );
}
