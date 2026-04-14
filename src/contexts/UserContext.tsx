"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export type UserRole = "student" | "professor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

interface UserContextType {
  user: User | null;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // تحميل بيانات المستخدم من Firestore
  const loadUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const userData: User = {
          id: firebaseUser.uid,
          name: data.name || firebaseUser.displayName || "مستخدم",
          email: firebaseUser.email || "",
          role: data.role || "student",
          image: firebaseUser.photoURL || data.image || undefined,
        };

        // إذا كانت الصورة موجودة في قوقل وغير موجودة في السجل، قم بتحديث السجل
        if (firebaseUser.photoURL && !data.image) {
          updateDoc(userDocRef, { image: firebaseUser.photoURL });
        }

        setUser(userData);
        return userData;
      } else {
        // إنشاء سجل جديد في Firestore إذا لم يكن موجوداً
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "مستخدم",
          email: firebaseUser.email || "",
          role: "student", // الدور الافتراضي
          image: firebaseUser.photoURL || undefined,
        };
        
        await setDoc(userDocRef, {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          image: newUser.image || null,
          createdAt: new Date().toISOString(),
        });
        
        setUser(newUser);
        return newUser;
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await loadUserData(result.user);
        return { success: true };
      }
      return { success: false, error: "فشل تسجيل الدخول" };
    } catch (error: any) {
      console.error("Google login error:", error);
      let errorMessage = "حدث خطأ أثناء تسجيل الدخول باستخدام قوقل";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية";
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        const newUser: User = {
          id: result.user.uid,
          name,
          email,
          role,
        };

        const userDocRef = doc(db, "users", result.user.uid);
        await setDoc(userDocRef, {
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
          image: null
        });

        setUser(newUser);
        return { success: true };
      }
      return { success: false, error: "فشل إنشاء الحساب" };
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "البريد الإلكتروني غير صالح";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "كلمة المرور ضعيفة جداً";
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        name: userData.name,
        role: userData.role,
        image: userData.image,
      });

      setUser({ ...user, ...userData });
    } catch (error) {
      console.error("Update user error:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    if (typeof window === "undefined") {
      return {
        user: null,
        register: async () => ({ success: false, error: "Server side" }),
        loginWithGoogle: async () => ({ success: false, error: "Server side" }),
        logout: async () => {},
        updateUser: async () => {},
        isAuthenticated: false,
        loading: true,
      };
    }
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
