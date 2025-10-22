import React, { useState, useMemo } from 'react';
import { EXPENSE_CATEGORIES } from '../constants';

const BudgetPanel = ({ budgets, expenses, onSetBudget, currency }) => {
    const [editing, setEditing] = useState(null);
    const [value, setValue] = useState('');

    const monthlyExpenses = useMemo(() => {
        return expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});
    }, [expenses]);
    
    const handleSet = (category) => {
        onSetBudget(category, parseFloat(value));
        setEditing(null);
        setValue('');
    }

    return (
        <div className="bg-card-bg rounded-2xl p-6 shadow-lg h-full">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Monthly Budgets</h2>
            <div className="space-y-4">
                {EXPENSE_CATEGORIES.map(cat => {
                    const spent = monthlyExpenses[cat] || 0;
                    const budget = budgets[cat] || 0;
                    const progress = budget > 0 ? (spent / budget) * 100 : 0;
                    const isOver = spent > budget;

                    return (
                        <div key={cat}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-bold">{cat}</span>
                                {editing === cat ? (
                                    <form onSubmit={(e) => { e.preventDefault(); handleSet(cat); }} className="flex gap-2 items-center">
                                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-24 bg-background text-right rounded-md px-1 py-0.5" placeholder="Amount"/>
                                        <button type="submit" className="text-green-500 font-bold">Save</button>
                                        <button type="button" onClick={() => setEditing(null)} className="text-red-500 font-bold text-lg">&times;</button>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-text-secondary">{currency}{spent.toLocaleString()} / {currency}{budget.toLocaleString()}</span>
                                      <button onClick={() => { setEditing(cat); setValue(budget || ''); }} className="text-text-secondary/50 hover:text-primary text-xs">Edit</button>
                                    </div>
                                )}
                            </div>
                            <div className="w-full bg-background rounded-full h-2.5">
                                <div className={`${isOver ? 'bg-red-500' : 'bg-primary'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default BudgetPanel;
