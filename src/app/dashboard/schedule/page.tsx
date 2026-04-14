"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Bell,
  ArrowRight,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useUser } from "@/contexts/UserContext";
import {
  getUserTasks,
  addTask as addTaskDB,
  updateTask as updateTaskDB,
  deleteTask as deleteTaskDB,
} from "@/lib/firestoreData";

export default function SchedulePage() {
  const router = useRouter();
  const { user } = useUser();
  const { addNotification } = useNotifications();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);

  // ✅ تحميل الأحداث من Supabase
  useEffect(() => {
    if (!user?.id) return;

    const loadEvents = async () => {
      const tasks = await getUserTasks(user.id);
      if (tasks && tasks.length > 0) {
        const mappedEvents = tasks.map((t) => ({
          id: t.id,
          title: t.title,
          date: t.due_date || new Date().toISOString(),
          type: t.priority === "high" ? "deadline" : "meeting",
          description: t.description,
          status: t.status,
          completed: t.status === "completed",
        }));
        setEvents(mappedEvents);
      } else {
        setEvents([]);
      }
    };

    loadEvents();
  }, [user?.id]);

  // ✅ الحفظ يتم مباشرة في Supabase عند الإضافة/التحديث

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // التحقق من المواعيد النهائية القريبة
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      events.forEach((event) => {
        const eventDate = new Date(event.date);

        // إشعار للمواعيد النهائية خلال 3 أيام
        if (
          event.type === "deadline" &&
          eventDate >= now &&
          eventDate <= threeDaysFromNow
        ) {
          const daysRemaining = Math.ceil(
            (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          const hasNotified = localStorage.getItem(
            `deadline_notified_${event.id}`,
          );
          if (!hasNotified) {
            addNotification({
              type: "deadline",
              title: "موعد نهائي قريب",
              message: `تبقى ${daysRemaining} ${daysRemaining === 1 ? "يوم" : "أيام"} على ${event.title}`,
              link: "/dashboard/schedule",
            });
            localStorage.setItem(`deadline_notified_${event.id}`, "true");
          }
        }
      });
    };

    checkDeadlines();
  }, [addNotification, events]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Users className="w-5 h-5" />;
      case "deadline":
        return <Clock className="w-5 h-5" />;
      case "workshop":
        return <Video className="w-5 h-5" />;
      case "review":
        return <FileText className="w-5 h-5" />;
      default:
        return <CalendarIcon className="w-5 h-5" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "meeting":
        return "اجتماع";
      case "deadline":
        return "موعد نهائي";
      case "workshop":
        return "ورشة عمل";
      case "review":
        return "مراجعة";
      default:
        return "حدث";
    }
  };

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
            الجدول الزمني
          </h1>
          <p className="text-gray-600 dark:text-dark-muted">
            إدارة مواعيدك وأحداثك الأكاديمية
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة حدث</span>
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-medad-ink dark:text-dark-text">
              {currentMonth.toLocaleDateString("ar-SA", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.setMonth(currentMonth.getMonth() - 1),
                    ),
                  )
                }
              >
                <ChevronRight className="w-5 h-5 text-medad-ink dark:text-dark-text" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-medad-paper dark:bg-dark-hover hover:bg-medad-hover dark:hover:bg-dark-border rounded-google text-medad-ink dark:text-dark-text"
                onClick={() => setCurrentMonth(new Date())}
              >
                اليوم
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-medad-hover dark:hover:bg-dark-hover rounded-google"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.setMonth(currentMonth.getMonth() + 1),
                    ),
                  )
                }
              >
                <ChevronLeft className="w-5 h-5 text-medad-ink dark:text-dark-text" />
              </motion.button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {[
              "الأحد",
              "الاثنين",
              "الثلاثاء",
              "الأربعاء",
              "الخميس",
              "الجمعة",
              "السبت",
            ].map((day) => (
              <div
                key={day}
                className="text-center font-bold text-gray-600 dark:text-dark-muted text-sm py-2"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => i + 1).map((day) => {
              const hasEvent = events.some(
                (e) => new Date(e.date).getDate() === day,
              );
              const isToday = day === new Date().getDate();

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  className={`aspect-square flex items-center justify-center rounded-google cursor-pointer text-sm ${
                    isToday
                      ? "bg-primary-600 dark:bg-primary-500 text-white font-bold"
                      : hasEvent
                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium"
                        : "hover:bg-medad-hover dark:hover:bg-dark-hover text-gray-700 dark:text-dark-text"
                  }`}
                >
                  {day}
                  {hasEvent && !isToday && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-medad-ink dark:text-dark-text mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              الأحداث القادمة
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="p-4 bg-medad-paper dark:bg-dark-hover rounded-google hover:bg-medad-hover dark:hover:bg-dark-border transition-all cursor-pointer border-r-4 border-primary-500 dark:border-primary-400"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`bg-gradient-to-br ${event.color} p-2 rounded-lg text-white`}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-medad-ink dark:text-dark-text text-sm mb-1 truncate">
                        {event.title}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-muted">
                          <CalendarIcon className="w-3 h-3" />
                          <span>
                            {new Date(event.date).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-muted">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-muted">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-white dark:bg-dark-card text-medad-ink dark:text-dark-text rounded-full">
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="font-bold text-medad-ink dark:text-dark-text mb-4">
              إحصائيات سريعة
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-medad-paper dark:bg-dark-hover rounded-google">
                <span className="text-sm text-gray-600 dark:text-dark-muted">
                  اجتماعات هذا الشهر
                </span>
                <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                  4
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-medad-paper dark:bg-dark-hover rounded-google">
                <span className="text-sm text-gray-600 dark:text-dark-muted">
                  مواعيد نهائية قادمة
                </span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">
                  2
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-medad-paper dark:bg-dark-hover rounded-google">
                <span className="text-sm text-gray-600 dark:text-dark-muted">
                  ورش عمل
                </span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Events List */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-medad-ink dark:text-dark-text mb-6">
          جميع الأحداث
        </h2>
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 bg-medad-paper dark:bg-dark-hover rounded-google hover:bg-medad-hover dark:hover:bg-dark-border transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`bg-gradient-to-br ${event.color} p-4 rounded-xl text-white shadow-lg`}
                >
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-medad-ink dark:text-dark-text text-lg">
                      {event.title}
                    </h3>
                    <span className="text-xs px-3 py-1 bg-white dark:bg-dark-card text-medad-ink dark:text-dark-text rounded-full">
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-dark-muted">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.attendees && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
