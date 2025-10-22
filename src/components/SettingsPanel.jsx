import React from 'react';
import { CURRENCIES } from '../constants';

const SettingsPanel = ({ theme, setTheme, currency, setCurrency }) => (
    <div className="fixed bottom-4 right-4 bg-card-bg p-3 rounded-full shadow-2xl flex items-center gap-4">
         <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-transparent font-bold text-lg text-text-primary">
            {Object.keys(CURRENCIES).map(c => <option key={c} value={c} className="bg-card-bg text-text-primary">{c}</option>)}
        </select>
        <div className="flex gap-1">
           <button onClick={() => setTheme('dark')} className={`w-6 h-6 rounded-full bg-gray-800 ${theme === 'dark' ? 'ring-2 ring-primary' : ''}`}></button>
           <button onClick={() => setTheme('light')} className={`w-6 h-6 rounded-full bg-white ${theme === 'light' ? 'ring-2 ring-primary' : ''}`}></button>
           <button onClick={() => setTheme('minimal')} className={`w-6 h-6 rounded-full bg-blue-100 ${theme === 'minimal' ? 'ring-2 ring-primary' : ''}`}></button>
        </div>
    </div>
);

export default SettingsPanel;
