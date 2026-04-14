'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Bell,
  Palette,
  Shield,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Check,
  ArrowRight
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@/contexts/UserContext'
import { saveUserData, loadUserData } from '@/lib/userDataManager'
import Image from 'next/image'

interface UserSettings {
  firstName: string
  lastName: string
  email: string
  major: string
  studentId: string
  notifications: {
    email: boolean
    comments: boolean
    reminders: boolean
    aiAssistant: boolean
  }
  fontSize: string
  language: string
  twoFactor: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)
  const { theme, setTheme } = useTheme()
  
  const [settings, setSettings] = useState<UserSettings>({
    firstName: currentUser?.name?.split(' ')[0] || '',
    lastName: currentUser?.name?.split(' ').slice(1).join(' ') || '',
    email: currentUser?.email || '',
    major: 'هندسة البرمجيات',
    studentId: '2020123456',
    notifications: {
      email: true,
      comments: true,
      reminders: true,
      aiAssistant: true
    },
    fontSize: 'medium',
    language: 'ar',
    twoFactor: false
  })

  // ✅ التزامن مع بيانات المستخدم عند التحميل
  useEffect(() => {
    if (currentUser) {
      setSettings(prev => ({
        ...prev,
        firstName: currentUser.name?.split(' ')[0] || prev.firstName,
        lastName: currentUser.name?.split(' ').slice(1).join(' ') || prev.lastName,
        email: currentUser.email || prev.email
      }))
    }
  }, [currentUser])

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  // ✅ Load settings للمستخدم الحالي فقط
  useEffect(() => {
    if (!currentUser?.id) return
    
    const userSettings = loadUserData<any>(currentUser.id, 'settings')
    if (userSettings) {
      setSettings(userSettings)
    }
    // إذا لم يوجد إعدادات، يتم استخدام القيم الافتراضية من useState
  }, [currentUser?.id])

  // ✅ Save settings للمستخدم الحالي عند التغيير
  useEffect(() => {
    if (!currentUser?.id) return
    saveUserData(currentUser.id, 'settings', settings)
  }, [settings, currentUser?.id])

  // Apply font size setting
  useEffect(() => {
    const fontSize = 
      settings.fontSize === 'small' ? '14px' : 
      settings.fontSize === 'large' ? '18px' : '16px'
    document.documentElement.style.fontSize = fontSize
  }, [settings.fontSize])

  const saveSettings = () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء حفظ الإعدادات')
    }
  }

  const handlePasswordChange = () => {
    if (!passwords.current) {
      alert('الرجاء إدخال كلمة المرور الحالية')
      return
    }
    if (passwords.new !== passwords.confirm) {
      alert('كلمات المرور الجديدة غير متطابقة')
      return
    }
    if (passwords.new.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    // Here you would normally call an API
    alert('تم تغيير كلمة المرور بنجاح')
    setPasswords({ current: '', new: '', confirm: '' })
  }

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medad-data-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('حدث خطأ أثناء تصدير البيانات')
    }
  }

  const deleteAccount = () => {
    if (confirm('هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      if (confirm('تحذير أخير: سيتم حذف جميع بياناتك نهائياً!')) {
        localStorage.clear()
        alert('تم حذف الحساب. سيتم تحويلك إلى الصفحة الرئيسية.')
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
    }
  }

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'privacy', label: 'الخصوصية', icon: Shield },
    { id: 'data', label: 'البيانات', icon: Download }
  ]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 dark:text-dark-muted hover:text-medad-primary dark:hover:text-primary-400 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>رجوع</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-medad-ink dark:text-dark-text mb-2">
          الإعدادات
        </h1>
        <p className="text-gray-600 dark:text-dark-muted">
          إدارة حسابك وتفضيلاتك
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="card p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ x: 5 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-google transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-gray-600 dark:text-dark-muted hover:bg-medad-hover dark:hover:bg-dark-hover'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 card p-8">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text mb-6">
                الملف الشخصي
              </h2>

              {/* Profile Photo */}
              <div className="flex items-center gap-6 p-6 bg-medad-paper dark:bg-dark-hover rounded-google">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-dark-card shadow-lg flex-shrink-0">
                  {currentUser?.image ? (
                    <Image 
                      src={currentUser.image} 
                      alt={currentUser.name} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                      {settings.firstName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-medad-ink dark:text-dark-text mb-2">صورة الملف الشخصي</h3>
                  <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">PNG أو JPG (الحد الأقصى 2MB)</p>
                  <div className="flex gap-3">
                    <button className="btn-primary text-sm">رفع صورة</button>
                    <button className="btn-secondary text-sm">حذف</button>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                      الاسم الأول
                    </label>
                    <input
                      type="text"
                      value={settings.firstName}
                      onChange={(e) => setSettings({...settings, firstName: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                      اسم العائلة
                    </label>
                    <input
                      type="text"
                      value={settings.lastName}
                      onChange={(e) => setSettings({...settings, lastName: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({...settings, email: e.target.value})}
                      className="input-field pr-12"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                    التخصص
                  </label>
                  <input
                    type="text"
                    value={settings.major}
                    onChange={(e) => setSettings({...settings, major: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                    رقم الطالب
                  </label>
                  <input
                    type="text"
                    value={settings.studentId}
                    onChange={(e) => setSettings({...settings, studentId: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-medad-border dark:border-dark-border">
                {saved && (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400 mr-auto">
                    <Check className="w-5 h-5" />
                    تم الحفظ بنجاح
                  </span>
                )}
                <button className="btn-secondary" onClick={() => window.location.reload()}>إلغاء</button>
                <button className="btn-primary flex items-center gap-2" onClick={saveSettings}>
                  <Save className="w-5 h-5" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text mb-6">
                إعدادات الإشعارات
              </h2>

              <div className="space-y-4">
                {[
                  { key: 'email', label: 'إشعارات البريد الإلكتروني', description: 'تلقي رسائل بريد إلكتروني حول التحديثات والأحداث المهمة' },
                  { key: 'comments', label: 'إشعارات التعليقات', description: 'تنبيهات عند إضافة تعليقات جديدة من المشرف أو الزملاء' },
                  { key: 'reminders', label: 'تذكيرات المواعيد', description: 'تذكيرات قبل الاجتماعات والمواعيد النهائية المهمة' },
                  { key: 'aiAssistant', label: 'إشعارات المساعد الذكي', description: 'اقتراحات ونصائح ذكية تساعدك في تحسين بحثك' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-medad-paper dark:bg-dark-hover rounded-google">
                    <div>
                      <h3 className="font-medium text-medad-ink dark:text-dark-text mb-1">{item.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-dark-muted">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                        onChange={(e) => setSettings({
                          ...settings, 
                          notifications: {
                            ...settings.notifications,
                            [item.key]: e.target.checked
                          }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-medad-border dark:border-dark-border">
                {saved && (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400 mr-auto">
                    <Check className="w-5 h-5" />
                    تم الحفظ بنجاح
                  </span>
                )}
                <button className="btn-primary flex items-center gap-2" onClick={saveSettings}>
                  <Save className="w-5 h-5" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text mb-6">
                المظهر والتخصيص
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-medad-ink dark:text-dark-text mb-4">السمة / Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme('light')}
                      className={`p-6 border-2 rounded-google cursor-pointer transition-all ${
                        theme === 'light' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg' 
                          : 'border-medad-border dark:border-dark-border hover:border-primary-300'
                      }`}
                    >
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-24 rounded-lg mb-4 flex items-center justify-center shadow-md">
                        <Sun className="w-12 h-12 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-medad-ink dark:text-dark-text mb-1">الوضع الفاتح</p>
                        <p className="text-sm text-gray-600 dark:text-dark-muted">Light Mode</p>
                      </div>
                      {theme === 'light' && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">مفعّل</span>
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme('dark')}
                      className={`p-6 border-2 rounded-google cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg' 
                          : 'border-medad-border dark:border-dark-border hover:border-primary-300'
                      }`}
                    >
                      <div className="bg-gradient-to-br from-slate-700 to-slate-900 h-24 rounded-lg mb-4 flex items-center justify-center shadow-md">
                        <Moon className="w-12 h-12 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-medad-ink dark:text-dark-text mb-1">الوضع الداكن</p>
                        <p className="text-sm text-gray-600 dark:text-dark-muted">Dark Mode</p>
                      </div>
                      {theme === 'dark' && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">مفعّل</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-medad-ink dark:text-dark-text mb-3">حجم الخط / Font Size</h3>
                  <select 
                    value={settings.fontSize}
                    onChange={(e) => {
                      setSettings({...settings, fontSize: e.target.value})
                    }}
                    className="input-field"
                  >
                    <option value="small">صغير - Small (14px)</option>
                    <option value="medium">متوسط - Medium (16px)</option>
                    <option value="large">كبير - Large (18px)</option>
                  </select>
                  <p className="text-sm text-gray-500 dark:text-dark-muted mt-2">
                    سيتم تطبيق التغيير فوراً على جميع النصوص
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-medad-ink dark:text-dark-text mb-3">اللغة / Language</h3>
                  <select 
                    value={settings.language}
                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                    className="input-field"
                  >
                    <option value="ar">العربية - Arabic</option>
                    <option value="en">English - الإنجليزية</option>
                  </select>
                  <p className="text-sm text-gray-500 dark:text-dark-muted mt-2">
                    تغيير لغة واجهة التطبيق
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-medad-border dark:border-dark-border">
                {saved && (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400 mr-auto">
                    <Check className="w-5 h-5" />
                    تم الحفظ بنجاح
                  </span>
                )}
                <button className="btn-primary flex items-center gap-2" onClick={saveSettings}>
                  <Save className="w-5 h-5" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text mb-6">
                الخصوصية والأمان
              </h2>

              <div className="space-y-6">
                <div className="p-6 bg-medad-paper dark:bg-dark-hover rounded-google">
                  <h3 className="text-lg font-bold text-medad-ink dark:text-dark-text mb-4">تغيير كلمة المرور</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                        كلمة المرور الحالية
                      </label>
                      <input
                        type="password"
                        placeholder="أدخل كلمة المرور الحالية"
                        value={passwords.current}
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                        كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="أدخل كلمة المرور الجديدة (8 أحرف على الأقل)"
                          value={passwords.new}
                          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                          className="input-field pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <input
                        type="password"
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <button 
                      onClick={handlePasswordChange}
                      className="btn-primary w-full mt-2"
                      disabled={!passwords.current || !passwords.new || !passwords.confirm}
                    >
                      تحديث كلمة المرور
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-medad-paper dark:bg-dark-hover rounded-google">
                  <div>
                    <h3 className="font-medium text-medad-ink dark:text-dark-text mb-1 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-600" />
                      المصادقة الثنائية (2FA)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-dark-muted">
                      أضف طبقة أمان إضافية لحسابك باستخدام رمز التحقق
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.twoFactor}
                      onChange={(e) => {
                        setSettings({...settings, twoFactor: e.target.checked})
                        if (e.target.checked) {
                          alert('سيتم إرسال رمز التحقق إلى بريدك الإلكتروني')
                        }
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-medad-border dark:border-dark-border">
                {saved && (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400 mr-auto">
                    <Check className="w-5 h-5" />
                    تم الحفظ بنجاح
                  </span>
                )}
                <button className="btn-primary flex items-center gap-2" onClick={saveSettings}>
                  <Save className="w-5 h-5" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'data' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text mb-6">
                إدارة البيانات
              </h2>

              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-primary-50 dark:from-blue-900/20 dark:to-primary-900/20 border border-blue-200 dark:border-blue-800 rounded-google">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
                      <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-medad-ink dark:text-dark-text mb-2">تصدير البيانات</h3>
                      <p className="text-gray-600 dark:text-dark-muted mb-4">
                        احصل على نسخة كاملة من جميع بياناتك وإعداداتك بصيغة JSON. 
                        يمكنك استخدام هذه النسخة للحفظ الاحتياطي أو النقل.
                      </p>
                      <button onClick={exportData} className="btn-secondary flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        <span>تنزيل بياناتي</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-google">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-xl">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 dark:text-red-400 mb-2">⚠️ منطقة الخطر</h3>
                      <p className="text-red-700 dark:text-red-300 mb-4">
                        حذف حسابك وجميع بياناتك نهائياً. هذا الإجراء <strong>لا يمكن التراجع عنه</strong>!
                        سيتم حذف جميع المعلومات، المصادر، الملاحظات، والإعدادات الخاصة بك.
                      </p>
                      <button 
                        onClick={deleteAccount} 
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-google font-medium transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>حذف الحساب نهائياً</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
