import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Resident, Payment, Expense, generateId, Registration } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType, 
  signInWithGoogle, 
  signInGuest,
  signUpEmail,
  signInEmail,
  logOut 
} from '../firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  query, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';

export interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface DataContextType {
  residents: Resident[];
  payments: Payment[];
  expenses: Expense[];
  loading: boolean;
  user: FirebaseUser | null;
  userLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  useLocalBypass: boolean;
  setUseLocalBypass: (b: boolean) => void;
  addResident: (r: Omit<Resident, 'id'>) => Promise<void>;
  updateResident: (id: string, r: Partial<Resident>) => Promise<void>;
  deleteResident: (id: string) => Promise<void>;
  addPayment: (p: Omit<Payment, 'id'>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  clearAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
  requestConfirm: (options: ConfirmOptions) => void;
  login: () => Promise<void>;
  loginGuest: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  profile: Registration | null;
  profileLoading: boolean;
  saveProfile: (name: string, phone: string) => Promise<void>;
  deleteRegistration: (uid: string) => Promise<void>;
  allRegistrations: Registration[];
}

const DataContext = createContext<DataContextType | null>(null);

const DEMO_RESIDENTS: Resident[] = [
  { id: 'res-1', name: 'Rahul Sharma', roomNumber: '102', rentCategory: 'monthly', monthlyRent: 6500, phone: '9876543210', active: true, joinDate: '2026-01-10', rentDueDay: 5, reminderEnabled: true },
  { id: 'res-2', name: 'Priya Patel', roomNumber: '204', rentCategory: 'monthly', monthlyRent: 7200, phone: '8765432109', active: true, joinDate: '2026-02-15', rentDueDay: 10, reminderEnabled: true },
  { id: 'res-3', name: 'Amit Verma', roomNumber: '105', rentCategory: 'yearly', monthlyRent: 5000, yearlyRent: 60000, phone: '7654321098', active: true, joinDate: '2026-03-01', rentDueDay: 1, reminderEnabled: false },
  { id: 'res-4', name: 'Vikram Singh', roomNumber: '301', rentCategory: 'part_payment', monthlyRent: 4500, partPaymentAmount: 18000, partPaymentCount: 3, phone: '9988776655', active: true, joinDate: '2025-11-01', rentDueDay: 15, reminderEnabled: false },
  { id: 'res-5', name: 'Ananya Das', roomNumber: '208', rentCategory: 'monthly', monthlyRent: 6000, phone: '8877665544', active: false, joinDate: '2025-08-10', rentDueDay: 5, reminderEnabled: false }
];

const DEMO_PAYMENTS: Payment[] = [
  { id: 'pay-1', type: 'resident', paymentType: 'monthly', residentId: 'res-1', description: 'Rahul Sharma — Monthly Rent (Room 102)', amount: 6500, date: '2026-06-05' },
  { id: 'pay-2', type: 'resident', paymentType: 'monthly', residentId: 'res-2', description: 'Priya Patel — Monthly Rent (Room 204)', amount: 7200, date: '2026-06-09' },
  { id: 'pay-3', type: 'resident', paymentType: 'installment', residentId: 'res-4', description: 'Vikram Singh — Installment (Room 301)', amount: 18000, date: '2026-06-02' },
  { id: 'pay-4', type: 'other', description: 'Lease of rooftop space for antenna', amount: 15000, date: '2026-06-03' },
  { id: 'pay-5', type: 'resident', paymentType: 'monthly', residentId: 'res-1', description: 'Rahul Sharma — Monthly Rent (Room 102)', amount: 6500, date: '2026-05-04' }
];

const DEMO_EXPENSES: Expense[] = [
  { id: 'exp-1', category: 'salaries', subCategory: 'Cook', amount: 8000, date: '2026-06-01', notes: 'Salary for June paid to Ramesh' },
  { id: 'exp-2', category: 'utilities', subCategory: 'Electricity', amount: 4500, date: '2026-06-04', notes: 'Main block power bill' },
  { id: 'exp-3', category: 'maintenance', subCategory: 'Plumber', amount: 1200, date: '2026-06-06', notes: 'Fixed leakage in room 105 washroom' },
  { id: 'exp-4', category: 'groceries', subCategory: 'Milk', amount: 3200, date: '2026-06-05', notes: 'Monthly dairy delivery supply' },
  { id: 'exp-5', category: 'miscellaneous', subCategory: 'Cleaning Supplies', amount: 1500, date: '2026-06-02', notes: 'Disinfectants, mops and soaps' }
];

// Helper function to send notification email when new user registers or applies as Manager
export async function sendNewUserEmailNotification(
  name: string,
  email: string,
  phone?: string,
  isApplicationUpdate: boolean = false
) {
  // Try to find the Web3Forms key
  const web3formsKey = (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY || '';
  if (!web3formsKey) {
    console.warn("Web3Forms API key is missing. Email notification cannot be sent. Please add VITE_WEB3FORMS_ACCESS_KEY to .env file.");
    return;
  }

  const subject = isApplicationUpdate
    ? `🚨 Manager Application Received: ${name}`
    : `👤 New User Registered/Logged In: ${name}`;

  const message = isApplicationUpdate
    ? `An existing user has submitted an application to become a Manager at Ekam Homes:\n\n` +
      `👤 Name: ${name}\n` +
      `📧 Email: ${email}\n` +
      `📞 Phone: ${phone || 'Not Provided'}\n` +
      `⏰ Applied At: ${new Date().toLocaleString('en-IN')}\n\n` +
      `You can review and approve/reject this application in the Manager Registrations dashboard tab inside the application.`
    : `A new user has logged into the Ekam Homes App for the first time:\n\n` +
      `👤 Name: ${name}\n` +
      `📧 Email: ${email}\n` +
      `⏰ Login Time: ${new Date().toLocaleString('en-IN')}\n\n` +
      `A basic registration outline has been automatically created for this user and logged in your ledger backend database.`;

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        access_key: web3formsKey,
        subject: subject,
        from_name: "Ekam Homes Doon System",
        to_email: "mbansal198542@gmail.com",
        message: message,
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log("Notification email successfully sent to mbansal198542@gmail.com via Web3Forms.");
    } else {
      console.error("Web3Forms email submit failed:", result);
    }
  } catch (err) {
    console.error("Error occurred while sending notification email:", err);
  }
}

export function cleanForFirestore<T extends object>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => (typeof item === 'object' && item !== null) ? cleanForFirestore(item) : item) as any;
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    }
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      result[key] = cleanForFirestore(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Registration | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);

  // Local storage bypass state for sandboxed environments or slow connections
  const [useLocalBypass, setUseLocalBypassState] = useState<boolean>(() => {
    return localStorage.getItem('@ekam_use_local_bypass') === 'true';
  });

  const setUseLocalBypass = useCallback((value: boolean) => {
    setUseLocalBypassState(value);
    localStorage.setItem('@ekam_use_local_bypass', String(value));
    if (value) {
      setError(null);
      // Load current local states
      const localRes = localStorage.getItem('@ekam_residents');
      const localPay = localStorage.getItem('@ekam_payments');
      const localExp = localStorage.getItem('@ekam_expenses');
      
      setResidents(localRes ? JSON.parse(localRes) : DEMO_RESIDENTS);
      setPayments(localPay ? JSON.parse(localPay) : DEMO_PAYMENTS);
      setExpenses(localExp ? JSON.parse(localExp) : DEMO_EXPENSES);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, []);

  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const requestConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  // Handle Authentication subscription
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (useLocalBypass) {
        setUserLoading(false);
        return;
      }
      setUser(firebaseUser);
      setUserLoading(false);
      if (!firebaseUser) {
        // Reset states if logged out
        setResidents([]);
        setPayments([]);
        setExpenses([]);
        setLoading(false);
      } else {
        // Check and register new user login asynchronously
        const checkAutoRegister = async () => {
          if (firebaseUser.email !== 'mbansal198542@gmail.com') {
            try {
              const profileRef = doc(db, 'registrations', firebaseUser.uid);
              const docSnap = await getDoc(profileRef);
              if (!docSnap.exists()) {
                const tempReg: Registration = {
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unknown User',
                  email: firebaseUser.email || '',
                  phone: 'Not Provided',
                  createdAt: new Date().toISOString()
                };
                await setDoc(profileRef, cleanForFirestore(tempReg));
                sendNewUserEmailNotification(tempReg.name, tempReg.email, undefined, false);
              }
            } catch (e) {
              console.error("Error auto-registering new user login:", e);
            }
          }
        };
        checkAutoRegister();
      }
    });
    return () => unsubAuth();
  }, [useLocalBypass]);

  // Handle profile and configurations listeners
  useEffect(() => {
    if (useLocalBypass) {
      setProfile(null);
      setAllRegistrations([]);
      setProfileLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setAllRegistrations([]);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    
    // Subscribe to current user's profile registration document
    const profileRef = doc(db, 'registrations', user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as Registration);
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        console.error('Firestore profile stream error:', err);
        setProfile(null);
        setProfileLoading(false);
      }
    );

    // Subscribe to all registrations if current user is the administrator
    let unsubAllRegistrations = () => {};
    if (user.email === 'mbansal198542@gmail.com') {
      const registrationsCol = collection(db, 'registrations');
      unsubAllRegistrations = onSnapshot(
        registrationsCol,
        (snapshot) => {
          const list: Registration[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Registration);
          });
          setAllRegistrations(list);
        },
        (err) => {
          console.error('Firestore all registrations stream error:', err);
        }
      );
    } else {
      setAllRegistrations([]);
    }

    return () => {
      unsubProfile();
      unsubAllRegistrations();
    };
  }, [user, useLocalBypass]);

  // Listen to Firestore changes when logged in, or local storage when in bypass mode
  useEffect(() => {
    if (useLocalBypass) {
      // Initialize offline state if empty
      const localRes = localStorage.getItem('@ekam_residents');
      const localPay = localStorage.getItem('@ekam_payments');
      const localExp = localStorage.getItem('@ekam_expenses');
      
      if (!localRes) localStorage.setItem('@ekam_residents', JSON.stringify(DEMO_RESIDENTS));
      if (!localPay) localStorage.setItem('@ekam_payments', JSON.stringify(DEMO_PAYMENTS));
      if (!localExp) localStorage.setItem('@ekam_expenses', JSON.stringify(DEMO_EXPENSES));

      setResidents(localRes ? JSON.parse(localRes) : DEMO_RESIDENTS);
      setPayments(localPay ? JSON.parse(localPay) : DEMO_PAYMENTS);
      setExpenses(localExp ? JSON.parse(localExp) : DEMO_EXPENSES);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const uid = user.uid;

    // Subscriptions
    const resPath = `users/${uid}/residents`;
    const unsubResidents = onSnapshot(
      query(collection(db, 'users', uid, 'residents')),
      (snapshot) => {
        const list: Resident[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Resident);
        });
        setResidents(list);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore residents sub error:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    const payPath = `users/${uid}/payments`;
    const unsubPayments = onSnapshot(
      query(collection(db, 'users', uid, 'payments')),
      (snapshot) => {
        const list: Payment[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Payment);
        });
        setPayments(list);
      },
      (err) => {
        console.error('Firestore payments sub error:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    const expPath = `users/${uid}/expenses`;
    const unsubExpenses = onSnapshot(
      query(collection(db, 'users', uid, 'expenses')),
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Expense);
        });
        setExpenses(list);
      },
      (err) => {
        console.error('Firestore expenses sub error:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    );

    return () => {
      unsubResidents();
      unsubPayments();
      unsubExpenses();
    };
  }, [user, useLocalBypass]);

  const login = useCallback(async () => {
    setUserLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Login action helper error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const loginGuest = useCallback(async () => {
    setUserLoading(true);
    setError(null);
    try {
      await signInGuest();
    } catch (err) {
      console.error('Guest login helper error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const loginEmail = useCallback(async (email: string, pass: string) => {
    setUserLoading(true);
    setError(null);
    try {
      await signInEmail(email, pass);
    } catch (err) {
      console.error('Email login helper error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const registerEmail = useCallback(async (email: string, pass: string) => {
    setUserLoading(true);
    setError(null);
    try {
      await signUpEmail(email, pass);
    } catch (err) {
      console.error('Email registration helper error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (name: string, phone: string) => {
    if (!user) return;
    const path = `registrations/${user.uid}`;
    const newReg: Registration = {
      uid: user.uid,
      name,
      email: user.email || '',
      phone,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'registrations', user.uid), cleanForFirestore(newReg));
      setProfile(newReg);
      sendNewUserEmailNotification(name, user.email || '', phone, true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }, [user]);

  const deleteRegistration = useCallback(async (uid: string) => {
    const path = `registrations/${uid}`;
    try {
      await deleteDoc(doc(db, 'registrations', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }, []);

  const logout = useCallback(async () => {
    setUserLoading(true);
    setError(null);
    try {
      if (useLocalBypass) {
        setUseLocalBypassState(false);
        localStorage.removeItem('@ekam_use_local_bypass');
      } else {
        await logOut();
      }
    } catch (err) {
      console.error('Logout action helper error:', err);
    } finally {
      setUserLoading(false);
    }
  }, [useLocalBypass]);

  const addResident = useCallback(
    async (r: Omit<Resident, 'id'>) => {
      const id = generateId();
      const item: Resident = { ...r, id };
      
      if (useLocalBypass) {
        const next = [...residents, item];
        setResidents(next);
        localStorage.setItem('@ekam_residents', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/residents/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'residents', id), cleanForFirestore(item));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, useLocalBypass, residents],
  );

  const updateResident = useCallback(
    async (id: string, r: Partial<Resident>) => {
      if (useLocalBypass) {
        const next = residents.map((item) => (item.id === id ? { ...item, ...r } : item));
        setResidents(next);
        localStorage.setItem('@ekam_residents', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/residents/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'residents', id), cleanForFirestore(r as any));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, useLocalBypass, residents],
  );

  const deleteResident = useCallback(
    async (id: string) => {
      if (useLocalBypass) {
        const next = residents.filter((item) => item.id !== id);
        setResidents(next);
        localStorage.setItem('@ekam_residents', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/residents/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'residents', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, useLocalBypass, residents],
  );

  const addPayment = useCallback(
    async (p: Omit<Payment, 'id'>) => {
      const id = generateId();
      const item: Payment = { ...p, id };

      if (useLocalBypass) {
        const next = [...payments, item];
        setPayments(next);
        localStorage.setItem('@ekam_payments', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/payments/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'payments', id), cleanForFirestore(item));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, useLocalBypass, payments],
  );

  const deletePayment = useCallback(
    async (id: string) => {
      if (useLocalBypass) {
        const next = payments.filter((item) => item.id !== id);
        setPayments(next);
        localStorage.setItem('@ekam_payments', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/payments/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'payments', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, useLocalBypass, payments],
  );

  const addExpense = useCallback(
    async (e: Omit<Expense, 'id'>) => {
      const id = generateId();
      const item: Expense = { ...e, id };

      if (useLocalBypass) {
        const next = [...expenses, item];
        setExpenses(next);
        localStorage.setItem('@ekam_expenses', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/expenses/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'expenses', id), cleanForFirestore(item));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, useLocalBypass, expenses],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (useLocalBypass) {
        const next = expenses.filter((item) => item.id !== id);
        setExpenses(next);
        localStorage.setItem('@ekam_expenses', JSON.stringify(next));
        return;
      }

      if (!user) return;
      const path = `users/${user.uid}/expenses/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, useLocalBypass, expenses],
  );

  const resetToDefaults = useCallback(async () => {
    if (useLocalBypass) {
      setResidents(DEMO_RESIDENTS);
      setPayments(DEMO_PAYMENTS);
      setExpenses(DEMO_EXPENSES);
      localStorage.setItem('@ekam_residents', JSON.stringify(DEMO_RESIDENTS));
      localStorage.setItem('@ekam_payments', JSON.stringify(DEMO_PAYMENTS));
      localStorage.setItem('@ekam_expenses', JSON.stringify(DEMO_EXPENSES));
      return;
    }

    if (!user) return;
    const uid = user.uid;

    for (const r of residents) {
      await deleteDoc(doc(db, 'users', uid, 'residents', r.id)).catch(() => {});
    }
    for (const p of payments) {
      await deleteDoc(doc(db, 'users', uid, 'payments', p.id)).catch(() => {});
    }
    for (const e of expenses) {
      await deleteDoc(doc(db, 'users', uid, 'expenses', e.id)).catch(() => {});
    }

    // Load fresh demo templates
    try {
      const resPromises = DEMO_RESIDENTS.map((res) => {
        return setDoc(doc(db, 'users', uid, 'residents', res.id), cleanForFirestore(res));
      });
      const payPromises = DEMO_PAYMENTS.map((pay) => {
        return setDoc(doc(db, 'users', uid, 'payments', pay.id), cleanForFirestore(pay));
      });
      const expPromises = DEMO_EXPENSES.map((exp) => {
        return setDoc(doc(db, 'users', uid, 'expenses', exp.id), cleanForFirestore(exp));
      });

      await Promise.all([...resPromises, ...payPromises, ...expPromises]);
    } catch (err) {
      console.error('Reset default error:', err);
    }
  }, [user, useLocalBypass, residents, payments, expenses]);

  const clearAllData = useCallback(async () => {
    if (useLocalBypass) {
      setResidents([]);
      setPayments([]);
      setExpenses([]);
      localStorage.setItem('@ekam_residents', JSON.stringify([]));
      localStorage.setItem('@ekam_payments', JSON.stringify([]));
      localStorage.setItem('@ekam_expenses', JSON.stringify([]));
      return;
    }

    if (!user) return;
    const uid = user.uid;

    for (const r of residents) {
      await deleteDoc(doc(db, 'users', uid, 'residents', r.id)).catch(() => {});
    }
    for (const p of payments) {
      await deleteDoc(doc(db, 'users', uid, 'payments', p.id)).catch(() => {});
    }
    for (const e of expenses) {
      await deleteDoc(doc(db, 'users', uid, 'expenses', e.id)).catch(() => {});
    }
  }, [user, useLocalBypass, residents, payments, expenses]);

  const loadDemoData = useCallback(async () => {
    if (useLocalBypass) {
      setResidents(DEMO_RESIDENTS);
      setPayments(DEMO_PAYMENTS);
      setExpenses(DEMO_EXPENSES);
      localStorage.setItem('@ekam_residents', JSON.stringify(DEMO_RESIDENTS));
      localStorage.setItem('@ekam_payments', JSON.stringify(DEMO_PAYMENTS));
      localStorage.setItem('@ekam_expenses', JSON.stringify(DEMO_EXPENSES));
      return;
    }

    if (!user) return;
    const uid = user.uid;

    try {
      const resPromises = DEMO_RESIDENTS.map((res) => {
        return setDoc(doc(db, 'users', uid, 'residents', res.id), cleanForFirestore(res));
      });
      const payPromises = DEMO_PAYMENTS.map((pay) => {
        return setDoc(doc(db, 'users', uid, 'payments', pay.id), cleanForFirestore(pay));
      });
      const expPromises = DEMO_EXPENSES.map((exp) => {
        return setDoc(doc(db, 'users', uid, 'expenses', exp.id), cleanForFirestore(exp));
      });

      await Promise.all([...resPromises, ...payPromises, ...expPromises]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/demo-load`);
    }
  }, [user, useLocalBypass]);

  // Simulated User for Local Bypass Mode
  const effectiveUser = useLocalBypass 
    ? ({
        uid: 'local-bypass-user',
        displayName: 'Local Administrator',
        email: 'local-sandbox@ekamhomes.doon',
        photoURL: null
      } as any)
    : user;

  return (
    <DataContext.Provider
      value={{
        residents,
        payments,
        expenses,
        loading,
        user: effectiveUser,
        userLoading,
        error,
        setError,
        useLocalBypass,
        setUseLocalBypass,
        addResident,
        updateResident,
        deleteResident,
        addPayment,
        deletePayment,
        addExpense,
        deleteExpense,
        resetToDefaults,
        clearAllData,
        loadDemoData,
        requestConfirm,
        login,
        loginGuest,
        loginEmail,
        registerEmail,
        logout,
        profile,
        profileLoading,
        saveProfile,
        deleteRegistration,
        allRegistrations
      }}
    >
      {children}

      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with fade-in */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmState(null)}
              className="absolute inset-0 bg-[#07130B]/40 backdrop-blur-xs"
            />

            {/* Modal Body with bounce/scale */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="bg-white border border-[#1D3E24]/10 rounded-2xl max-w-sm w-full shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl ${confirmState.isDestructive ? 'bg-red-50 text-red-650' : 'bg-emerald-50 text-emerald-800'} shrink-0`}>
                    {confirmState.isDestructive ? <AlertTriangle className="w-5 h-5 stroke-[2]" /> : <HelpCircle className="w-5 h-5 stroke-[2]" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-snug">
                      {confirmState.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                      {confirmState.message}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setConfirmState(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {confirmState.cancelText || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmState.onConfirm();
                      setConfirmState(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-3xs whitespace-nowrap ${
                      confirmState.isDestructive
                        ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                        : 'bg-[#1D3E24] hover:bg-[#152e1a] active:scale-95'
                    }`}
                  >
                    {confirmState.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
