const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'Others 📦' // Fallback for AI-parsed data
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    // --- FINSIGHT CORE FEATURES ---
    userId: {
        type: String,
        required: true // Ensures data privacy for FinSight members
    },
    isRecurring: {
        type: Boolean,
        default: false 
    },
    recurrenceExpiry: {
        type: Date 
    },
    parentId: {
        type: String // Links recurring instances to the original generator
    }
}, { timestamps: true });

// Indexing for faster brand searches (e.g., Zomato, Amazon)
TransactionSchema.index({ description: 'text' });

module.exports = mongoose.model('Transaction', TransactionSchema);