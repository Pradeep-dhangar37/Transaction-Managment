// Simple rule-based fraud detection system
// This can be replaced with actual ML model later

class FraudDetector {
    constructor() {
        this.rules = {
            maxAmountNewUser: 5000,
            maxTransactionsPerHour: 5,
            maxTransactionsPerDay: 20,
            unusualAmountMultiplier: 3,
            rapidTransactionMinutes: 5
        };
    }

    async detectFraud(transaction, userHistory) {
        const risks = [];
        let riskScore = 0;

        // Rule 1: New user with large transaction
        if (userHistory.accountAge < 7 && transaction.amount > this.rules.maxAmountNewUser) {
            risks.push("New user attempting large transaction");
            riskScore += 30;
        }

        // Rule 2: Too many transactions in short time
        const recentTransactions = userHistory.transactionsLastHour || 0;
        if (recentTransactions >= this.rules.maxTransactionsPerHour) {
            risks.push(`${recentTransactions} transactions in last hour`);
            riskScore += 25;
        }

        // Rule 3: Unusual amount compared to user's average
        if (userHistory.avgTransactionAmount > 0) {
            const ratio = transaction.amount / userHistory.avgTransactionAmount;
            if (ratio > this.rules.unusualAmountMultiplier) {
                risks.push(`Amount ${ratio.toFixed(1)}x higher than usual`);
                riskScore += 20;
            }
        }

        // Rule 4: Rapid successive transactions
        if (userHistory.lastTransactionMinutes < this.rules.rapidTransactionMinutes) {
            risks.push("Rapid successive transactions");
            riskScore += 15;
        }

        // Rule 5: Round numbers (often fraud)
        if (transaction.amount % 1000 === 0 && transaction.amount >= 5000) {
            risks.push("Suspicious round amount");
            riskScore += 10;
        }

        // Rule 6: Sending to new recipient with large amount
        if (!userHistory.hasTransactedWith && transaction.amount > 2000) {
            risks.push("First transaction to recipient with large amount");
            riskScore += 15;
        }

        // Rule 7: Daily limit exceeded
        const dailyTransactions = userHistory.transactionsToday || 0;
        if (dailyTransactions >= this.rules.maxTransactionsPerDay) {
            risks.push("Daily transaction limit exceeded");
            riskScore += 35;
        }

        return {
            isFraud: riskScore >= 50,
            riskScore: Math.min(riskScore, 100),
            confidence: this.calculateConfidence(riskScore),
            risks: risks,
            recommendation: this.getRecommendation(riskScore)
        };
    }

    calculateConfidence(riskScore) {
        if (riskScore >= 70) return "high";
        if (riskScore >= 40) return "medium";
        return "low";
    }

    getRecommendation(riskScore) {
        if (riskScore >= 70) return "block";
        if (riskScore >= 50) return "review";
        if (riskScore >= 30) return "monitor";
        return "allow";
    }
}

module.exports = new FraudDetector();
