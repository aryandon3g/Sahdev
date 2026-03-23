/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  RotateCcw, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Package,
  AlertCircle,
  TrendingDown,
  Send,
  Search,
  Plus,
  X,
  Trash2,
  Menu,
  LogOut,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { format, addDays, subDays, isSameDay } from 'date-fns';

// --- Firebase Placeholder (User will add real config later) ---
/*
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  // Add your config here
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
*/

// --- Types ---
type TransactionType = 'order' | 'rto' | 'return' | 'dispatch';
type ViewType = 'all' | 'orders' | 'rto' | 'returns' | 'date';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  customer: string;
  status: string;
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

// --- Login Screen Component ---
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-8 lg:p-12 text-center border border-slate-100"
    >
      <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mx-auto mb-8">
        <Lock size={32} />
      </div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Hisab Kitab</h1>
      <p className="text-slate-500 font-medium mb-10">Sign in to manage your business transactions securely.</p>
      
      <button 
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-100 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98] shadow-sm"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Continue with Google</span>
      </button>
      
      <p className="mt-8 text-xs text-slate-400 font-medium">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  </div>
);

// --- Memoized Table Row ---
const TransactionRow = memo(({ item, onDelete }: { item: Transaction; onDelete: (id: string) => void }) => (
  <motion.tr 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className="hover:bg-slate-50/50 transition-colors group will-change-transform"
  >
    <td className="px-6 py-4 text-xs font-mono text-slate-400">#{item.id}</td>
    <td className="px-6 py-4">
      <p className="text-sm font-bold">{item.customer}</p>
      <p className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">{item.status}</p>
    </td>
    <td className="px-6 py-4">
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tighter ${
        item.type === 'order' ? 'bg-blue-100 text-blue-700' :
        item.type === 'rto' ? 'bg-orange-100 text-orange-700' :
        item.type === 'return' ? 'bg-purple-100 text-purple-700' :
        'bg-emerald-100 text-emerald-700'
      }`}>
        {item.type}
      </span>
    </td>
    <td className="px-6 py-4 text-sm font-bold">₹{item.amount}</td>
    <td className="px-6 py-4 text-right">
      <button 
        onClick={() => onDelete(item.id)}
        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </td>
  </motion.tr>
));

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Auth Logic Placeholder ---
  /*
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'User',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || ''
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  */

  // Dummy Auth for now
  const handleDummyLogin = () => {
    setUser({
      uid: '123',
      displayName: 'Aryan Kumar',
      email: 'aryan@example.com',
      photoURL: 'https://picsum.photos/seed/user/100/100'
    });
  };

  const handleLogout = () => setUser(null);

  // Form State
  const [formData, setFormData] = useState({
    customer: '',
    amount: '',
    type: 'order' as TransactionType,
    status: 'Delivered'
  });

  // Filtered data based on selected date and search
  const filteredData = useMemo(() => {
    return transactions.filter(item => {
      const matchesDate = isSameDay(item.date, selectedDate);
      const matchesSearch = item.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.id.includes(searchQuery);
      
      if (activeView === 'all' || activeView === 'date') return matchesDate && matchesSearch;
      if (activeView === 'orders') return item.type === 'order' && matchesDate && matchesSearch;
      if (activeView === 'rto') return item.type === 'rto' && matchesDate && matchesSearch;
      if (activeView === 'returns') return item.type === 'return' && matchesDate && matchesSearch;
      
      return matchesDate && matchesSearch;
    });
  }, [transactions, selectedDate, activeView, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalOrders = transactions.filter(d => d.type === 'order').length;
    const totalRto = transactions.filter(d => d.type === 'rto').length;
    const totalReturns = transactions.filter(d => d.type === 'return').length;
    const totalDispatch = transactions.filter(d => d.type === 'dispatch').length;
    const totalLoss = transactions.filter(d => d.type === 'rto' || d.type === 'return')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { totalOrders, totalRto, totalReturns, totalDispatch, totalLoss };
  }, [transactions]);

  const handleAddEntry = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || !formData.amount) return;

    const newEntry: Transaction = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customer: formData.customer,
      amount: parseFloat(formData.amount),
      type: formData.type,
      date: selectedDate,
      status: formData.status || (formData.type === 'order' ? 'Delivered' : formData.type === 'dispatch' ? 'Shipped' : 'Processed')
    };

    // --- Firestore Write Placeholder ---
    /*
    if (user) {
      await addDoc(collection(db, `users/${user.uid}/transactions`), {
        ...newEntry,
        date: newEntry.date.toISOString() // Firestore prefers ISO or Timestamps
      });
    }
    */

    setTransactions(prev => [newEntry, ...prev]);
    setIsModalOpen(false);
    setFormData({ customer: '', amount: '', type: 'order', status: 'Delivered' });
  }, [formData, selectedDate, user]);

  const deleteTransaction = useCallback((id: string) => {
    // --- Firestore Delete Placeholder ---
    /*
    if (user) {
      await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
    }
    */
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [user]);

  // --- Firestore Read Placeholder ---
  /*
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/transactions`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: new Date(doc.data().date)
      })) as Transaction[];
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);
  */

  const navItems = [
    { id: 'all', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'rto', label: 'RTO', icon: Truck },
    { id: 'returns', label: 'Customer Return', icon: RotateCcw },
    { id: 'date', label: 'Date Filter', icon: CalendarIcon },
  ];

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total RTO', value: stats.totalRto, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Return', value: stats.totalReturns, icon: RotateCcw, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Loss', value: `₹${stats.totalLoss}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Dispatch', value: stats.totalDispatch, icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (!user) {
    return <LoginScreen onLogin={handleDummyLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : -256,
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ 
          type: 'spring', 
          damping: 35, 
          stiffness: 400,
          opacity: { duration: 0.15 }
        }}
        className={`fixed lg:relative h-full bg-white border-r border-slate-200 flex flex-col z-50 overflow-hidden shadow-xl lg:shadow-none w-64 will-change-transform ${!isSidebarOpen && 'pointer-events-none lg:pointer-events-auto lg:w-0'}`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between min-w-[256px]">
          <div>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <span className="text-lg font-bold">HK</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">Hisab Kitab</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 min-w-[256px]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as ViewType);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 min-w-[256px] space-y-2">
          <button 
            onClick={() => {
              setIsModalOpen(true);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>New Entry</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-30 bg-[#F8F9FA]/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block text-left">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 capitalize">
                {activeView === 'all' ? 'Overview' : activeView}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Welcome, {user.displayName}</p>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 sm:gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setSelectedDate(prev => subDays(prev, 1))}
              className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-2 sm:px-4 border-x border-slate-100">
              <CalendarIcon size={16} className="text-indigo-500 hidden xs:block" />
              <span className="font-semibold text-xs sm:text-sm min-w-[80px] sm:min-w-[120px] text-center">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
            </div>
            <button 
              onClick={() => setSelectedDate(prev => addDays(prev, 1))}
              className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-8 lg:mb-12">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${idx === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`${card.bg} ${card.color} w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
                  <card.icon size={18} className="sm:size-5" />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">{card.label}</p>
                <h3 className="text-lg sm:text-2xl font-bold mt-1 truncate">{card.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-2xl lg:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h3 className="font-bold text-base lg:text-lg">Transactions for {format(selectedDate, 'MMM d')}</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search customer..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <TransactionRow key={item.id} item={item} onDelete={deleteTransaction} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 lg:py-24 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-300">
                            <AlertCircle size={48} strokeWidth={1} />
                            <p className="font-bold text-sm uppercase tracking-widest">No entries found</p>
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="mt-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                              ADD ENTRY
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden will-change-transform"
            >
              <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl lg:text-2xl font-black tracking-tight">NEW ENTRY</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddEntry} className="p-6 lg:p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    placeholder="Enter name..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold appearance-none"
                    >
                      <option value="order">Order</option>
                      <option value="rto">RTO</option>
                      <option value="return">Return</option>
                      <option value="dispatch">Dispatch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold appearance-none"
                  >
                    <option value="Delivered">Delivered</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Pending">Pending</option>
                    <option value="Processed">Processed</option>
                    <option value="Ready to Ship">Ready to Ship</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Returned">Returned</option>
                    <option value="RTO Initiated">RTO Initiated</option>
                    <option value="RTO Delivered">RTO Delivered</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] uppercase tracking-widest"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
