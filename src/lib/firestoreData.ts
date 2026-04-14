import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  addDoc,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";

// =====================================================
// Interfaces
// =====================================================

export interface ResearchProject {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  content?: string;
  word_count?: number;
  status?: "planning" | "in_progress" | "completed";
  created_at?: any;
  updated_at?: any;
}

export interface Source {
  id?: string;
  user_id?: string;
  research_id?: string;
  title: string;
  author?: string;
  url?: string;
  type: "book" | "article" | "website" | "other";
  notes?: string;
  created_at?: any;
}

export interface ScheduleTask {
  id?: string;
  user_id?: string;
  research_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status?: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  created_at?: any;
}

// =====================================================
// Research - مشاريع البحث
// =====================================================

export async function getUserResearch(userId: string): Promise<ResearchProject | null> {
  try {
    const q = query(
      collection(db, "research_projects"),
      where("user_id", "==", userId),
      orderBy("updated_at", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const data = querySnapshot.docs[0].data();
    return { id: querySnapshot.docs[0].id, ...data } as ResearchProject;
  } catch (error) {
    console.error("Error in getUserResearch:", error);
    return null;
  }
}

export async function saveResearch(userId: string, research: ResearchProject): Promise<boolean> {
  try {
    const existing = await getUserResearch(userId);
    const researchData = {
      user_id: userId,
      title: research.title || "بحثي",
      content: research.content || "",
      word_count: research.word_count || 0,
      status: research.status || "in_progress",
      updated_at: Timestamp.now(),
    };

    if (existing?.id) {
      await updateDoc(doc(db, "research_projects", existing.id), researchData);
    } else {
      await addDoc(collection(db, "research_projects"), {
        ...researchData,
        created_at: Timestamp.now(),
      });
    }
    return true;
  } catch (error) {
    console.error("Error in saveResearch:", error);
    return false;
  }
}

// =====================================================
// Sources - المصادر
// =====================================================

export async function getUserSources(userId: string): Promise<Source[]> {
  try {
    const q = query(
      collection(db, "sources"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Source[];
  } catch (error) {
    console.error("Error in getUserSources:", error);
    return [];
  }
}

export async function addSource(userId: string, source: Source): Promise<boolean> {
  try {
    await addDoc(collection(db, "sources"), {
      user_id: userId,
      ...source,
      created_at: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error in addSource:", error);
    return false;
  }
}

export async function addTask(userId: string, task: any): Promise<boolean> {
  try {
    await addDoc(collection(db, "tasks"), {
      user_id: userId,
      ...task,
      created_at: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error in addTask:", error);
    return false;
  }
}

export async function updateTask(taskId: string, userId: string, task: any): Promise<boolean> {
  try {
    await updateDoc(doc(db, "tasks", taskId), task);
    return true;
  } catch (error) {
    console.error("Error in updateTask:", error);
    return false;
  }
}

export async function deleteTask(taskId: string, userId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    return true;
  } catch (error) {
    console.error("Error in deleteTask:", error);
    return false;
  }
}

export async function getUserChapters(userId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, "chapters"),
      where("user_id", "==", userId),
      orderBy("order", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error in getUserChapters:", error);
    return [];
  }
}

export async function getUserMilestones(userId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, "milestones"),
      where("user_id", "==", userId),
      orderBy("date", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error in getUserMilestones:", error);
    return [];
  }
}

export async function searchUsers(queryText: string, targetRole: string, currentUserId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, "users"),
      where("user_type", "==", targetRole),
      orderBy("name"),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((user: any) => 
        (user.name?.toLowerCase().includes(queryText.toLowerCase()) || 
         user.email?.toLowerCase().includes(queryText.toLowerCase())) &&
        user.id !== currentUserId
      );
      
    return results;
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return [];
  }
}

export async function deleteSource(sourceId: string, userId: string): Promise<boolean> {
  try {
    const sourceRef = doc(db, "sources", sourceId);
    await deleteDoc(sourceRef);
    return true;
  } catch (error) {
    console.error("Error in deleteSource:", error);
    return false;
  }
}

// =====================================================
// Tasks - المهام
// =====================================================

export async function getUserTasks(userId: string): Promise<ScheduleTask[]> {
  try {
    const q = query(
      collection(db, "tasks"),
      where("user_id", "==", userId),
      orderBy("due_date", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScheduleTask[];
  } catch (error) {
    console.error("Error in getUserTasks:", error);
    return [];
  }
}

// =====================================================
// Notifications - الإشعارات
// =====================================================

export async function createNotification(userId: string, notification: any): Promise<boolean> {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    await addDoc(notificationsRef, {
      ...notification,
      read: false,
      timestamp: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  try {
    const notificationRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
    return true;
  } catch (error) {
    console.error("Error marking notification read:", error);
    return false;
  }
}

// =====================================================
// Chat - المحادثات
// =====================================================

export async function createConversation(participantIds: string[], initialData: any = {}): Promise<string | null> {
  try {
    const conversationsRef = collection(db, "conversations");
    const docRef = await addDoc(conversationsRef, {
      participants: participantIds,
      updated_at: Timestamp.now(),
      lastMessage: initialData.lastMessage || "",
      ...initialData
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<boolean> {
  try {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    await addDoc(messagesRef, {
      sender_id: senderId,
      text,
      status: "sent",
      created_at: Timestamp.now(),
    });

    // Update conversation last message and timestamp
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      lastMessage: text,
      updated_at: Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
}
