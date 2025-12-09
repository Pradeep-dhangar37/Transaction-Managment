// backend/routes/userFeatures.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { User, PaymentRequest, Favorite, Notification, Transaction, Account } = require('../db');
const mongoose = require('mongoose');

const router = express.Router();

// ============ PROFILE MANAGEMENT ============

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        const account = await Account.findOne({ userId: req.userId });

        res.json({
            user,
            balance: account?.balance || 0,
            dailyLimit: user.dailyLimit,
            dailySpent: user.dailySpent
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile" });
    }
});

// Update profile
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        await User.findByIdAndUpdate(req.userId, {
            firstName,
            lastName
        });

        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile" });
    }
});

// Change password
router.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(req.userId);

        if (user.password !== oldPassword) {
            return res.status(400).json({ message: "Incorrect old password" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error changing password" });
    }
});

// ============ PAYMENT REQUESTS ============

// Create payment request
router.post("/request-money", authMiddleware, async (req, res) => {
    try {
        const { toUserId, amount, message } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const request = await PaymentRequest.create({
            fromUserId: req.userId,
            toUserId,
            amount,
            message,
            expiresAt
        });

        // Create notification for recipient
        await Notification.create({
            userId: toUserId,
            title: "Payment Request",
            message: `You have a payment request of ₹${amount}`,
            type: 'request',
            relatedId: request._id
        });

        res.json({ message: "Payment request sent successfully", request });
    } catch (error) {
        res.status(500).json({ message: "Error creating payment request" });
    }
});

// Get payment requests (received)
router.get("/requests/received", authMiddleware, async (req, res) => {
    try {
        const requests = await PaymentRequest.find({
            toUserId: req.userId,
            status: 'pending'
        })
            .populate('fromUserId', 'firstName lastName username')
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests" });
    }
});

// Get payment requests (sent)
router.get("/requests/sent", authMiddleware, async (req, res) => {
    try {
        const requests = await PaymentRequest.find({
            fromUserId: req.userId
        })
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Error fetching requests" });
    }
});

// Accept payment request
router.post("/requests/accept", authMiddleware, async (req, res) => {
    const session = await mongoose.connection.startSession();
    session.startTransaction();

    try {
        const { requestId } = req.body;

        const request = await PaymentRequest.findById(requestId).session(session);

        if (!request || request.toUserId.toString() !== req.userId) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'pending') {
            await session.abortTransaction();
            return res.status(400).json({ message: "Request already processed" });
        }

        // Check balance
        const account = await Account.findOne({ userId: req.userId }).session(session);
        if (!account || account.balance < request.amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Perform transfer
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -request.amount } }
        ).session(session);

        await Account.updateOne(
            { userId: request.fromUserId },
            { $inc: { balance: request.amount } }
        ).session(session);

        // Create transaction
        await Transaction.create([{
            fromUserId: req.userId,
            toUserId: request.fromUserId,
            amount: request.amount,
            status: 'completed',
            type: 'transfer',
            description: `Payment for request: ${request.message}`
        }], { session });

        // Update request status
        request.status = 'accepted';
        await request.save({ session });

        // Create notification
        await Notification.create([{
            userId: request.fromUserId,
            title: "Payment Received",
            message: `Your payment request of ₹${request.amount} was accepted`,
            type: 'transaction'
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Payment request accepted" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Error accepting request" });
    } finally {
        session.endSession();
    }
});

// Reject payment request
router.post("/requests/reject", authMiddleware, async (req, res) => {
    try {
        const { requestId } = req.body;

        const request = await PaymentRequest.findById(requestId);

        if (!request || request.toUserId.toString() !== req.userId) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = 'rejected';
        await request.save();

        // Create notification
        await Notification.create({
            userId: request.fromUserId,
            title: "Payment Request Rejected",
            message: `Your payment request of ₹${request.amount} was rejected`,
            type: 'request'
        });

        res.json({ message: "Payment request rejected" });
    } catch (error) {
        res.status(500).json({ message: "Error rejecting request" });
    }
});

// ============ FAVORITES ============

// Add favorite
router.post("/favorites", authMiddleware, async (req, res) => {
    try {
        const { favoriteUserId, nickname } = req.body;

        const existing = await Favorite.findOne({
            userId: req.userId,
            favoriteUserId
        });

        if (existing) {
            return res.status(400).json({ message: "Already in favorites" });
        }

        await Favorite.create({
            userId: req.userId,
            favoriteUserId,
            nickname
        });

        res.json({ message: "Added to favorites" });
    } catch (error) {
        res.status(500).json({ message: "Error adding favorite" });
    }
});

// Get favorites
router.get("/favorites", authMiddleware, async (req, res) => {
    try {
        const favorites = await Favorite.find({ userId: req.userId })
            .populate('favoriteUserId', 'firstName lastName username')
            .sort({ createdAt: -1 });

        res.json({ favorites });
    } catch (error) {
        res.status(500).json({ message: "Error fetching favorites" });
    }
});

// Remove favorite
router.delete("/favorites/:id", authMiddleware, async (req, res) => {
    try {
        await Favorite.findOneAndDelete({
            userId: req.userId,
            favoriteUserId: req.params.id
        });

        res.json({ message: "Removed from favorites" });
    } catch (error) {
        res.status(500).json({ message: "Error removing favorite" });
    }
});

// ============ NOTIFICATIONS ============

// Get notifications
router.get("/notifications", authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            userId: req.userId,
            read: false
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications" });
    }
});

// Mark notification as read
router.put("/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating notification" });
    }
});

// Mark all as read
router.put("/notifications/read-all", authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.userId, read: false },
            { read: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating notifications" });
    }
});

// ============ TRANSACTION FILTERS ============

// Get filtered transactions
router.get("/transactions/filter", authMiddleware, async (req, res) => {
    try {
        const { type, startDate, endDate, minAmount, maxAmount, search } = req.query;

        let filter = {
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
        }

        let transactions = await Transaction.find(filter)
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(100);

        // Filter by type (sent/received)
        if (type === 'sent') {
            transactions = transactions.filter(t => t.fromUserId._id.toString() === req.userId);
        } else if (type === 'received') {
            transactions = transactions.filter(t => t.toUserId._id.toString() === req.userId);
        }

        // Search by name
        if (search) {
            transactions = transactions.filter(t => {
                const fromName = `${t.fromUserId.firstName} ${t.fromUserId.lastName}`.toLowerCase();
                const toName = `${t.toUserId.firstName} ${t.toUserId.lastName}`.toLowerCase();
                return fromName.includes(search.toLowerCase()) || toName.includes(search.toLowerCase());
            });
        }

        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
});

// ============ TRANSACTION RECEIPT ============

// Get transaction receipt
router.get("/receipt/:transactionId", authMiddleware, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId)
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username');

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Verify user is part of transaction
        if (transaction.fromUserId._id.toString() !== req.userId &&
            transaction.toUserId._id.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({
            receiptId: transaction._id,
            date: transaction.createdAt,
            from: {
                name: `${transaction.fromUserId.firstName} ${transaction.fromUserId.lastName}`,
                email: transaction.fromUserId.username
            },
            to: {
                name: `${transaction.toUserId.firstName} ${transaction.toUserId.lastName}`,
                email: transaction.toUserId.username
            },
            amount: transaction.amount,
            status: transaction.status,
            type: transaction.type,
            description: transaction.description
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching receipt" });
    }
});

module.exports = router;


// ============ AI/ML FEATURES ============

// Get spending insights
router.get("/insights", authMiddleware, async (req, res) => {
    try {
        const insightsEngine = require('../ml/insights');
        const categorizer = require('../ml/categorization');

        // Get user transactions
        const transactions = await Transaction.find({
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        })
            .populate('fromUserId', 'firstName lastName')
            .populate('toUserId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(100);

        // Prepare data
        const processedTransactions = transactions.map(t => ({
            _id: t._id,
            amount: t.amount,
            type: t.fromUserId._id.toString() === req.userId ? 'sent' : 'received',
            createdAt: t.createdAt,
            recipientName: t.toUserId ? `${t.toUserId.firstName} ${t.toUserId.lastName}` : '',
            description: t.description || ''
        }));

        // Get current balance
        const account = await Account.findOne({ userId: req.userId });

        // Generate insights
        const insights = insightsEngine.generateInsights(
            processedTransactions,
            account?.balance || 0
        );

        // Get spending by category
        const categorySpending = categorizer.getSpendingByCategory(
            processedTransactions.filter(t => t.type === 'sent')
        );

        res.json({
            insights,
            categorySpending,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error("Error generating insights:", error);
        res.status(500).json({ message: "Error generating insights" });
    }
});

// Categorize transaction
router.post("/categorize-transaction", authMiddleware, async (req, res) => {
    try {
        const { transactionId } = req.body;
        const categorizer = require('../ml/categorization');

        const transaction = await Transaction.findById(transactionId)
            .populate('toUserId', 'firstName lastName');

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const result = categorizer.categorize(
            transaction.description || '',
            transaction.amount,
            transaction.toUserId ? `${transaction.toUserId.firstName} ${transaction.toUserId.lastName}` : ''
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Error categorizing transaction" });
    }
});

// Get smart recommendations
router.get("/recommendations", authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ fromUserId: req.userId })
            .populate('toUserId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(50);

        // Find frequent recipients
        const recipientFrequency = {};
        transactions.forEach(t => {
            const recipientId = t.toUserId._id.toString();
            if (!recipientFrequency[recipientId]) {
                recipientFrequency[recipientId] = {
                    user: t.toUserId,
                    count: 0,
                    totalAmount: 0,
                    avgAmount: 0,
                    lastTransaction: t.createdAt
                };
            }
            recipientFrequency[recipientId].count++;
            recipientFrequency[recipientId].totalAmount += t.amount;
        });

        // Calculate averages and sort
        const recommendations = Object.values(recipientFrequency)
            .map(r => ({
                ...r,
                avgAmount: r.totalAmount / r.count,
                daysSinceLastTransaction: Math.floor(
                    (Date.now() - new Date(r.lastTransaction)) / (1000 * 60 * 60 * 24)
                )
            }))
            .filter(r => r.count >= 2) // At least 2 transactions
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ message: "Error generating recommendations" });
    }
});
