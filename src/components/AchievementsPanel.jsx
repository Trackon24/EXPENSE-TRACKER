import React, { useMemo } from 'react';

const AchievementsPanel = ({ transactions, budgets, currency }) => {
    const achievements = useMemo(() => {
        const unlocked = [];
        const totalSaved = transactions.filter(t => t.type === 'income').reduce((s,t)=>s+t.amount,0) - transactions.filter(t => t.type === 'expense').reduce((s,t)=>s+t.amount,0);

        
        if (transactions.length > 0) unlocked.push({ id: 1, title: "Getting Started", emoji: "🚀", desc: "Logged your first transaction." });
        
        if (transactions.some(t => t.type === 'income')) unlocked.push({ id: 2, title: "Money Maker", emoji: "💰", desc: "Logged your first income." });
        
        if (totalSaved >= 1000) unlocked.push({ id: 3, title: "Super Saver", emoji: "🏅", desc: `Saved over ${currency}1,000!` });
     
        if (Object.keys(budgets).length > 0) unlocked.push({ id: 4, title: "Planner", emoji: "🎯", desc: "Set your first budget." });

        if (transactions.length >= 10) unlocked.push({ id: 5, title: "Active User", emoji: "🔥", desc: "Logged 10 transactions." });
        
        return unlocked;
    }, [transactions, budgets, currency]);

    return (
        <div className="bg-card-bg rounded-2xl p-6 shadow-lg h-full">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Achievements</h2>
            {achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {achievements.map(ach => (
                        <div key={ach.id} className="bg-card-bg-light p-3 rounded-lg text-center">
                            <div className="text-4xl mb-2">{ach.emoji}</div>
                            <p className="font-bold text-sm text-text-primary">{ach.title}</p>
                            <p className="text-xs text-text-secondary">{ach.desc}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-text-secondary text-center mt-8">Start tracking to unlock achievements!</p>
            )}
        </div>
    );
};

export default AchievementsPanel;
