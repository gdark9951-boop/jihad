"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useUser } from "./UserContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  Timestamp,
  deleteDoc,
  getDocs
} from "firebase/firestore";

export interface Notification {
  id: string;
  type:
    | "message"
    | "deadline"
    | "research"
    | "system"
    | "info"
    | "warning"
    | "success"
    | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // ✅ تحميل الإشعارات من Firestore
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, "users", user.id, "notifications"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const mappedNotifications: Notification[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "info",
          title: data.title,
          message: data.message,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
          read: data.read || false,
          link: data.link
        };
      });
      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, [user?.id]);

  // ✅ تحميل الإشعارات من Supabase عند تحميل المكون
  useEffect(() => {
    setMounted(true);
    if (!user?.id) return;

    loadNotifications();
  }, [user?.id, loadNotifications]);

  // ✅ الاستماع للتحديثات في الوقت الفعلي من Firestore
  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "users", user.id, "notifications"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mappedNotifications: Notification[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "info",
          title: data.title,
          message: data.message,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
          read: data.read || false,
          link: data.link
        };
      });
      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const addNotification = async (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => {
    if (!user?.id) return;

    try {
      await addDoc(collection(db, "users", user.id, "notifications"), {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        read: false,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error adding notification:", error);
      // Fallback local only
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }

    // إشعار متصفح
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/icon.png",
      });
    }
  };

  const markAsRead = async (id: string) => {
    if (!user?.id) return;

    // ✅ تحديث في Firestore
    try {
      const notificationRef = doc(db, "users", user.id, "notifications", id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, "users", user.id, "notifications"),
        where("read", "==", false)
      );
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map((d) => 
        updateDoc(d.ref, { read: true })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user?.id) return;

    try {
      const notificationRef = doc(db, "users", user.id, "notifications", id);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAll = async () => {
    if (!user?.id) return;

    try {
      const q = query(collection(db, "users", user.id, "notifications"));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return default values during SSR/build time
    if (typeof window === "undefined") {
      return {
        notifications: [],
        unreadCount: 0,
        addNotification: () => {},
        markAsRead: () => {},
        markAllAsRead: () => {},
        deleteNotification: () => {},
        clearAll: () => {},
      };
    }
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
}
