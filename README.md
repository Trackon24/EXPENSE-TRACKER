# 💸 FinSight – AI Powered Expense Tracker

**FinSight** is a modern AI-powered expense management web application that helps users track income, monitor expenses, visualize financial patterns, parse UPI transaction messages, and scan receipts automatically.

Built with a sleek dark premium UI, cloud database integration, OCR-powered receipt scanning, and smart transaction parsing, FinSight makes personal finance tracking fast, visual, and intelligent.

---

## 🚀 Live Experience

FinSight offers a polished multi-page dashboard experience with:

- 🔐 Secure Login / Register interface
- 📊 Interactive financial charts
- 🤖 AI-powered UPI SMS parsing
- 🧾 OCR-based receipt scanner
- 📁 Searchable transaction history
- 📈 Expense summary analytics
- ☁️ Cloud sync with MongoDB Atlas

---

## ✨ Features

### 🔐 Authentication System
- Clean **Login / Register UI**
- Personalized expense tracking per user
- Secure account access flow

### 📊 Smart Dashboard
- View your income and expenses
- Elegant real-time financial snapshot cards

### 🤖 UPI SMS Parser
- Paste UPI / bank SMS messages
- Saves directly into transaction ledger

### 🧾 Receipt Scanner
- Upload receipt images
- Converts receipts into expense entries instantly

### 📈 Charts & Visual Analytics
- **Expense Proportions**
- **Cash Flow / Trend Visualiser**

### 📄 Expense Summariser
- Summarises expense to a downloadable csv file

### 🔍 Neural Search
- Search and filter transactions

### 🧾 Real-Time Ledger
- Scrollable live transaction feed

### ☁️ Cloud Sync
- All records are stored in **MongoDB Atlas**
- Data persists even after refresh or relogin

### 🎨 Premium UI / UX
- Dark futuristic theme
- Neon accent design
- Smooth hover states and transitions
- Glassmorphism-inspired layout

---

## 🛠️ Tech Stack

### 🎨 Frontend
- **React + Vite**
- **Tailwind CSS**
- **Recharts**
- **Lucide React**

### 🔌 Backend
- **Node.js**
- **Express.js**
- **MongoDB Atlas**
- **Mongoose**
- **Dotenv**

### 🧠 Smart Features
- **Groq API** → AI-powered UPI parsing
- **Tesseract.js OCR** → Receipt image scanning

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Trackon24/EXPENSE-TRACKER.git
cd EXPENSE-TRACKER
```

---

## 🔌 Backend Setup

### Go to backend folder

```bash
cd backend
```

### Install dependencies

```bash
npm install
```

### Create `.env` file inside backend folder

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

### Start backend server

```bash
node server.js
```

Backend runs on:

```bash
http://localhost:5000
```

---

## 🎨 Frontend Setup

### Open a new terminal and go to frontend folder

```bash
cd ..
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```
---

## 📂 Project Structure

```bash
EXPENSE-TRACKER/
│
├── backend/
│   ├── models/
│   │   └── Transaction.js
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── eng.traineddata
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── App.css
│   ├── App.jsx
│   ├── constants.js
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
└── vite.config.js
```

---

## 🌟 FinSight
### **Track smarter. Spend wiser. Save better.**
