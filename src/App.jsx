import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar, Settings, Trophy, CheckCircle2, WifiOff, ArrowRightLeft, Clock, Activity, Zap, Check, X
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sankey, BarChart, Bar, XAxis, YAxis, CartesianGrid, Rectangle, LineChart, Line } from 'recharts';

// --- Configuration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-expense-visualizer';
const firebaseConfig = {
  apiKey: "AIzaSyCFZpjC67_zrVuJBqEh3jS1FPmyBO0hucg",
  authDomain: "expense-tracker-4e7af.firebaseapp.com",
  projectId: "expense-tracker-4e7af",
  storageBucket: "expense-tracker-4e7af.firebasestorage.app",
  messagingSenderId: "563538150499",
  appId: "1:563538150499:web:09961aecc0a1e12697a456"
};

// Initialize Firebase
let app;
if (!getApps().length) { app = initializeApp(firebaseConfig); } 
else { app = getApps()[0]; }
const auth = getAuth(app);
const db = getFirestore(app);

const CATEGORIES = ['Food', 'Shopping', 'Travel', 'Entertainment', 'Others'];
const COLORS = ['#38bdf8', '#818cf8', '#fbbf24', '#f472b6', '#94a3b8', '#34d399'];
const FLOW_COLORS = ['#38bdf8', '#6366f1', '#10b981', '#f43f5e', '#a78bfa', '#f59e0b'];

// --- UI THEME STYLES ---
const ThemeStyles = () => (
  <style>{`
    :root { 
      --bg: #020617; 
      --card-bg: rgba(15, 23, 42, 0.8); 
      --text-main: #f8fafc; 
      --text-sub: #94a3b8; 
      --border: rgba(51, 65, 85, 0.5); 
      --primary: #38bdf8; 
      --accent: #6366f1;
      --card-light: rgba(30, 41, 59, 0.6);
      --tooltip-bg: #1e293b;
      --tooltip-text: #f8fafc;
    }
    body { 
      background-color: var(--bg); 
      color: var(--text-main); 
      font-family: 'Inter', sans-serif; 
      overflow-x: hidden; 
    }
    .glass-card { 
      background: var(--card-bg); 
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border); 
      border-radius: 1.5rem; 
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5); 
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .btn-gradient {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      transition: all 0.3s ease;
      color: white;
    }
    .btn-gradient:hover {
      filter: brightness(1.1);
      box-shadow: 0 10px 25px -5px rgba(56, 189, 248, 0.4);
    }
    .input-field {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1rem 1.25rem;
      color: var(--text-main);
      outline: none;
      transition: all 0.2s;
      width: 100%;
    }
    .input-field:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
    }
    .select-field {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2338bdf8' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1rem;
      padding-right: 3rem;
      color: var(--primary);
      font-weight: 800;
      background-color: #0f172a;
      cursor: pointer;
      border: 1px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .select-field option {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 12px;
      font-weight: 600;
    }
    .text-glow { text-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
  `}</style>
);

// --- MAIN APP ---
export default function App() {
  const [userId, setUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);
  const [currency] = useState('₹');

  useEffect(() => {
    document.title = "Smart Expense Visualizer";
  }, []);


  // 1. Authentication Persistence
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token).catch(() => signInAnonymously(auth));
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, user => setUserId(user?.uid || null));
  }, []);

  // 2. Real-time Database Persistence (Firestore)
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const transRef = collection(db, 'artifacts', appId, 'users', userId, 'transactions');
    const qTrans = query(transRef, orderBy('date', 'desc'));
    const unsubTrans = onSnapshot(qTrans, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error("Cloud connection fail:", err);
      setLoading(false);
    });

    const budgetRef = doc(db, 'artifacts', appId, 'users', userId, 'budgets', 'monthly');
    const unsubBudgets = onSnapshot(budgetRef, snap => {
      if (snap.exists()) setBudgets(snap.data());
    });

    return () => { unsubTrans(); unsubBudgets(); };
  }, [userId]);

  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  const addTransaction = async (data) => {
    if (!userId) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'transactions'), {
      ...data,
      date: new Date().toISOString()
    });
  };

  const deleteTransaction = async (id) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'transactions', id));
  };

  const updateBudget = async (category, amount) => {
    if (!userId) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'budgets', 'monthly'), {
      [category]: amount
    }, { merge: true });
  };

  if (loading && !transactions.length) return <LoadingScreen />;

  return (
    <div className="min-h-screen p-6 sm:p-12 transition-all duration-700 bg-[#020617]">
      <ThemeStyles />
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 animate-in">
          <div>
            <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-sky-400 to-indigo-500 bg-clip-text text-transparent pb-2">
              Smart Expense Visualizer
            </h1>
          </div>
          <div className="glass-card p-1.5 bg-gradient-to-br from-sky-500/30 to-indigo-500/30 shadow-2xl">
            <div className="bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[1.25rem] min-w-[320px] flex items-center gap-8 border border-white/5">
              <div className="p-4 bg-sky-500/10 rounded-[1.5rem] border border-sky-500/20 shadow-inner group transition-all hover:scale-110">
                <Wallet className="text-sky-400 w-10 h-10 group-hover:rotate-12 transition-transform" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Balance</p>
                <p className={`text-5xl font-black tracking-tighter tabular-nums text-glow ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency}{Math.abs(balance).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <VisualizerPanel transactions={transactions} currency={currency} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <BudgetPanel budgets={budgets} expenses={transactions.filter(t => t.type === 'expense')} onUpdateBudget={updateBudget} currency={currency} />
              <AchievementsPanel transactions={transactions} />
            </div>
          </div>

          <div className="lg:col-span-4 glass-card flex flex-col h-[1050px] overflow-hidden border-t-4 border-t-sky-500 shadow-sky-900/20">
            <div className="p-10 border-b border-slate-700/50 bg-slate-800/10 backdrop-blur-md">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-4 uppercase tracking-tighter">
                <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20"><ArrowRightLeft size={24} className="text-sky-400" /></div> 
                Entries
              </h2>
              <AddForm onAdd={addTransaction} currency={currency} />
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-900/10">
              <div className="flex justify-between items-center mb-4">
                 <p className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Temporal Feed</p>
                 <span className="text-[10px] font-bold text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-lg">{transactions.length} Records</span>
              </div>
              
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-6 bg-slate-800/30 backdrop-blur-sm rounded-[1.75rem] group hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700/50 shadow-sm hover:shadow-2xl hover:scale-[1.02]">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl shadow-inner transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {t.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black truncate max-w-[160px] leading-tight text-slate-200 mb-1">{t.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.category}</p>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-[10px] text-slate-600 font-bold uppercase">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <p className={`text-lg font-black tabular-nums ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                    </p>
                    <button onClick={() => deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 transition-all p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const VisualizerPanel = ({ transactions, currency }) => {
  const [view, setView] = useState('flow');

  const sankeyData = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    if (income === 0) return null;
    const nodes = [{ name: 'Total Income' }];
    const links = [];
    const expTotals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    Object.keys(expTotals).forEach((cat, i) => {
      nodes.push({ name: cat });
      links.push({ source: 0, target: i + 1, value: expTotals[cat] });
    });
    const totalExp = Object.values(expTotals).reduce((a, b) => a + b, 0);
    if (income > totalExp) {
      nodes.push({ name: 'Net Savings' });
      links.push({ source: 0, target: nodes.length - 1, value: income - totalExp });
    }
    return { nodes, links };
  }, [transactions]);

  const pieData = useMemo(() => {
    const totals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    return Object.keys(totals).map(name => ({ name, value: totals[name] }));
  }, [transactions]);

  const timelineGraphData = useMemo(() => {
    const reversed = [...transactions].reverse();
    let runningBalance = 0;
    return reversed.map(t => {
      runningBalance += (t.type === 'income' ? t.amount : -t.amount);
      return {
        date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: runningBalance
      };
    });
  }, [transactions]);

  const CustomSankeyNode = ({ x, y, width, height, index, payload, containerWidth }) => {
    const isOut = x + width + 6 > containerWidth;
    return (
      <Rectangle x={x} y={y} width={width} height={height} fill={FLOW_COLORS[index % FLOW_COLORS.length]} fillOpacity="0.9" rx={6} ry={6}>
        <text textAnchor={isOut ? 'end' : 'start'} x={isOut ? x - 8 : x + width + 8} y={y + height / 2} fontSize="12" fontWeight="800" fill="#f8fafc">
          {payload.name}
        </text>
      </Rectangle>
    );
  };

  return (
    <div className="glass-card p-10 h-[580px] flex flex-col mb-10 animate-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20 shadow-inner"><Activity className="text-sky-400 w-6 h-6" /></div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Visualizer</h2>
        </div>
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-3xl shadow-2xl">
          {['flow', 'timeline', 'pie'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${view === v ? 'bg-sky-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer>
          {view === 'flow' ? (
            sankeyData ? <Sankey data={sankeyData} node={<CustomSankeyNode />} nodePadding={50} margin={{ top: 20, bottom: 20, right: 120, left: 20 }}>
              <Tooltip formatter={(v) => `${currency}${v.toLocaleString()}`} contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'16px', fontWeight:'bold', color: '#f8fafc', padding: '12px'}} />
            </Sankey> : <div className="h-full w-full" />
          ) : view === 'timeline' ? (
            <LineChart data={timelineGraphData} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="5 5" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dy={15} />
              <YAxis stroke="#64748b" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} dx={-15} tickFormatter={(v) => `${currency}${v/1000}k`} />
              <Tooltip contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'16px', fontWeight:'bold', color: '#f8fafc', padding: '12px'}} formatter={(v) => `${currency}${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="balance" stroke="#38bdf8" strokeWidth={4} dot={{ fill: '#38bdf8', r: 5, strokeWidth: 0 }} activeDot={{ r: 8, stroke: '#020617', strokeWidth: 4 }} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={pieData} innerRadius={100} outerRadius={140} paddingAngle={8} dataKey="value" stroke="none">
                {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${currency}${v.toLocaleString()}`} contentStyle={{backgroundColor:'#1e293b', border:'none', borderRadius:'16px', fontWeight:'bold', color: '#f8fafc'}} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const BudgetPanel = ({ budgets, expenses, onUpdateBudget, currency }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const monthlyExpenses = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
  }, [expenses]);

  const handleSaveEdit = (cat) => {
    const amt = parseFloat(inputValue) || 0;
    onUpdateBudget(cat, amt);
    setEditingCategory(null);
  };

  return (
    <div className="glass-card p-10 h-[480px] flex flex-col transition-all border-t-4 border-t-amber-500/50">
      <h2 className="text-xl font-black mb-10 flex items-center gap-4 text-amber-400 uppercase tracking-tighter">
        <Calendar className="w-7 h-7" /> Budgets
      </h2>
      <div className="flex-1 space-y-10 overflow-y-auto custom-scrollbar pr-4">
        {CATEGORIES.map(cat => {
          const spent = monthlyExpenses[cat] || 0;
          const limit = budgets[cat] || 0;
          const progress = limit > 0 ? (spent / limit) * 100 : 0;
          const isEditing = editingCategory === cat;

          return (
            <div key={cat} className="group relative">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-300">{cat}</span>
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <input type="number" value={inputValue} autoFocus onChange={e => setInputValue(e.target.value)}
                      className="bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-1 text-xs text-white w-24 outline-none shadow-2xl" />
                    <button onClick={() => handleSaveEdit(cat)} className="text-emerald-400 transition-transform hover:scale-125"><Check size={18}/></button>
                    <button onClick={() => setEditingCategory(null)} className="text-rose-500 transition-transform hover:scale-125"><X size={18}/></button>
                  </div>
                ) : (
                  <span className={`text-xs font-black tabular-nums ${progress > 100 ? 'text-rose-500' : 'text-slate-300'}`}>
                    {currency}{spent.toLocaleString()} <span className="text-slate-600 font-bold px-1">/</span> <span className="text-amber-500/80">{currency}{limit.toLocaleString()}</span>
                  </span>
                )}
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className={`h-full transition-all duration-[1.5s] ease-out ${progress > 100 ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`} 
                  style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              {!isEditing && (
                <button onClick={() => { setEditingCategory(cat); setInputValue(limit); }}
                  className="absolute -right-3 -top-3 p-2 bg-slate-800 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-600 shadow-2xl border border-white/10">
                  <Settings size={12} className="text-white" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AchievementsPanel = ({ transactions }) => {
  const unlocked = useMemo(() => {
    const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    return [
      { id: 1, title: 'Master Saver', icon: <Trophy />, desc: 'Accrued 10k in assets', locked: incomeTotal < 10000 },
      { id: 2, title: 'Entry Habit', icon: <CheckCircle2 />, desc: 'Log 10+ records', locked: transactions.length < 10 },
      { id: 3, title: 'Wealth Starter', icon: <TrendingUp />, desc: 'First 1k tracked', locked: incomeTotal < 1000 }
    ];
  }, [transactions]);

  return (
    <div className="glass-card p-10 h-[480px] flex flex-col border-t-4 border-t-emerald-500/50">
      <h2 className="text-xl font-black mb-10 flex items-center gap-4 text-emerald-400 uppercase tracking-tighter">
        <Trophy className="w-7 h-7" /> Milestones
      </h2>
      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-3">
        {unlocked.map(a => (
          <div key={a.id} className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-500 ${a.locked ? 'bg-slate-800/10 border-slate-800 opacity-20 grayscale' : 'bg-emerald-500/5 border-emerald-500/20 hover:scale-[1.03] shadow-lg'}`}>
            <div className={`p-5 rounded-2xl ${a.locked ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}>
              {a.icon}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight leading-none mb-2 text-white">{a.title}</p>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddForm = ({ onAdd, currency }) => {
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [type, setType] = useState('expense');
  const [cat, setCat] = useState('Food');

  const handleTypeChange = (newType) => {
    setType(newType);
    setCat(newType === 'income' ? 'Income' : 'Food');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desc || !amt) return;
    onAdd({ description: desc, amount: parseFloat(amt), type, category: cat });
    setDesc(''); setAmt('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex bg-slate-950 p-1.5 rounded-[1.25rem] border border-white/5 shadow-2xl">
        <button type="button" onClick={() => handleTypeChange('expense')} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${type === 'expense' ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105' : 'text-slate-500 hover:text-slate-300'}`}>Expense</button>
        <button type="button" onClick={() => handleTypeChange('income')} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${type === 'income' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-105' : 'text-slate-500 hover:text-slate-300'}`}>Income</button>
      </div>
      <div className="space-y-5">
        <input className="w-full input-field font-black placeholder:text-slate-700 tracking-tight" placeholder="Label Entry" value={desc} onChange={e => setDesc(e.target.value)} required />
        <div className="flex gap-4">
          {/* Restored amount input size and alignment */}
          <input type="number" className="flex-[1.5] input-field font-black tabular-nums" placeholder={`0.00 ${currency}`} value={amt} onChange={e => setAmt(e.target.value)} required />
          <select className="flex-1 input-field select-field" value={cat} onChange={e => setCat(e.target.value)}>
            {type === 'expense' ? CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : <option value="Income">Income</option>}
          </select>
        </div>
      </div>
      <button type="submit" className="w-full py-6 rounded-[1.5rem] btn-gradient font-black uppercase tracking-[0.4em] text-[12px] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95">
        <Plus size={22} strokeWidth={3} /> Commit Entry
      </button>
    </form>
  );
};

const LoadingScreen = () => (
  <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
    <div className="relative w-24 h-24 mb-10">
      <div className="absolute inset-0 border-4 border-sky-500/10 rounded-full" />
      <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <div className="absolute inset-5 bg-sky-500/10 rounded-full animate-pulse flex items-center justify-center"><Zap className="text-sky-400 w-6 h-6" /></div>
    </div>
    <p className="tracking-[0.6em] font-black uppercase text-[10px] text-sky-400/60 animate-pulse">Initializing Virtual Vault</p>
  </div>
);
