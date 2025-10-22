import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import Header from './components/Header.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import BudgetPanel from './components/BudgetPanel.jsx';
import AchievementsPanel from './components/AchievementsPanel.jsx';
import TransactionPanel from './components/TransactionPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import ThemeStyles from './components/ThemeStyles.jsx';



const firebaseConfig = {
  apiKey: "AIzaSyCFZpjC67_zrVuJBqEh3jS1FPmyBO0hucg",
  authDomain: "expense-tracker-4e7af.firebaseapp.com",
  projectId: "expense-tracker-4e7af",
  storageBucket: "expense-tracker-4e7af.firebasestorage.app",
  messagingSenderId: "563538150499",
  appId: "1:563538150499:web:09961aecc0a1e12697a456"
};

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}
const auth = getAuth(app);


function App() {
  const [userId, setUserId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true); 
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [currency, setCurrency] = useLocalStorage('currency', '₹');


  useEffect(() => {
    setLoading(true); 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setLoading(false); 
      } else {
        try {
            if(initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
            else await signInAnonymously(auth);
           
        } catch (authError) {
          console.error("Authentication failed:", authError);
          setLoading(false); 
         }
      }
    });
    return () => unsubscribe();
  }, []);

 

 
  const { totalIncome, totalExpenses, currentBalance } = useMemo(() => {
    let income = 0, expenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    });
    return { totalIncome: income, totalExpenses: expenses, currentBalance: income - expenses };
  }, [transactions]);

  
  const handleAddTransaction = (transaction) => {
    
    const newTransaction = { ...transaction, id: Date.now().toString() };
    setTransactions(prev => [newTransaction, ...prev]); 
  };
  
  const handleDeleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  const handleUpdateTransaction = (id, updatedTransaction) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedTransaction } : t));
  }

  const handleSetBudget = (category, amount) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  }


  if (loading) return <LoadingScreen />;

  return (
    <div className={`theme-${theme}`}>
    <div className="min-h-screen bg-background text-text-primary font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Header balance={currentBalance} currency={currency} />
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
          <div className="lg:col-span-3">
            <DashboardPanel transactions={transactions} currency={currency} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {}
                <BudgetPanel budgets={budgets} expenses={transactions.filter(t=>t.type==='expense')} onSetBudget={handleSetBudget} currency={currency}/>
                <AchievementsPanel transactions={transactions} budgets={budgets} currency={currency} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <TransactionPanel 
                transactions={transactions} 
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                currency={currency}
            />
          </div>
        </main>
        <SettingsPanel theme={theme} setTheme={setTheme} currency={currency} setCurrency={setCurrency} />
      </div>
    </div>
    </div>
  );
}


const AppWithStyles = () => (
    <>
        <ThemeStyles />
        <App />
    </>
);

export default AppWithStyles;

