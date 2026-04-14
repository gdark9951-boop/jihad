'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, Menu, Sun, Moon, X, 
  MessageSquare, Clock, FileText, CheckCheck,
  LogOut, User as UserIcon, Settings, Shield
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@/contexts/UserContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useUser()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // إغلاق القوائم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'deadline':
        return <Clock className="w-5 h-5 text-red-500" />
      case 'research':
        return <FileText className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${days} يوم`
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-medad-border dark:border-dark-border shadow-sm">
      <div className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            {/* Menu Toggle Button - Now in Header */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMenuClick}
              className="p-2.5 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors border border-medad-border dark:border-dark-border shadow-sm bg-white dark:bg-dark-card"
              title="القائمة الجانبية"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-dark-text" />
            </motion.button>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث في مصادرك، ملاحظاتك، أو اسأل المساعد الذكي..."
                  className="w-full pr-12 pl-4 py-3 bg-medad-paper dark:bg-dark-hover border border-medad-border dark:border-dark-border rounded-google focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
          
          {/* Mobile Search Icon */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2.5 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-dark-text" />
          </motion.button>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2.5 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors"
              title={theme === 'light' ? 'التبديل للوضع الداكن' : 'التبديل للوضع الفاتح'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-dark-text" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-dark-text" />
              )}
            </motion.button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="fixed md:absolute left-4 right-4 md:left-0 md:right-auto mt-2 md:w-96 bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-medad-border dark:border-dark-border overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-medad-border dark:border-dark-border">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-medad-ink dark:text-dark-text" />
                        <h3 className="font-bold text-medad-ink dark:text-dark-text">الإشعارات</h3>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:underline">قراءة الكل</button>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">لا توجد إشعارات</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b border-medad-border dark:border-dark-border last:border-b-0 hover:bg-medad-hover dark:hover:bg-dark-hover cursor-pointer" onClick={() => { markAsRead(n.id); if(n.link) router.push(n.link); setShowNotifications(false); }}>
                            <div className="flex gap-3">
                              {getNotificationIcon(n.type)}
                              <div>
                                <h4 className="font-semibold text-sm">{n.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-dark-muted">{n.message}</p>
                                <span className="text-[10px] text-gray-400">{formatTimestamp(n.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 md:pr-4 md:pl-1 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-full border border-medad-border dark:border-dark-border transition-all group"
              >
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-medad-ink dark:text-dark-text truncate max-w-[120px]">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-dark-muted">
                    {user?.role === 'admin' ? 'مدير' : user?.role === 'professor' ? 'أستاذ' : 'طالب'}
                  </p>
                </div>
                <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-primary-500 shadow-sm group-hover:border-primary-600 transition-colors">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                </div>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-medad-border dark:border-dark-border overflow-hidden z-50"
                  >
                    <div className="p-4 bg-gradient-to-br from-primary-50 to-white dark:from-dark-hover dark:to-dark-card border-b border-medad-border dark:border-dark-border text-center">
                      <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-primary-500">
                        {user?.image ? (
                          <Image src={user.image} alt={user.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-primary-600" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-medad-ink dark:text-dark-text">{user?.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-dark-muted decoration-none">{user?.email}</p>
                    </div>

                    <div className="p-2">
                      <Link 
                        href="/dashboard/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-dark-text hover:bg-medad-hover dark:hover:bg-dark-hover rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        الإعدادات
                      </Link>
                      {user?.role === 'admin' && (
                        <Link 
                          href="/dashboard/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-dark-text hover:bg-medad-hover dark:hover:bg-dark-hover rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          لوحة التحكم
                        </Link>
                      )}
                      
                      <div className="h-px bg-medad-border dark:bg-dark-border my-2 mx-2" />
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMenuClick}
              className="lg:hidden p-2.5 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-dark-text" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  )
}
