export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Income', 'Other'];
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#22c55e', '#ff4d4d'];
export const EXPENSE_CATEGORIES = CATEGORIES.filter(c => c !== 'Income');
export const CURRENCIES = { '₹': 'INR', '$': 'USD', '€': 'EUR' };

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-expense-deluxe';
