"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { loginWithGoogle } = useUser();

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const result = await loginWithGoogle();

      if (result.success) {
        router.push(redirectTo);
      } else {
        setError(result.error || "فشل تسجيل الدخول باستخدام قوقل");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-6xl grid md:grid-cols-2 gap-8 relative z-10"
      >
        {/* القسم الأيمن - الترحيب والإلهام */}
        <motion.div
          variants={itemVariants}
          className="hidden md:flex flex-col justify-center p-12 bg-white/40 dark:bg-dark-card/40 backdrop-blur-sm rounded-[24px] border border-white/60 dark:border-dark-border shadow-google-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-3 rounded-2xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl font-bold text-medad-ink">
                مداد<span className="text-primary-600">.</span>
              </h1>
            </div>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold text-medad-ink dark:text-dark-text mb-4 leading-relaxed"
          >
            رحلة بحثك الأكاديمي
            <br />
            <span className="text-primary-600 dark:text-primary-400">
              تبدأ من هنا
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-600 dark:text-dark-muted mb-8 leading-relaxed"
          >
            نظام متكامل لإدارة أبحاث التخرج بتجربة ملهمة واحترافية، مصمم خصيصاً
            للبيئة الأكاديمية العربية
          </motion.p>

          <motion.div variants={itemVariants} className="space-y-4">
            {[
              { icon: Sparkles, text: "مساعد ذكي لدعم بحثك" },
              { icon: BookOpen, text: "إدارة مصادر ومراجع متقدمة" },
              { icon: GraduationCap, text: "تواصل مباشر مع المشرف" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3 text-medad-ink dark:text-dark-text"
                whileHover={{ x: 10, transition: { duration: 0.2 } }}
              >
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                  <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* القسم الأيسر - نموذج تسجيل الدخول */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-dark-card rounded-[24px] shadow-google-lg dark:shadow-dark p-8 md:p-12 border border-medad-border dark:border-dark-border flex flex-col justify-center"
        >
          <motion.div variants={itemVariants} className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-medad-ink dark:text-dark-text mb-4">
              مرحباً بك في مداد
            </h3>
            <p className="text-gray-600 dark:text-dark-muted">
              استخدم حساب قوقل الخاص بك للوصول إلى النظام
            </p>
          </motion.div>

          {/* زر تسجيل الدخول باستخدام قوقل */}
          <motion.button
            variants={itemVariants}
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="relative flex items-center justify-center gap-4 px-8 py-4 bg-white dark:bg-dark-hover border-2 border-medad-border dark:border-dark-border rounded-google shadow-sm hover:shadow-google-lg dark:hover:shadow-dark text-medad-ink dark:text-dark-text font-bold text-lg transition-all duration-300 group overflow-hidden"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>جارٍ الاتصال...</span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                <span>تسجيل الدخول باستخدام قوقل</span>
              </>
            )}
          </motion.button>

          {/* رسالة الخطأ */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-google text-red-600 dark:text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={itemVariants}
            className="mt-12 p-6 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30 rounded-google"
          >
            <p className="text-sm text-primary-800 dark:text-primary-300 leading-relaxed text-center font-medium">
              سيتم إنشاء حسابك تلقائياً عند أول عملية تسجيل دخول إذا لم يكن لديك حساب مسبقاً.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
