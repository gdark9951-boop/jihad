"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  Search,
  Filter,
  Plus,
  BookMarked,
  Link as LinkIcon,
  Calendar,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import {
  getUserSources,
  addSource as addSourceDB,
  deleteSource as deleteSourceDB,
} from "@/lib/firestoreData";

interface Source {
  id: number;
  title: string;
  type: string;
  size: string;
  pages: number;
  uploadDate: string;
  citations: number;
  color: string;
  file?: File;
  url?: string;
}

export default function SourcesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // معلومات الملف المراد رفعه
  const [uploadFile, setUploadFile] = useState<{
    file: File | null;
    title: string;
    pages: number;
    citations: number;
  }>({
    file: null,
    title: "",
    pages: 0,
    citations: 0,
  });

  // ✅ تحميل المصادر من Supabase
  useEffect(() => {
    if (!user?.id) return;

    const loadSources = async () => {
      const dbSources = await getUserSources(user.id);
      if (dbSources && dbSources.length > 0) {
        const mappedSources: Source[] = dbSources.map((s, index) => ({
          id: index + 1,
          dbId: s.id,
          title: s.title,
          type: s.type || "pdf",
          size: "—",
          pages: 0,
          uploadDate:
            s.created_at?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          citations: 0,
          color: [
            "from-red-500 to-red-600",
            "from-blue-500 to-blue-600",
            "from-green-500 to-green-600",
            "from-purple-500 to-purple-600",
          ][index % 4],
        }));
        setSources(mappedSources);
      } else {
        setSources([]);
      }
    };

    loadSources();
  }, [user?.id]);

  // ✅ الحفظ يتم عند الإضافة/الحذف مباشرة في Supabase

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // التحقق من نوع الملف
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("نوع الملف غير مدعوم. يرجى رفع ملف PDF أو Word أو TXT");
      return;
    }

    // التحقق من حجم الملف (50 MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("حجم الملف كبير جداً. الحد الأقصى 50 MB");
      return;
    }

    const fileName = file.name.replace(/\.[^/.]+$/, ""); // إزالة الامتداد
    setUploadFile({
      file,
      title: fileName,
      pages: Math.floor(Math.random() * 200) + 10, // تقدير عشوائي للصفحات
      citations: 0,
    });
    setShowUploadModal(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile.file || !uploadFile.title) {
      alert("الرجاء إدخال عنوان المصدر");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // محاكاة رفع الملف
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // الانتظار حتى اكتمال الرفع
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const fileExtension =
      uploadFile.file.name.split(".").pop()?.toLowerCase() || "pdf";
    const fileSizeInMB = (uploadFile.file.size / (1024 * 1024)).toFixed(1);

    const colors = [
      "from-red-500 to-red-600",
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newSource: Source = {
      id: Date.now(),
      title: uploadFile.title,
      type: fileExtension,
      size: `${fileSizeInMB} MB`,
      pages: uploadFile.pages,
      uploadDate: new Date().toISOString().split("T")[0],
      citations: uploadFile.citations,
      color: randomColor,
      file: uploadFile.file,
    };

    setSources((prev) => [newSource, ...prev]);

    // ✅ حفظ في Supabase
    if (user?.id) {
      await addSourceDB(user.id, {
        title: uploadFile.title,
        type:
          fileExtension === "pdf"
            ? "article"
            : fileExtension === "docx"
              ? "book"
              : "other",
        notes: `${fileSizeInMB} MB - ${uploadFile.pages} صفحة`,
      });
    }

    // حفظ اسم الملف للإشعار
    setUploadedFileName(uploadFile.title);

    setUploading(false);
    setUploadProgress(0);

    // إغلاق المودال بعد ثانية
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadFile({
        file: null,
        title: "",
        pages: 0,
        citations: 0,
      });

      // إظهار إشعار النجاح
      setShowSuccessNotification(true);

      // إخفاء الإشعار بعد 4 ثواني
      setTimeout(() => {
        setShowSuccessNotification(false);
        setUploadedFileName("");
      }, 4000);
    }, 1000);
  };

  const handleDeleteSource = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المصدر؟")) {
      const sourceToDelete = sources.find((s) => s.id === id);
      // ✅ حذف من Supabase
      if (user?.id && (sourceToDelete as any)?.dbId) {
        await deleteSourceDB((sourceToDelete as any).dbId, user.id);
      }
      setSources((prev) => prev.filter((source) => source.id !== id));
    }
  };

  const handleDownloadSource = (source: Source) => {
    if (source.file) {
      const url = URL.createObjectURL(source.file);
      const a = document.createElement("a");
      a.href = url;
      a.download = source.file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("هذا مصدر افتراضي. يمكنك تحميل المصادر التي رفعتها فقط.");
    }
  };

  const filteredSources = sources.filter((source) => {
    const matchesSearch = source.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || source.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: "إجمالي المصادر", value: sources.length, icon: FileText },
    {
      label: "الاقتباسات",
      value: sources.reduce((sum, s) => sum + s.citations, 0),
      icon: BookMarked,
    },
    {
      label: "تم الرفع هذا الشهر",
      value: sources.filter((s) => {
        const date = new Date(s.uploadDate);
        const now = new Date();
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }).length,
      icon: Upload,
    },
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-medad-ink dark:text-dark-text mb-2">
            مكتبة المصادر
          </h1>
          <p className="text-gray-600 dark:text-dark-muted">
            إدارة مصادرك ومراجعك البحثية
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>رفع مصدر جديد</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl">
                <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-dark-muted text-sm">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-medad-ink dark:text-dark-text">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المصادر..."
              className="w-full pr-12 pl-4 py-3 bg-medad-paper dark:bg-dark-hover border border-medad-border dark:border-dark-border rounded-google focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-medad-paper dark:bg-dark-hover border border-medad-border dark:border-dark-border rounded-google focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">جميع الأنواع</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word</option>
            <option value="doc">Word (القديم)</option>
            <option value="txt">نص</option>
          </select>
        </div>
      </div>

      {/* Sources Grid */}
      {filteredSources.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-medad-ink dark:text-dark-text mb-2">
            لا توجد مصادر
          </h3>
          <p className="text-gray-600 dark:text-dark-muted mb-4">
            ابدأ برفع مصادرك البحثية
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>رفع مصدر جديد</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSources.map((source, index) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="card p-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`bg-gradient-to-br ${source.color} p-4 rounded-xl shadow-lg flex-shrink-0`}
                >
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-medad-ink dark:text-dark-text mb-2 truncate">
                    {source.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-dark-muted mb-3">
                    <span>{source.pages} صفحة</span>
                    <span>•</span>
                    <span>{source.size}</span>
                    <span>•</span>
                    <span className="uppercase">{source.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted">
                      <Calendar className="w-4 h-4" />
                      <span>{source.uploadDate}</span>
                    </div>
                    <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                      {source.citations} اقتباس
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-medad-border dark:border-dark-border">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-google hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">عرض</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownloadSource(source)}
                  className="px-4 py-2 bg-medad-paper dark:bg-dark-hover hover:bg-medad-hover dark:hover:bg-dark-border rounded-google transition-colors"
                  title="تحميل"
                >
                  <Download className="w-4 h-4 text-gray-600 dark:text-dark-text" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteSource(source.id)}
                  className="px-4 py-2 bg-medad-paper dark:bg-dark-hover hover:bg-red-50 dark:hover:bg-red-900/20 rounded-google transition-colors group"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-dark-text group-hover:text-red-600" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-card rounded-google shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-medad-border dark:border-dark-border flex items-center justify-between">
                <h2 className="text-2xl font-bold text-medad-ink dark:text-dark-text">
                  رفع مصدر جديد
                </h2>
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  disabled={uploading}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {!uploadFile.file ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-google p-12 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-medad-border dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-600"
                    }`}
                  >
                    <Upload
                      className={`w-16 h-16 mx-auto mb-4 ${dragActive ? "text-primary-600" : "text-gray-400"}`}
                    />
                    <h3 className="text-lg font-bold text-medad-ink dark:text-dark-text mb-2">
                      {dragActive
                        ? "أفلت الملف هنا"
                        : "اسحب الملف أو انقر للاختيار"}
                    </h3>
                    <p className="text-gray-600 dark:text-dark-muted mb-4">
                      يدعم: PDF, DOCX, DOC, TXT (حتى 50 MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* File Info */}
                    <div className="flex items-center gap-4 p-4 bg-medad-paper dark:bg-dark-hover rounded-google">
                      <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-xl">
                        <File className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-medad-ink dark:text-dark-text truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                          {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() =>
                            setUploadFile({
                              file: null,
                              title: "",
                              pages: 0,
                              citations: 0,
                            })
                          }
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-google transition-colors"
                        >
                          <X className="w-5 h-5 text-red-600" />
                        </button>
                      )}
                    </div>

                    {/* Form Fields */}
                    <div>
                      <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                        عنوان المصدر *
                      </label>
                      <input
                        type="text"
                        value={uploadFile.title}
                        onChange={(e) =>
                          setUploadFile({
                            ...uploadFile,
                            title: e.target.value,
                          })
                        }
                        placeholder="أدخل عنوان المصدر"
                        disabled={uploading}
                        className="input-field"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                          عدد الصفحات (تقريبي)
                        </label>
                        <input
                          type="number"
                          value={uploadFile.pages || ""}
                          onChange={(e) =>
                            setUploadFile({
                              ...uploadFile,
                              pages: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="مثال: 150"
                          disabled={uploading}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-medad-ink dark:text-dark-text mb-2">
                          عدد الاقتباسات
                        </label>
                        <input
                          type="number"
                          value={uploadFile.citations || ""}
                          onChange={(e) =>
                            setUploadFile({
                              ...uploadFile,
                              citations: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="مثال: 5"
                          disabled={uploading}
                          className="input-field"
                        />
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-dark-muted">
                            جاري الرفع...
                          </span>
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="h-2 bg-medad-paper dark:bg-dark-hover rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-primary-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {uploadFile.file && (
                <div className="p-6 border-t border-medad-border dark:border-dark-border flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="btn-secondary disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadFile.title}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري الرفع...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>رفع المصدر</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white dark:bg-dark-card rounded-google shadow-2xl border-2 border-green-500 p-4 flex items-center gap-4 min-w-[320px]">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-medad-ink dark:text-dark-text mb-1">
                  تم الرفع بنجاح!
                </h3>
                <p className="text-sm text-gray-600 dark:text-dark-muted">
                  {uploadedFileName}
                </p>
              </div>
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="p-1 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
