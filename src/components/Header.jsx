import React from 'react';

const Header = ({ balance, currency }) => (
  <header className="flex flex-wrap justify-between items-center gap-4">
    <div>
        <h1 className="text-4xl font-bold tracking-tighter text-text-primary">Smart Expense Visualizer</h1>
        <p className="text-text-secondary mt-1">Your complete financial dashboard.</p>
    </div>
    <div className="text-right">
        <p className="text-text-secondary text-sm">Current Balance</p>
        <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {currency}{(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
    </div>
  </header>
);

export default Header;
