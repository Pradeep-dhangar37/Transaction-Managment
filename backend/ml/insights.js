// Spending insights and predictions

class SpendingInsights {
    constructor() {
        this.categorizer = require('./categorization');
    }

    generateInsights(transactions, currentBalance) {
        const insights = {
            summary: this.getSummary(transactions),
            trends: this.getTrends(transactions),
            predictions: this.getPredictions(transactions),
            recommendations: [],
            alerts: []
        };

        // Generate recommendations
        insights.recommendations = this.getRecommendations(insights, currentBalance);

        // Generate alerts
        insights.alerts = this.getAlerts(insights, currentBalance);

        return insights;
    }

    getSummary(transactions) {
        const now = new Date();
        const thisMonth = transactions.filter(t => {
            const txnDate = new Date(t.createdAt);
            return txnDate.getMonth() === now.getMonth() &&
                txnDate.getFullYear() === now.getFullYear();
        });

        const sent = thisMonth.filter(t => t.type === 'sent');
        const received = thisMonth.filter(t => t.type === 'received');

        return {
            totalSpent: sent.reduce((sum, t) => sum + t.amount, 0),
            totalReceived: received.reduce((sum, t) => sum + t.amount, 0),
            transactionCount: thisMonth.length,
            avgTransactionAmount: thisMonth.length > 0
                ? thisMonth.reduce((sum, t) => sum + t.amount, 0) / thisMonth.length
                : 0,
            largestTransaction: Math.max(...thisMonth.map(t => t.amount), 0),
            mostFrequentRecipient: this.getMostFrequent(sent.map(t => t.recipientName))
        };
    }

    getTrends(transactions) {
        const last30Days = this.getLast30Days(transactions);
        const previous30Days = this.getPrevious30Days(transactions);

        const currentSpending = last30Days.reduce((sum, t) => sum + t.amount, 0);
        const previousSpending = previous30Days.reduce((sum, t) => sum + t.amount, 0);

        const change = previousSpending > 0
            ? ((currentSpending - previousSpending) / previousSpending) * 100
            : 0;

        return {
            spendingChange: change.toFixed(1),
            trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
            dailyAverage: (currentSpending / 30).toFixed(2),
            weekdayVsWeekend: this.getWeekdayWeekendSplit(last30Days)
        };
    }

    getPredictions(transactions) {
        const last30Days = this.getLast30Days(transactions);
        const dailyAvg = last30Days.reduce((sum, t) => sum + t.amount, 0) / 30;

        const daysLeftInMonth = this.getDaysLeftInMonth();
        const predictedSpending = dailyAvg * daysLeftInMonth;

        return {
            predictedMonthlySpending: (dailyAvg * 30).toFixed(2),
            predictedRemainingSpending: predictedSpending.toFixed(2),
            confidence: last30Days.length >= 10 ? 'high' : 'low'
        };
    }

    getRecommendations(insights, currentBalance) {
        const recommendations = [];

        // High spending alert
        if (insights.trends.spendingChange > 20) {
            recommendations.push({
                type: 'warning',
                title: 'Spending Increased',
                message: `Your spending is up ${insights.trends.spendingChange}% compared to last month`,
                action: 'Review your expenses'
            });
        }

        // Low balance warning
        const predictedSpending = parseFloat(insights.predictions.predictedRemainingSpending);
        if (currentBalance < predictedSpending) {
            recommendations.push({
                type: 'alert',
                title: 'Low Balance Warning',
                message: `Your balance may not cover predicted spending of ₹${predictedSpending.toFixed(2)}`,
                action: 'Add funds or reduce spending'
            });
        }

        // Savings opportunity
        if (insights.trends.trend === 'decreasing') {
            recommendations.push({
                type: 'success',
                title: 'Great Job!',
                message: `You're spending ${Math.abs(insights.trends.spendingChange)}% less than last month`,
                action: 'Keep up the good work'
            });
        }

        // Large transaction pattern
        if (insights.summary.largestTransaction > insights.summary.avgTransactionAmount * 5) {
            recommendations.push({
                type: 'info',
                title: 'Large Transaction Detected',
                message: `Your largest transaction (₹${insights.summary.largestTransaction}) is much higher than average`,
                action: 'Review if this was expected'
            });
        }

        return recommendations;
    }

    getAlerts(insights, currentBalance) {
        const alerts = [];

        // Critical low balance
        if (currentBalance < 1000) {
            alerts.push({
                severity: 'high',
                message: 'Critical: Balance below ₹1000',
                action: 'Add funds immediately'
            });
        }

        // Unusual spending
        if (insights.trends.spendingChange > 50) {
            alerts.push({
                severity: 'medium',
                message: 'Unusual spending pattern detected',
                action: 'Review recent transactions'
            });
        }

        return alerts;
    }

    // Helper methods
    getLast30Days(transactions) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactions.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
    }

    getPrevious30Days(transactions) {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactions.filter(t => {
            const date = new Date(t.createdAt);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        });
    }

    getDaysLeftInMonth() {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lastDay.getDate() - now.getDate();
    }

    getWeekdayWeekendSplit(transactions) {
        let weekday = 0, weekend = 0;
        transactions.forEach(t => {
            const day = new Date(t.createdAt).getDay();
            if (day === 0 || day === 6) {
                weekend += t.amount;
            } else {
                weekday += t.amount;
            }
        });
        return { weekday, weekend };
    }

    getMostFrequent(arr) {
        if (arr.length === 0) return null;
        const frequency = {};
        arr.forEach(item => {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        return Object.keys(frequency).reduce((a, b) =>
            frequency[a] > frequency[b] ? a : b
        );
    }
}

module.exports = new SpendingInsights();
