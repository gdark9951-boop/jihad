"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Save,
  Download,
  Share2,
  Sparkles,
  Eye,
  Settings,
  MoreVertical,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  ArrowRight,
  Check,
  ChevronDown,
  FileDown,
} from "lucide-react";
import AIAssistant from "@/components/AIAssistant";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useNotifications } from "@/contexts/NotificationContext";
import { useUser } from "@/contexts/UserContext";
import {
  getUserResearch,
  saveResearch,
  getUserSources,
  getUserTasks,
} from "@/lib/firestoreData";

interface ResearchData {
  title: string;
  content: string;
  wordCount: number;
  lastSaved: string;
}

export default function ResearchPage() {
  const router = useRouter();
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // ✅ تحميل المحتوى من Supabase
  useEffect(() => {
    if (!user?.id) return;

    const loadResearch = async () => {
      const research = await getUserResearch(user.id);
      if (research) {
        setContent(research.content || "");
        if (editorRef.current) {
          editorRef.current.innerHTML = research.content || "";
        }
        setWordCount(
          research.content?.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length || 0,
        );
        setLastSaved(
          research.updated_at ? new Date(research.updated_at) : null,
        );
      } else {
        setContent("");
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        setWordCount(0);
        setLastSaved(null);
      }
    };

    loadResearch();
  }, [user?.id]);

  // إغلاق قائمة التحميل عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      if (!silent) setIsSaving(true);

      // ✅ حفظ في Supabase
      await saveResearch(user.id, {
        title: "بحثي",
        content: content,
        word_count: wordCount,
        status: "in_progress",
      });
      setLastSaved(new Date());

      if (!silent) {
        setTimeout(() => {
          setIsSaving(false);
          setShowSavedNotification(true);
          setTimeout(() => setShowSavedNotification(false), 2000);

          // إضافة إشعار
          addNotification({
            type: "research",
            title: "تم حفظ البحث",
            message: `تم حفظ بحثك بنجاح (${wordCount} كلمة)`,
            link: "/dashboard/research",
          });
        }, 500);
      }
    },
    [content, wordCount, user?.id, addNotification],
  );

  // حفظ تلقائي كل 30 ثانية
  useEffect(() => {
    if (!content) return;

    const autoSaveInterval = setInterval(() => {
      handleSave(true); // حفظ صامت
    }, 30000); // 30 ثانية

    return () => clearInterval(autoSaveInterval);
  }, [content, handleSave]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "بحثي.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // إضافة خط يدعم العربية (سنستخدم خط افتراضي)
      doc.setFont("helvetica");
      doc.setFontSize(12);

      // تقسيم النص إلى أسطر
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      const lineHeight = 7;
      let yPosition = margin;

      // إضافة العنوان
      doc.setFontSize(16);
      doc.text(
        "تطبيقات الذكاء الاصطناعي في التعليم",
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );
      yPosition += lineHeight * 2;

      // إضافة المحتوى
      doc.setFontSize(12);
      const lines = content.split("\n");

      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        const wrappedLines = doc.splitTextToSize(line || " ", maxWidth);
        for (const wrappedLine of wrappedLines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(wrappedLine, margin, yPosition, { align: "right" });
          yPosition += lineHeight;
        }
      }

      doc.save("بحثي.pdf");
      setShowDownloadMenu(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const paragraphs = content.split("\n").map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                text: line || " ",
                font: "Arial",
                size: 24, // 12pt
                rightToLeft: true,
              }),
            ],
            bidirectional: true,
            alignment: "right",
          }),
      );

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "تطبيقات الذكاء الاصطناعي في التعليم",
                    font: "Arial",
                    size: 32, // 16pt
                    bold: true,
                    rightToLeft: true,
                  }),
                ],
                bidirectional: true,
                alignment: "center",
                spacing: {
                  after: 400,
                },
              }),
              ...paragraphs,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "بحثي.docx");
      setShowDownloadMenu(false);
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("حدث خطأ أثناء إنشاء ملف Word");
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      setContent(html);
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
    }
  };

  const handleManualTrigger = () => {
    const selection = window.getSelection();
    const selected = selection ? selection.toString() : "";
    
    if (selected.trim()) {
      setSelectedText(selected);
      addNotification({
        type: "research",
        title: "تم تحديد النص",
        message: "تم إرسال النص المحدد للمساعد الذكي",
        link: "#",
      });
    } else if (editorRef.current?.innerText.trim()) {
      setSelectedText(editorRef.current.innerText);
      addNotification({
        type: "research",
        title: "تم تحديد النص بالكامل",
        message: "تم إرسال النص بالكامل للمساعد الذكي",
        link: "#",
      });
    }
  };

  const handleApplySuggestion = (aiText: string) => {
    if (!editorRef.current) return;

    // Use insertText if possible to maintain selection context, or just append
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(aiText);
      range.insertNode(textNode);
      
      // Update state
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
        setWordCount(editorRef.current.innerText.trim().split(/\s+/).filter(Boolean).length);
      }
    } else {
      const newContent = content + " " + aiText;
      setContent(newContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = newContent;
      }
    }

    setSelectedText("");
  };

  const applyFormatting = (type: string) => {
    if (!editorRef.current) return;
    
    document.execCommand('styleWithCSS', false, "true");

    switch (type) {
      case "bold":
        document.execCommand("bold", false);
        break;
      case "italic":
        document.execCommand("italic", false);
        break;
      case "list":
        document.execCommand("insertUnorderedList", false);
        break;
      case "list-ordered":
        document.execCommand("insertOrderedList", false);
        break;
      case "quote":
        document.execCommand("formatBlock", false, "blockquote");
        break;
      case "code":
        document.execCommand("formatBlock", false, "pre");
        break;
      default:
        return;
    }
    
    setContent(editorRef.current.innerHTML);
  };

  const toolbarButtons = [
    { id: "bold", icon: Bold, label: "غامق" },
    { id: "italic", icon: Italic, label: "مائل" },
    { id: "list", icon: List, label: "قائمة" },
    { id: "list-ordered", icon: ListOrdered, label: "قائمة مرقمة" },
    { id: "quote", icon: Quote, label: "اقتباس" },
    { id: "code", icon: Code, label: "كود" },
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
            تطبيقات الذكاء الاصطناعي في التعليم
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600 dark:text-dark-muted">
              {lastSaved
                ? `آخر حفظ: ${lastSaved.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`
                : "لم يتم الحفظ بعد"}
            </p>
            <AnimatePresence>
              {showSavedNotification && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>تم الحفظ</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={downloadMenuRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>تحميل</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showDownloadMenu ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-medad-border dark:border-dark-border overflow-hidden z-10"
                >
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full px-4 py-3 text-right hover:bg-medad-hover dark:hover:bg-dark-hover transition-colors flex items-center gap-3"
                  >
                    <FileDown className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium text-medad-ink dark:text-dark-text">
                        ملف PDF
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">
                        صيغة احترافية
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownloadDocx}
                    className="w-full px-4 py-3 text-right hover:bg-medad-hover dark:hover:bg-dark-hover transition-colors flex items-center gap-3 border-t border-medad-border dark:border-dark-border"
                  >
                    <FileDown className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-medad-ink dark:text-dark-text">
                        ملف Word
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">
                        قابل للتحرير
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-3 text-right hover:bg-medad-hover dark:hover:bg-dark-hover transition-colors flex items-center gap-3 border-t border-medad-border dark:border-dark-border"
                  >
                    <FileDown className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-medad-ink dark:text-dark-text">
                        ملف نصي
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">
                        نص بسيط
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="w-5 h-5" />
                </motion.div>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="card p-4">
            <div className="flex items-center gap-2 flex-wrap">
              {toolbarButtons.map((btn, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyFormatting(btn.id)}
                  className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
                  title={btn.label}
                >
                  <btn.icon className="w-5 h-5 text-gray-600 dark:text-dark-text" />
                </motion.button>
              ))}
              <div className="h-6 w-px bg-medad-border dark:bg-dark-border mx-2"></div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualTrigger}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:shadow-lg transition-all"
                title="إرسال النص المكتوب للمساعد الذكي فوراً"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">تأكيد النص</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">مساعد الذكاء</span>
              </motion.button>
            </div>
          </div>

          {/* Editor */}
          <div className="card p-8 min-h-[600px] relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="w-full h-full min-h-[500px] outline-none text-lg leading-relaxed text-medad-ink dark:text-dark-text bg-transparent placeholder:text-gray-400 dark:placeholder:text-dark-muted proverb-editor"
              dir="rtl"
              suppressContentEditableWarning={true}
            />
            {!content && (
              <div className="absolute top-8 right-8 text-gray-400 pointer-events-none">
                ابدأ الكتابة هنا...
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="card p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span className="text-gray-600 dark:text-dark-muted">
                  <strong className="text-medad-ink dark:text-dark-text">
                    {wordCount}
                  </strong>{" "}
                  كلمة
                </span>
                <span className="text-gray-600 dark:text-dark-muted">
                  <strong className="text-medad-ink dark:text-dark-text">
                    {content.length}
                  </strong>{" "}
                  حرف
                </span>
                <span className="text-gray-600 dark:text-dark-muted">
                  وقت القراءة:{" "}
                  <strong className="text-medad-ink dark:text-dark-text">
                    {Math.ceil(wordCount / 200)}
                  </strong>{" "}
                  دقيقة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-600 dark:text-dark-muted">
                  تم الحفظ تلقائياً
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Sources & AI */}
        <div className="space-y-4">
          {/* AI Assistant Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800/30"
          >
            <AIAssistant
              selectedText={selectedText}
              onApplySuggestion={handleApplySuggestion}
            />
          </motion.div>

          {/* Quick Sources */}
          <div className="card p-6">
            <h3 className="font-bold text-medad-ink dark:text-dark-text mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              مصادر سريعة
            </h3>
            <div className="space-y-3">
              {[
                { title: "الذكاء الاصطناعي في التعليم.pdf", pages: "245 صفحة" },
                { title: "Machine Learning Basics.pdf", pages: "180 صفحة" },
                { title: "دراسة تطبيقية.docx", pages: "45 صفحة" },
              ].map((source, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="p-3 bg-medad-paper dark:bg-dark-hover hover:bg-medad-hover dark:hover:bg-dark-border rounded-lg transition-all cursor-pointer border border-medad-border dark:border-dark-border"
                >
                  <p className="font-medium text-sm text-medad-ink dark:text-dark-text mb-1">
                    {source.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">
                    {source.pages}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chapter Progress */}
          <div className="card p-6">
            <h3 className="font-bold text-medad-ink dark:text-dark-text mb-4">
              تقدم الفصول
            </h3>
            <div className="space-y-3">
              {[
                { name: "المقدمة", progress: 100 },
                { name: "الإطار النظري", progress: 85 },
                { name: "الدراسات السابقة", progress: 70 },
                { name: "المنهجية", progress: 30 },
                { name: "النتائج", progress: 0 },
              ].map((chapter, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-medad-ink dark:text-dark-text">
                      {chapter.name}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-dark-muted">
                      {chapter.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-medad-paper dark:bg-dark-hover rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${chapter.progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full ${
                        chapter.progress === 100
                          ? "bg-green-500"
                          : chapter.progress > 50
                            ? "bg-primary-500"
                            : "bg-orange-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
