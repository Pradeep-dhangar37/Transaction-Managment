// Simple keyword-based transaction categorization
// Can be replaced with ML model later

class TransactionCategorizer {
    constructor() {
        this.categories = {
            'Food & Dining': ['food', 'restaurant', 'cafe', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'uber eats'],
            'Shopping': ['shop', 'store', 'mall', 'amazon', 'flipkart', 'myntra', 'clothing', 'shoes', 'electronics'],
            'Bills & Utilities': ['bill', 'electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'recharge', 'utility'],
            'Transportation': ['uber', 'ola', 'taxi', 'cab', 'fuel', 'petrol', 'diesel', 'parking', 'toll', 'metro'],
            'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'prime', 'hotstar', 'game', 'concert', 'ticket'],
            'Healthcare': ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'clinic', 'health', 'dental'],
            'Education': ['school', 'college', 'university', 'course', 'tuition', 'book', 'education', 'training'],
            'Rent': ['rent', 'lease', 'housing', 'apartment', 'flat'],
            'Groceries': ['grocery', 'supermarket', 'vegetables', 'fruits', 'bigbasket', 'grofers', 'market'],
            'Personal Care': ['salon', 'spa', 'gym', 'fitness', 'beauty', 'haircut', 'massage'],
            'Travel': ['hotel', 'flight', 'train', 'bus', 'booking', 'makemytrip', 'goibibo', 'airbnb', 'travel'],
            'Insurance': ['insurance', 'policy', 'premium', 'lic'],
            'Investment': ['mutual fund', 'stock', 'sip', 'investment', 'trading', 'zerodha'],
            'Gifts & Donations': ['gift', 'donation', 'charity', 'birthday', 'anniversary'],
            'Other': []
        };
    }

    categorize(description, amount, recipientName) {
        const text = `${description} ${recipientName}`.toLowerCase();

        // Check each category
        for (const [category, keywords] of Object.entries(this.categories)) {
            if (category === 'Other') continue;

            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    return {
                        category: category,
                        confidence: this.calculateConfidence(text, keywords),
                        method: 'keyword_matching'
                    };
                }
            }
        }

        // Amount-based heuristics
        if (amount >= 10000 && amount <= 50000) {
            return {
                category: 'Rent',
                confidence: 'low',
                method: 'amount_heuristic'
            };
        }

        return {
            category: 'Other',
            confidence: 'low',
            method: 'default'
        };
    }

    calculateConfidence(text, keywords) {
        const matchCount = keywords.filter(k => text.includes(k)).length;
        if (matchCount >= 2) return 'high';
        if (matchCount === 1) return 'medium';
        return 'low';
    }

    getSpendingByCategory(transactions) {
        const spending = {};

        transactions.forEach(txn => {
            const result = this.categorize(
                txn.description || '',
                txn.amount,
                txn.recipientName || ''
            );

            if (!spending[result.category]) {
                spending[result.category] = {
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }

            spending[result.category].total += txn.amount;
            spending[result.category].count += 1;
            spending[result.category].transactions.push(txn._id);
        });

        return spending;
    }
}

module.exports = new TransactionCategorizer();
