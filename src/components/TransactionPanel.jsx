import React, { useState, useEffect } from 'react';
import { EXPENSE_CATEGORIES } from '../constants';


const AddTransactionForm = ({ onAddTransaction }) => {
    const [type, setType] = useState('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  
    const handleSubmit = (e) => { e.preventDefault(); if (!description || !amount) return; onAddTransaction({ description, amount: parseFloat(amount), category, type, date: new Date().toISOString() }); setDescription(''); setAmount(''); };
    useEffect(() => { setCategory(type === 'income' ? 'Income' : EXPENSE_CATEGORIES[0]); }, [type]);

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex bg-background p-1 rounded-lg">
                <button type="button" onClick={() => setType('expense')} className={`w-1/2 rounded-md py-1 transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : ''}`}>Expense</button>
                <button type="button" onClick={() => setType('income')} className={`w-1/2 rounded-md py-1 transition-colors ${type === 'income' ? 'bg-green-600 text-white' : ''}`}>Income</button>
            </div>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full p-2 bg-background rounded-md border border-border outline-none focus:ring-2 focus:ring-primary" required />
            <div className="flex gap-2">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-1/2 p-2 bg-background rounded-md border border-border outline-none focus:ring-2 focus:ring-primary" required />
                <select value={category} onChange={e => setCategory(e.target.value)} disabled={type === 'income'} className="w-1/2 p-2 bg-background rounded-md border border-border outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
                    {type === 'income' ? <option>Income</option> : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <button type="submit" className="w-full p-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80">Add Transaction</button>
        </form>
    );
}

const EditModal = ({ transaction, onClose, onUpdate, currency }) => {
    const [description, setDescription] = useState(transaction.description);
    const [amount, setAmount] = useState(transaction.amount);
    const [category, setCategory] = useState(transaction.category);
    const handleSubmit = (e) => { e.preventDefault(); onUpdate(transaction.id, { ...transaction, description, amount: parseFloat(amount), category }); onClose(); }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-card-bg rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-text-primary">Edit Transaction</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full p-2 bg-background rounded-md border border-border outline-none focus:ring-2 focus:ring-primary" required />
                    <div className="flex gap-2">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-1/2 p-2 bg-background rounded-md border border-border outline-none focus:ring-2 focus:ring-primary" required />
                         <select value={category} onChange={e => setCategory(e.target.value)} disabled={transaction.type === 'income'} className="w-1/2 p-2 bg-background rounded-md border border-border outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
                             {transaction.type === 'income' ? <option>Income</option> : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="w-1/2 p-2 bg-card-bg-light rounded-lg font-semibold hover:opacity-80">Cancel</button>
                        <button type="submit" className="w-1/2 p-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};



const TransactionPanel = ({ transactions, onAddTransaction, onDeleteTransaction, onUpdateTransaction, currency }) => {
  const [editingTransaction, setEditingTransaction] = useState(null);

  return (
    <div className="bg-card-bg rounded-2xl p-6 shadow-lg h-full">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">Transactions</h2>
      <AddTransactionForm onAddTransaction={onAddTransaction} />
      <div className="space-y-3 mt-6 max-h-[calc(100vh-250px)] overflow-y-auto">
        {transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-card-bg-light p-3 rounded-lg">
                <div>
                    <p className="font-bold text-text-primary">{t.description}</p>
                    <p className="text-sm text-text-secondary">{t.category}</p>
                </div>
                <div className="flex items-center gap-4">
                    <p className={`font-bold text-lg ${t.type==='income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type==='income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                    </p>
                    <button onClick={() => setEditingTransaction(t)} className="text-text-secondary/50 hover:text-yellow-400">&#9998;</button>
                    <button onClick={() => onDeleteTransaction(t.id)} className="text-text-secondary/50 hover:text-red-500 text-xl">&times;</button>
                </div>
            </div>
        ))}
      </div>
      {editingTransaction && (
          <EditModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onUpdate={onUpdateTransaction} currency={currency}/>
      )}
    </div>
  );
};

export default TransactionPanel;
