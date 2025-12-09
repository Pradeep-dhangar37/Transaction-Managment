// backend/routes/admin.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { User, Account, Transaction, AdminLog } = require('../db');
const mongoose = require('mongoose');

const router = express.Router();

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                message: "Access denied. Admin only."
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            message: "Error verifying admin status"
        });
    }
};

// Get all users
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const usersWithBalance = await Promise.all(
            users.map(async (user) => {
                const account = await Account.findOne({ userId: user._id });
                return {
                    ...user.toObject(),
                    balance: account ? account.balance : 0
                };
            })
        );
        res.json({ users: usersWithBalance });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// Get all transactions
router.get("/transactions", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, userId } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (userId) {
            filter.$or = [
                { fromUserId: userId },
                { toUserId: userId }
            ];
        }

        const transactions = await Transaction.find(filter)
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Transaction.countDocuments(filter);

        res.json({
            transactions,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions" });
    }
});

// Get dashboard stats
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const totalTransactions = await Transaction.countDocuments({});

        const totalVolumeResult = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalVolume = totalVolumeResult.length > 0 ? totalVolumeResult[0].total : 0;

        const recentTransactions = await Transaction.find({})
            .populate('fromUserId', 'firstName lastName')
            .populate('toUserId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            totalUsers,
            totalTransactions,
            totalVolume,
            recentTransactions
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching stats" });
    }
});

// Update user balance (admin only)
router.post("/update-balance", authMiddleware, adminMiddleware, async (req, res) => {
    const session = await mongoose.connection.startSession();
    session.startTransaction();

    try {
        const { userId, amount, action } = req.body; // action: 'add' or 'deduct'

        if (!userId || !amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid input" });
        }

        const account = await Account.findOne({ userId }).session(session);
        if (!account) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Account not found" });
        }

        const updateAmount = action === 'add' ? amount : -amount;

        if (action === 'deduct' && account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }

        await Account.updateOne(
            { userId },
            { $inc: { balance: updateAmount } }
        ).session(session);

        // Record transaction
        await Transaction.create([{
            fromUserId: action === 'add' ? req.userId : userId,
            toUserId: action === 'add' ? userId : req.userId,
            amount: amount,
            status: 'completed',
            type: action === 'add' ? 'deposit' : 'withdrawal',
            description: `Admin ${action === 'add' ? 'credit' : 'debit'}`
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Balance updated successfully" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Error updating balance" });
    } finally {
        session.endSession();
    }
});

// Reverse transaction
router.post("/reverse-transaction", authMiddleware, adminMiddleware, async (req, res) => {
    const session = await mongoose.connection.startSession();
    session.startTransaction();

    try {
        const { transactionId } = req.body;

        const transaction = await Transaction.findById(transactionId).session(session);
        if (!transaction) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.status === 'reversed') {
            await session.abortTransaction();
            return res.status(400).json({ message: "Transaction already reversed" });
        }

        // Reverse the amounts
        await Account.updateOne(
            { userId: transaction.fromUserId },
            { $inc: { balance: transaction.amount } }
        ).session(session);

        await Account.updateOne(
            { userId: transaction.toUserId },
            { $inc: { balance: -transaction.amount } }
        ).session(session);

        // Update transaction status
        transaction.status = 'reversed';
        await transaction.save({ session });

        await session.commitTransaction();
        res.json({ message: "Transaction reversed successfully" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Error reversing transaction" });
    } finally {
        session.endSession();
    }
});

// Delete user
router.delete("/user/:userId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        await Account.deleteOne({ userId });
        await User.findByIdAndDelete(userId);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
});

module.exports = router;


// Suspend/Unsuspend user
router.post("/user/suspend", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId, suspend } = req.body;

        await User.findByIdAndUpdate(userId, {
            status: suspend ? 'suspended' : 'active'
        });

        await AdminLog.create({
            adminId: req.userId,
            action: suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
            targetUserId: userId,
            details: `User ${suspend ? 'suspended' : 'unsuspended'}`
        });

        res.json({ message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully` });
    } catch (error) {
        res.status(500).json({ message: "Error updating user status" });
    }
});

// Set user transaction limit
router.post("/user/set-limit", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId, dailyLimit } = req.body;

        await User.findByIdAndUpdate(userId, { dailyLimit });

        await AdminLog.create({
            adminId: req.userId,
            action: 'SET_TRANSACTION_LIMIT',
            targetUserId: userId,
            details: `Daily limit set to ${dailyLimit}`
        });

        res.json({ message: "Transaction limit updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error setting limit" });
    }
});

// Flag/Unflag transaction
router.post("/transaction/flag", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { transactionId, flag, reason } = req.body;

        await Transaction.findByIdAndUpdate(transactionId, {
            flagged: flag,
            flagReason: reason || '',
            status: flag ? 'flagged' : 'completed'
        });

        await AdminLog.create({
            adminId: req.userId,
            action: flag ? 'FLAG_TRANSACTION' : 'UNFLAG_TRANSACTION',
            details: `Transaction ${transactionId} ${flag ? 'flagged' : 'unflagged'}: ${reason || ''}`
        });

        res.json({ message: `Transaction ${flag ? 'flagged' : 'unflagged'} successfully` });
    } catch (error) {
        res.status(500).json({ message: "Error flagging transaction" });
    }
});

// Get flagged transactions
router.get("/transactions/flagged", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const flaggedTransactions = await Transaction.find({ flagged: true })
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 });

        res.json({ transactions: flaggedTransactions });
    } catch (error) {
        res.status(500).json({ message: "Error fetching flagged transactions" });
    }
});

// Get admin logs
router.get("/logs", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const logs = await AdminLog.find({})
            .populate('adminId', 'firstName lastName username')
            .populate('targetUserId', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ logs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs" });
    }
});

// Export transactions as CSV
router.get("/export/transactions", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({})
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 });

        // Create CSV
        let csv = 'Date,From,To,Amount,Status,Type\n';
        transactions.forEach(txn => {
            csv += `${txn.createdAt},${txn.fromUserId?.firstName} ${txn.fromUserId?.lastName},${txn.toUserId?.firstName} ${txn.toUserId?.lastName},${txn.amount},${txn.status},${txn.type}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: "Error exporting transactions" });
    }
});

// Get analytics data
router.get("/analytics", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Daily transactions for last 7 days
        const dailyTransactions = await Transaction.aggregate([
            { $match: { createdAt: { $gte: last7Days }, status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    volume: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // User growth
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: last30Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top users by transaction volume
        const topUsers = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: "$fromUserId",
                    totalSent: { $sum: "$amount" },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { totalSent: -1 } },
            { $limit: 10 }
        ]);

        const populatedTopUsers = await User.populate(topUsers, {
            path: '_id',
            select: 'firstName lastName username'
        });

        res.json({
            dailyTransactions,
            userGrowth,
            topUsers: populatedTopUsers
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching analytics" });
    }
});
