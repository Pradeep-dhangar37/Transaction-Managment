// backend/routes/account.js
const express = require('express');
const mongoose = require("mongoose");
const { authMiddleware } = require('../middleware');
const { Account, Transaction } = require('../db');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.connection.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    // Validate amount
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: "Invalid amount"
        });
    }

    // Check user status and limits
    const { User } = require('../db');
    const user = await User.findById(req.userId);

    // AI/ML: Fraud Detection
    try {
        const fraudDetector = require('../ml/fraudDetection');
        const userTransactions = await Transaction.find({ fromUserId: req.userId });

        const userHistory = {
            accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
            transactionsLastHour: userTransactions.filter(t =>
                Date.now() - new Date(t.createdAt) < 3600000
            ).length,
            transactionsToday: userTransactions.filter(t => {
                const today = new Date().toDateString();
                return new Date(t.createdAt).toDateString() === today;
            }).length,
            avgTransactionAmount: userTransactions.length > 0
                ? userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length
                : 0,
            lastTransactionMinutes: userTransactions.length > 0
                ? (Date.now() - new Date(userTransactions[userTransactions.length - 1].createdAt)) / 60000
                : 999,
            hasTransactedWith: userTransactions.some(t => t.toUserId.toString() === to)
        };

        const fraudCheck = await fraudDetector.detectFraud(
            { amount: numAmount, toUserId: to },
            userHistory
        );

        // If high risk, flag and notify admin
        if (fraudCheck.isFraud && fraudCheck.riskScore >= 70) {
            await session.abortTransaction();
            session.endSession();

            // AUTO-SUSPEND account if risk is very high
            if (fraudCheck.riskScore >= 80) {
                await User.findByIdAndUpdate(req.userId, {
                    status: 'suspended'
                });

                // Log the auto-suspension
                const { AdminLog } = require('../db');
                await AdminLog.create({
                    adminId: req.userId,
                    action: 'AUTO_SUSPEND_USER',
                    targetUserId: req.userId,
                    details: `Auto-suspended due to high fraud risk (${fraudCheck.riskScore}%). Reasons: ${fraudCheck.risks.join(', ')}`
                });
            }

            // Create notification for admin
            const { Notification } = require('../db');
            const adminUser = await User.findOne({ role: 'admin' });
            if (adminUser) {
                await Notification.create({
                    userId: adminUser._id,
                    title: fraudCheck.riskScore >= 80 ? "Account Auto-Suspended" : "High-Risk Transaction Blocked",
                    message: `User ${user.firstName} ${user.lastName}: Transaction of ₹${numAmount} blocked. Risk: ${fraudCheck.riskScore}%. ${fraudCheck.riskScore >= 80 ? 'Account SUSPENDED.' : ''} Reasons: ${fraudCheck.risks.join(', ')}`,
                    type: 'alert'
                });
            }

            // Notify user
            await Notification.create({
                userId: req.userId,
                title: "Transaction Blocked",
                message: fraudCheck.riskScore >= 80
                    ? "Your account has been suspended due to suspicious activity. Please contact support."
                    : "This transaction was blocked for security reasons. Please contact support if this was a legitimate transaction.",
                type: 'alert'
            });

            return res.status(403).json({
                message: fraudCheck.riskScore >= 80
                    ? "Account suspended due to suspicious activity. Please contact support."
                    : "Transaction blocked for security reasons. Please contact support.",
                riskScore: fraudCheck.riskScore,
                suspended: fraudCheck.riskScore >= 80
            });
        }
    } catch (mlError) {
        console.error("ML Error:", mlError);
        // Continue with transaction if ML fails
    }

    if (user.status === 'suspended') {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
            message: "Account suspended. Contact admin."
        });
    }

    if (user.status === 'blocked') {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
            message: "Account blocked. Contact admin."
        });
    }

    // Check daily limit
    const today = new Date().toDateString();
    const lastReset = new Date(user.lastResetDate).toDateString();

    if (today !== lastReset) {
        // Reset daily spent
        await User.findByIdAndUpdate(req.userId, {
            dailySpent: 0,
            lastResetDate: new Date()
        });
        user.dailySpent = 0;
    }

    if (user.dailySpent + numAmount > user.dailyLimit) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: `Daily limit exceeded. Limit: ₹${user.dailyLimit}, Spent: ₹${user.dailySpent}`
        });
    }

    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < numAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    try {
        // Perform the transfer
        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -numAmount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: numAmount } }).session(session);

        // Record transaction
        await Transaction.create([{
            fromUserId: req.userId,
            toUserId: to,
            amount: numAmount,
            status: 'completed',
            type: 'transfer'
        }], { session });

        // Update daily spent
        await User.findByIdAndUpdate(req.userId, {
            $inc: { dailySpent: numAmount }
        });

        // Commit the transaction
        await session.commitTransaction();

        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Transfer failed"
        });
    } finally {
        session.endSession();
    }
});

router.get("/transactions", authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        })
            .populate('fromUserId', 'firstName lastName username')
            .populate('toUserId', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            transactions: transactions
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching transactions"
        });
    }
});

module.exports = router;
