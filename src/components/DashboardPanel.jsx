import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sankey, Rectangle } from 'recharts';
import { CATEGORIES, COLORS, EXPENSE_CATEGORIES } from '../constants';


const MoneyFlowChart = ({ transactions, currency }) => {
    const data = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        if (income === 0) return null;

        const nodes = [{ name: 'Income' }];
        const links = [];

        const expenseTotals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        Object.keys(expenseTotals).forEach(category => {
            nodes.push({ name: category });
            links.push({ source: 0, target: nodes.length - 1, value: expenseTotals[category] });
        });

        const totalExpenses = Object.values(expenseTotals).reduce((sum, v) => sum + v, 0);
        if (income > totalExpenses) {
            nodes.push({ name: 'Savings' });
            links.push({ source: 0, target: nodes.length - 1, value: income - totalExpenses });
        }

        return { nodes, links };
    }, [transactions]);

    if (!data) return <div className="flex items-center justify-center h-full text-text-secondary"><p>Add some income to see your money flow.</p></div>;

    return (
        <ResponsiveContainer>
            <Sankey data={data} node={<SankeyNode />} nodePadding={50} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Tooltip formatter={(value) => `${currency}${value.toLocaleString()}`} />
            </Sankey>
        </ResponsiveContainer>
    );
};

const SankeyNode = ({ x, y, width, height, index, payload, containerWidth }) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <Rectangle x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} fillOpacity="0.9" rx={4} ry={4}>
      <text
        textAnchor={isOut ? 'end' : 'start'}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="14"
        className="fill-text-primary"
        stroke={isOut ? null : '#fff'}
        strokeWidth={isOut ? null : 3}
        paintOrder="stroke"
      >
        {payload.name}
      </text>
    </Rectangle>
  );
};


const TimelineChart = ({ transactions, currency }) => {
    if (transactions.length === 0) return <div className="flex items-center justify-center h-full text-text-secondary"><p>No transactions for the timeline.</p></div>;
    return (
        <div className="h-full overflow-y-auto pr-4">
            <div className="relative border-l-2 border-primary/20 ml-4">
                {transactions.slice(0, 15).map((t, index) => (
                    <div key={t.id} className="mb-8 ml-8">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-primary/20 rounded-full -left-3 ring-8 ring-card-bg">
                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                        </span>
                        <div className="p-3 bg-card-bg-light rounded-lg shadow-sm">
                            <p className="font-bold text-text-primary">{t.description}</p>
                            <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                            </p>
                            <time className="text-xs text-text-secondary">{new Date(t.date).toLocaleDateString()}</time>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


const ExpensePieChart = ({ transactions, currency }) => {
    const pieChartData = useMemo(() => {
        const categoryTotals = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});
        return EXPENSE_CATEGORIES.map(cat => ({ name: cat, value: categoryTotals[cat] || 0 })).filter(item => item.value > 0);
    }, [transactions]);

    if (pieChartData.length === 0) return <div className="flex items-center justify-center h-full text-text-secondary"><p>Add an expense to see your chart.</p></div>;
    return (
        <ResponsiveContainer>
            <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[CATEGORIES.indexOf(entry.name) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${currency}${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--color-card-bg-light)', border: 'none', borderRadius: '0.5rem' }}/>
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

const MonthlyBarChart = ({ transactions, currency }) => {
     const barChartData = useMemo(() => {
        const months = {};
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        transactions.forEach(t => {
            const date = new Date(t.date);
            if (date >= sixMonthsAgo) {
                const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!months[month]) months[month] = { name: month, income: 0, expenses: 0, date: new Date(date.getFullYear(), date.getMonth()) };
                if (t.type === 'income') months[month].income += t.amount;
                else months[month].expenses += t.amount;
            }
        });
        return Object.values(months).sort((a,b) => a.date - b.date);
    }, [transactions]);

    if (barChartData.length === 0) return <div className="flex items-center justify-center h-full text-text-secondary"><p>No data for the past 6 months.</p></div>;
    return (
        <ResponsiveContainer>
            <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${currency}${value/1000}k`} />
                <Tooltip formatter={(value) => `${currency}${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--color-card-bg-light)', border: 'none', borderRadius: '0.5rem' }}/>
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
        </ResponsiveContainer>
    );
};


const DashboardPanel = ({ transactions, currency }) => {
    const [view, setView] = useState('flow');

    return (
        <div className="bg-card-bg rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text-primary">Financial Overview</h2>
                <div className="flex gap-1 bg-background p-1 rounded-lg">
                    {['flow', 'timeline', 'pie', 'bar'].map(v => (
                        <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${view === v ? 'bg-primary text-white' : 'hover:bg-card-bg-light'}`}>
                            {v}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%', height: 350 }}>
                {view === 'pie' && <ExpensePieChart transactions={transactions} currency={currency} />}
                {view === 'bar' && <MonthlyBarChart transactions={transactions} currency={currency} />}
                {view === 'flow' && <MoneyFlowChart transactions={transactions} currency={currency} />}
                {view === 'timeline' && <TimelineChart transactions={transactions} currency={currency} />}
            </div>
        </div>
    );
}

export default DashboardPanel;
