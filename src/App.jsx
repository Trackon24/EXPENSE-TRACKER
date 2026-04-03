import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  Plus, Trash2, Wallet, Zap, Camera, Smartphone, Loader2, 
  LogOut, ArrowUpRight, ArrowDownLeft, Search,
  FileText, Download, Repeat, BarChart3, LayoutDashboard, History,
  TrendingUp, TrendingDown, Target, Check, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';

// --- CONSTANTS ---
const CATEGORIES = {
  expense: ['Food 🍔', 'Shopping 🛍️', 'Travel ✈️', 'Entertainment 🎬', 'Bills ⚡', 'Others 📦'],
  income: ['Salary 💰', 'Freelance 💻', 'Pocket Money 💵', 'Investment 📈', 'Gift 🎁', 'Others 💵']
};

const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#a78bfa', '#f472b6', '#f43f5e', '#fbbf24', '#0ea5e9'];

// --- FIREBASE CONFIGURATION (Authentication Only) ---
const firebaseConfig = {
  apiKey: "AIzaSyCFZpjC67_zrVuJBqEh3jS1FPmyBO0hucg",
  authDomain: "expense-tracker-4e7af.firebaseapp.com",
  projectId: "expense-tracker-4e7af",
  storageBucket: "expense-tracker-4e7af.firebasestorage.app",
  messagingSenderId: "563538150499",
  appId: "1:563538150499:web:09961aecc0a1e12697a456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// --- LOCAL BACKEND ENDPOINT ---
const API_BASE = "http://localhost:5000/api";

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

// --- CSS STYLES ---
const ThemeStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    :root { --bg: #050505; --card: #111111; --income: #10b981; --expense: #f43f5e; --accent: #10b981; }
    body { background-color: var(--bg); color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background-image: radial-gradient(circle at 50% 0%, #111 0%, #050505 100%); }
    .glass { background: var(--card); border: 1px solid rgba(255,255,255,0.05); }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
    input, select, textarea { background: #000 !important; border: 1px solid #222 !important; color: white !important; outline: none; transition: all 0.2s; }
    input:focus { border-color: var(--accent) !important; box-shadow: 0 0 15px rgba(16, 185, 129, 0.1); }
    .type-btn-active-income { background: var(--income); color: #000; font-weight: 800; }
    .type-btn-active-expense { background: var(--expense); color: white; font-weight: 800; }
    .nav-active { background: #10b981 !important; color: #000 !important; font-weight: 800; }
    .summary-card { min-width: 0; flex: 1 1 280px; }
    .currency-text { word-break: break-all; font-size: clamp(1.2rem, 3.5vw, 1.9rem); line-height: 1.2; font-weight: 800; }
    .item-card:hover .delete-btn { opacity: 1; }
    .delete-btn { opacity: 0; transition: 0.2s; }
    .animate-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState('tracker');
  const [isScanning, setIsScanning] = useState(false);

  // Form State
  const [type, setType] = useState('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceExpiry, setRecurrenceExpiry] = useState('');
  
  // Search/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // --- AUTH OBSERVER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATA FETCHING (LOCAL MONGODB) ---
  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/transactions/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const sortedData = Array.isArray(data) ? data : [];
        setTransactions(sortedData);
        handleMonthlyRecurring(sortedData);
      }
    } catch (err) { 
      console.warn("FinSight Engine offline. Start your server.js"); 
    }
  };

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  useEffect(() => { setCategory(CATEGORIES[type][0]); }, [type]);

  // --- MONTHLY AUTO-LOGGING ENGINE ---
  const handleMonthlyRecurring = async (data) => {
    if (!user) return;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const t of data.filter(item => item.isRecurring)) {
      const expiry = t.recurrenceExpiry ? new Date(t.recurrenceExpiry) : null;
      if (expiry && now > expiry) continue;

      const alreadyLogged = data.some(item => 
        item.parentId === t._id && 
        new Date(item.date).getMonth() === currentMonth &&
        new Date(item.date).getFullYear() === currentYear
      );

      if (!alreadyLogged) {
        const lastLogDate = new Date(t.date);
        if (now.getMonth() !== lastLogDate.getMonth() || now.getFullYear() !== lastLogDate.getFullYear()) {
          await addTransaction({
            description: `${t.description} (Auto-Recur)`,
            amount: t.amount,
            category: t.category,
            type: t.type,
            parentId: t._id,
            isRecurring: false
          });
        }
      }
    }
  };

  // --- HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signup') await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setAuthError(err.message.replace('Firebase:', '').trim()); }
  };

  const addTransaction = async (item) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, userId: user.uid })
      });
      if (res.ok) fetchTransactions();
    } catch (err) { console.error("Add Failed", err); }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTransactions();
    } catch (err) { console.error("Delete Failed", err); }
  };

  // --- AI INTELLIGENCE FUNCTIONS (Routing through your backend) ---
  const parseUPIText = async (text) => {
    if (!text) return;
    setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE}/ai/parse-upi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId: user.uid })
      });
      
      if (res.ok) {
        fetchTransactions();
        const area = document.getElementById('upiText');
        if (area) area.value = '';
      } else {
        const errData = await res.json();
        console.error("AI Sync Error:", errData.details || errData.error);
      }
    } catch (err) { 
      console.error("Neural Sync Communication Failed"); 
    } finally { 
      setIsScanning(false); 
    }
  };

  const scanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch(`${API_BASE}/ai/scan-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType: file.type, userId: user.uid })
        });
        if (res.ok) fetchTransactions();
      } catch (err) { console.error("AI Vision Failed"); }
      finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  const stats = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    return { balance: inc - exp, income: inc, expense: exp };
  }, [transactions]);

  const filteredData = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'All' || t.type === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
      <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-emerald-500">Initializing FinSight</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen flex items-center justify-center p-6 bg-[#050505]">
      <ThemeStyles />
      <div className="w-full max-w-md glass p-12 rounded-[2rem] shadow-2xl text-center border border-white/5">
        <Zap className="text-emerald-500 mx-auto mb-6 shadow-emerald-500/20" size={48} />
        <h2 className="text-4xl font-extrabold mb-2 text-white uppercase tracking-tighter">Fin<span className="text-emerald-400">Sight</span></h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-12">Intelligence Edition</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" required className="w-full rounded-xl py-4 px-6 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full rounded-xl py-4 px-6 text-sm" value={password} onChange={e => setPassword(e.target.value)} />
          {authError && <div className="text-rose-500 text-[10px] font-black uppercase p-3 bg-rose-500/10 rounded-lg">{authError}</div>}
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl">
            {authMode === 'login' ? 'Access Accounts' : 'Initialize Portfolio'}
          </button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="mt-8 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
          {authMode === 'login' ? "New Member? Register" : "Registered? Login"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <ThemeStyles />
      <nav className="glass border-b border-white/5 sticky top-0 z-50 px-8 py-5 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20"><Wallet className="text-black" size={24} /></div>
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tighter text-white leading-none">Fin<span className="text-emerald-400">Sight</span></h1>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Smart Expense Management</p>
          </div>
        </div>
        <div className="flex gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          {[
            { id: 'tracker', label: 'Tracker', icon: LayoutDashboard },
            { id: 'visualiser', label: 'Charts', icon: BarChart3 },
            { id: 'summariser', label: 'Summary', icon: FileText },
            { id: 'filter', label: 'Search', icon: Search }
          ].map(tab => (
            <button key={tab.id} onClick={() => setCurrentModule(tab.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${currentModule === tab.id ? 'nav-active' : 'text-slate-500 hover:text-slate-300'}`}>
              {React.createElement(tab.icon, { size: 14 })} <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => signOut(auth)} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/10"><LogOut size={20} />LogOut</button>
      </nav>

      {/* --- DASHBOARD SUMMARY --- */}
      <div className="flex flex-wrap gap-8 p-8 max-w-7xl mx-auto w-full">
        <div className="glass summary-card p-8 rounded-[2rem] border-l-4 border-emerald-500 shadow-2xl flex items-center gap-6">
          <TrendingUp className="text-emerald-500 shrink-0" size={32} />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Balance Amount</p>
            <p className="text-white currency-text tabular-nums">{formatCurrency(stats.balance)}</p>
          </div>
        </div>
        <div className="glass summary-card p-8 rounded-[2rem] border-l-4 border-emerald-400 shadow-2xl flex items-center gap-6">
          <ArrowUpRight className="text-emerald-400 shrink-0" size={32} />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Income</p>
            <p className="text-emerald-500 currency-text tabular-nums">{formatCurrency(stats.income)}</p>
          </div>
        </div>
        <div className="glass summary-card p-8 rounded-[2rem] border-l-4 border-rose-500 shadow-2xl flex items-center gap-6">
          <ArrowDownLeft className="text-rose-400 shrink-0" size={32} />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Expense</p>
            <p className="text-rose-500 currency-text tabular-nums">{formatCurrency(stats.expense)}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 pt-0">
        
        {/* --- TRACKER MODULE --- */}
        {currentModule === 'tracker' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-8 rounded-[2.5rem] space-y-6 shadow-2xl border-white/5">
                <div className="flex bg-black/60 p-1.5 rounded-xl border border-white/10">
                  <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${type === 'expense' ? 'type-btn-active-expense' : 'text-slate-600'}`}>Expense</button>
                  <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${type === 'income' ? 'type-btn-active-income' : 'text-slate-600'}`}>Income</button>
                </div>
                <input placeholder="e.g. Netflix" className="w-full p-4 rounded-xl text-sm font-semibold shadow-inner" value={desc} onChange={e => setDesc(e.target.value)} />
                <div className="flex gap-4">
                  <input type="number" placeholder="Amt" className="w-1/2 p-4 rounded-xl text-lg font-bold shadow-inner" value={amount} onChange={e => setAmount(e.target.value)} />
                  <select className="w-1/2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest shadow-inner" value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="p-4 bg-black/40 rounded-xl space-y-3 border border-white/5 shadow-inner">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Monthly Recur?</span>
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-5 h-5 rounded-lg accent-emerald-500" />
                  </label>
                  {isRecurring && (
                    <div className="space-y-2 animate-in">
                      <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Expiration Limit</p>
                      <input type="date" className="w-full p-3 rounded-xl text-xs font-bold shadow-inner" value={recurrenceExpiry} onChange={e => setRecurrenceExpiry(e.target.value)} />
                    </div>
                  )}
                </div>
                <button onClick={() => { if(desc && amount) { addTransaction({ description: desc, amount: parseFloat(amount), type, category, isRecurring, recurrenceExpiry }); setDesc(''); setAmount(''); } }} className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95 ${type === 'income' ? 'bg-emerald-500 text-black shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>Commit Log</button>
              </div>
              <div className="glass p-8 rounded-[2.5rem] text-center border-white/5 shadow-2xl">
                <Camera className="mx-auto text-emerald-500/30 mb-4" size={32} />
                <label className="block w-full py-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-all">
                  {isScanning ? 'Parsing vision...' : 'Receipt Scanner'}
                  <input type="file" className="hidden" accept="image/*" onChange={scanReceipt} disabled={isScanning} />
                </label>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="glass p-10 rounded-[2.5rem] flex flex-col shadow-2xl border-white/5">
                <div className="flex items-center gap-4 mb-8">
                  <Smartphone className="text-emerald-500" size={24} />
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white">UPI SMS Parser</h3>
                </div>
                <textarea id="upiText" placeholder="Paste bank SMS alerts here..." className="w-full h-40 rounded-[2rem] p-8 text-sm mb-6 resize-none custom-scrollbar font-medium bg-black/40 shadow-inner" />
                <button onClick={() => parseUPIText(document.getElementById('upiText').value)} className="w-full py-5 bg-emerald-600 font-black rounded-[2rem] uppercase tracking-[0.2em] text-[10px] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95">
                  {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />} Synchronize UPI
                </button>
              </div>
              <div className="glass p-8 rounded-[3rem] flex-1 overflow-hidden shadow-2xl border-white/5">
                <div className="flex items-center gap-3 mb-6"><History className="text-slate-600" size={18} /><h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Real-time Ledger</h3></div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                  {transactions.slice(0, 10).map(t => (
                    <div key={t._id} className="item-card p-5 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-white/[0.02]">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {t.type === 'income' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate w-32 md:w-64 leading-none mb-1">{t.description}</p>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{t.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <p className={`text-sm font-black tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>₹{t.amount.toLocaleString()}</p>
                        <button onClick={() => deleteTransaction(t._id)} className="delete-btn p-2 text-rose-500/40 hover:text-rose-500 transition-all active:scale-90"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && <div className="py-20 text-center text-slate-800 font-black uppercase text-[10px] tracking-[0.4em]">Ledger empty</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CHARTS MODULE --- */}
        {currentModule === 'visualiser' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in">
             <div className="glass p-12 rounded-[3.5rem] h-[550px] shadow-2xl border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12">Expense Proportions</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
                      const idx = acc.findIndex(a => a.name === t.category);
                      if(idx > -1) acc[idx].value += t.amount;
                      else acc.push({ name: t.category, value: t.amount });
                      return acc;
                    }, [])} innerRadius={90} outerRadius={140} paddingAngle={8} dataKey="value">
                      {COLORS.map((c, i) => <Cell key={i} fill={c} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{background: '#0a0a0a', border:'1px solid #222', borderRadius:'24px', color: 'white'}} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="glass p-12 rounded-[3.5rem] h-[550px] shadow-2xl border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12">Visualiser</h3>
                <ResponsiveContainer width="100%" height="80%">
                   <AreaChart data={transactions.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111" opacity={0.5} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#444" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip contentStyle={{background: '#0a0a0a', border:'1px solid #222', borderRadius:'20px', color: 'white'}} />
                      <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={4} fillOpacity={0.2} fill="#10b981" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {/* --- SUMMARY MODULE --- */}
        {currentModule === 'summariser' && (
          <div className="max-w-4xl mx-auto glass p-20 rounded-[4rem] text-center border-emerald-500/10 shadow-2xl relative overflow-hidden animate-in">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03]"><Zap size={300} /></div>
             <FileText className="mx-auto mb-10 text-emerald-500" size={64} />
             <h2 className="text-5xl font-extrabold uppercase mb-12 tracking-tighter text-white">Expense <span className="text-emerald-400">Summariser</span></h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                <div className="p-10 bg-black/40 rounded-[3rem] border border-white/5 shadow-inner">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Daily Spend Rate</p>
                   <p className="text-3xl font-extrabold text-white">₹{(stats.expense / 30).toFixed(0)}</p>
                </div>
                <div className="p-10 bg-black/40 rounded-[3rem] border border-white/5 shadow-inner">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Savings Ratio</p>
                   <p className="text-3xl font-extrabold text-emerald-500">{stats.income > 0 ? Math.round(((stats.income - stats.expense) / stats.income) * 100) : 0}%</p>
                </div>
                <div className="p-10 bg-black/40 rounded-[3rem] border border-white/5 shadow-inner">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Total Tracked Logs</p>
                   <p className="text-3xl font-extrabold text-emerald-500">{transactions.length}</p>
                </div>
             </div>
             <button onClick={() => {
                const headers = ["Date", "Description", "Category", "Type", "Amount"];
                const rows = transactions.map(t => [new Date(t.date).toLocaleDateString(), t.description.replace(/,/g, ''), t.category, t.type, t.amount]);
                const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
                const link = document.createElement("a");
                link.setAttribute("href", encodeURI(csv));
                link.setAttribute("download", "FinSight_Audit.csv");
                link.click();
             }} className="px-16 py-6 bg-emerald-500 hover:bg-emerald-400 text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center gap-5 mx-auto shadow-xl transition-all active:scale-95">
                <Download size={20}/> Generate Audit Report
             </button>
          </div>
        )}

        {/* --- SEARCH MODULE --- */}
        {currentModule === 'filter' && (
          <div className="space-y-10 animate-in">
             <div className="glass p-10 rounded-[3.5rem] flex flex-wrap gap-8 items-center border-white/5 shadow-2xl">
                <div className="flex-1 relative min-w-[200px] group">
                   <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" size={24} />
                   <input placeholder="Neural query (e.g. Amazon, Netflix...)" className="w-full py-6 pl-24 pr-10 rounded-[2.5rem] text-sm font-bold shadow-inner bg-black/20" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex bg-black/60 p-1.5 rounded-3xl border border-white/10 shrink-0">
                   {['All', 'Income', 'Expense'].map(btn => (
                     <button key={btn} onClick={() => setFilterType(btn)} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === btn ? 'bg-emerald-500 text-black' : 'text-slate-600 hover:text-slate-400'}`}>{btn}</button>
                   ))}
                </div>
             </div>
             <div className="glass rounded-[3.5rem] overflow-hidden border-white/5 shadow-2xl">
                <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                   {filteredData.map(t => (
                     <div key={t._id} className="item-card p-10 border-b border-white/[0.03] hover:bg-white/[0.01] transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-10 min-w-0">
                           <div className={`p-6 rounded-[2.5rem] shrink-0 ${t.type === 'income' ? 'bg-emerald-500/5 text-emerald-500' : 'bg-rose-500/5 text-rose-500'} border border-white/5`}>
                              {t.type === 'income' ? <ArrowUpRight size={32}/> : <ArrowDownLeft size={32}/>}
                           </div>
                           <div className="min-w-0">
                              <div className="flex items-center gap-5 mb-3">
                                <p className="text-xl font-extrabold text-white leading-none truncate">{t.description}</p>
                                {t.isRecurring && <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0"><Repeat size={12} className="text-emerald-500 animate-pulse" /><span className="text-[9px] font-black uppercase text-emerald-500">Recurrence log</span></div>}
                              </div>
                              <p className="text-[11px] font-black uppercase text-slate-700 tracking-[0.3em]">{new Date(t.date).toDateString()} • {t.category}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-16 shrink-0">
                           <p className={`text-3xl font-black tabular-nums tracking-tighter ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</p>
                           <button onClick={() => deleteTransaction(t._id)} className="delete-btn p-4 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-90"><Trash2 size={24}/></button>
                        </div>
                     </div>
                   ))}
                   {filteredData.length === 0 && <div className="p-40 text-center text-slate-900 font-black uppercase text-[14px] tracking-[0.6em]">No active logs</div>}
                </div>
             </div>
          </div>
        )}

      </main>

      <div className="p-4 text-center opacity-20"><p className="text-[8px] font-black uppercase tracking-[0.8em]">FinSight...</p></div>
    </div>
  );
}