const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ Connection Error:', err));

// --- 1. SCHEMAS ---

const transactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  type: { type: String, enum: ['income', 'expense'] },
  date: { type: Date, default: Date.now }
});

const budgetSchema = new mongoose.Schema({
  category: { type: String, unique: true },
  amount: Number
});

const goalSchema = new mongoose.Schema({
  name: String,
  target: Number,
  saved: { type: Number, default: 0 }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const Goal = mongoose.model('Goal', goalSchema);

// --- 2. TRANSACTION ROUTES ---
app.get('/api/transactions', async (req, res) => {
  const data = await Transaction.find().sort({ date: -1 });
  res.json(data);
});

app.post('/api/transactions', async (req, res) => {
  const newItem = new Transaction(req.body);
  await newItem.save();
  res.json(newItem);
});

app.delete('/api/transactions/:id', async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// --- 3. BUDGET ROUTES ---
app.get('/api/budgets', async (req, res) => {
  const data = await Budget.find();
  // Convert array to object { Category: Amount } for the frontend
  const budgetObj = {};
  data.forEach(b => budgetObj[b.category] = b.amount);
  res.json(budgetObj);
});

app.post('/api/budgets', async (req, res) => {
  const { category, amount } = req.body;
  // This will update the budget if it exists, or create a new one (upsert)
  const budget = await Budget.findOneAndUpdate(
    { category }, 
    { amount }, 
    { upsert: true, new: true }
  );
  res.json(budget);
});

// --- 4. GOAL ROUTES ---
app.get('/api/goals', async (req, res) => {
  const data = await Goal.find();
  res.json(data);
});

app.post('/api/goals', async (req, res) => {
  const goal = new Goal(req.body);
  await goal.save();
  res.json(goal);
});

app.patch('/api/goals/:id', async (req, res) => {
  const { saved } = req.body;
  const goal = await Goal.findByIdAndUpdate(req.params.id, { saved }, { new: true });
  res.json(goal);
});

app.delete('/api/goals/:id', async (req, res) => {
  await Goal.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));