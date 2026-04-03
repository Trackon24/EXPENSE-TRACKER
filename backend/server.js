const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Groq = require("groq-sdk");
require('dotenv').config();
const Tesseract = require("tesseract.js");
// Import the Transaction model
const Transaction = require('./models/Transaction');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;

// Initialize Groq AI
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ FinSight Engine: MongoDB Connected Successfully!'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// --- AI ROUTES ---

/**
 * AI UPI PARSER
 * Processes SMS text via Groq and auto-saves to MongoDB
 */
app.post('/api/ai/parse-upi', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text || !userId) {
      return res.status(400).json({ error: "Missing text or userId" });
    }

    const prompt = `Analyze this UPI transaction SMS: "${text}".
Extract the following fields into a JSON object:
1. "amount": the numerical value only
2. "type": must be exactly "income" (if money was received/credited) or "expense" (if money was paid/debited)
3. "name": the merchant or person involved

Return ONLY valid raw JSON. No markdown, no explanations.

Format:
{"amount": number, "type": "income"|"expense", "name": "string"}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a strict financial transaction extraction assistant. Always return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0
    });

    const rawText = completion.choices[0].message.content;

    // Extract JSON safely
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI failed to return a valid JSON structure.");
    }

    const ext = JSON.parse(jsonMatch[0]);

    // Save result to MongoDB
    const saved = await new Transaction({
      description: `UPI: ${ext.name}`,
      amount: ext.amount,
      type: ext.type,
      userId: userId,
      category: ext.type === 'income' ? 'Salary 💰' : 'Others 📦'
    }).save();

    console.log(`🤖 Groq Parsed UPI: ${ext.name} (₹${ext.amount})`);
    res.json(saved);

  } catch (err) {
    console.error("❌ AI UPI Error:", err.message);
    res.status(500).json({ error: "AI Parsing failed", details: err.message });
  }
});

/**
 * RECEIPT SCAN FALLBACK
 * Groq image support is not used here, so we return a safe fallback
 */
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { base64, userId } = req.body;

    if (!base64 || !userId) {
      return res.status(400).json({ error: "Missing image data or userId" });
    }

    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    const result = await Tesseract.recognize(imageBuffer, "eng");
    const extractedText = result.data.text;

    console.log("🧾 OCR Extracted Text:\n", extractedText);

    const lines = extractedText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Try to find merchant = first meaningful line
    const merchant = lines.length > 0 ? lines[0] : "Unknown Merchant";

    let amount = null;

    // Priority keywords for totals
    const totalKeywords = [
      "grand total",
      "total",
      "amount",
      "subtotal",
      "sub total",
      "balance due"
    ];

    // First pass: search for total lines
    for (let line of lines) {
      const lowerLine = line.toLowerCase();

      if (totalKeywords.some(keyword => lowerLine.includes(keyword))) {
        const matches = line.match(/\d+(?:\.\d{1,2})?/g);
        if (matches && matches.length > 0) {
          const nums = matches
            .map(n => parseFloat(n))
            .filter(n => !isNaN(n));

          if (nums.length > 0) {
            amount = nums[nums.length - 1]; // usually total is last number on line
          }
        }
      }
    }

    // Fallback: if no total found, pick highest decimal amount only
    if (!amount) {
      const allAmounts = extractedText.match(/\d+\.\d{2}/g);

      if (allAmounts && allAmounts.length > 0) {
        const numericAmounts = allAmounts
          .map(a => parseFloat(a))
          .filter(n => !isNaN(n));

        amount = Math.max(...numericAmounts);
      }
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Could not detect total amount from receipt",
        extractedText
      });
    }

    const saved = await new Transaction({
      description: `Scan: ${merchant}`,
      amount: amount,
      type: 'expense',
      userId: userId,
      category: 'Shopping 🛍️'
    }).save();

    console.log(`👁️ OCR Parsed Receipt: ${merchant} (₹${amount})`);
    res.json(saved);

  } catch (err) {
    console.error("❌ Receipt OCR Error:", err.message);
    res.status(500).json({ error: "Receipt scan failed", details: err.message });
  }
});

// --- STANDARD CRUD ROUTES ---

// GET: Fetch all transactions for a specific user
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Manual transaction entry
app.post('/api/transactions', async (req, res) => {
  try {
    const newItem = new Transaction(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Remove record
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record purged from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 FinSight Backend live on: http://localhost:${PORT}`);
});