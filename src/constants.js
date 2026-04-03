export const CATEGORIES = {
  expense: [
    'Food 🍔', 
    'Shopping 🛍️', 
    'Travel ✈️', 
    'Entertainment 🎬', 
    'Bills ⚡', 
    'Others 📦'
  ],
  income: [
    'Salary 💰', 
    'Freelance 💻', 
    'Investment 📈', 
    'Gift 🎁', 
    'Others 💵'
  ]
};

// These colors match the Noir & Emerald premium theme
export const COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a78bfa', // Purple
  '#f472b6', // Pink
  '#f43f5e', // Rose
  '#fbbf24', // Amber
  '#0ea5e9'  // Sky
];

export const CURRENCIES = { 
  '₹': 'INR', 
  '$': 'USD', 
  '€': 'EUR' 
};

// Updated to the name you chose
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-expense-tracker';