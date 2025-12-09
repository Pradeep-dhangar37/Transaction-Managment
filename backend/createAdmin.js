// Script to create an admin user
const mongoose = require('mongoose');
const { User, Account } = require('./db');

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin@paytm.com' });

        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email: admin@paytm.com');
            console.log('Password: admin123');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            username: 'admin@paytm.com',
            password: 'admin123',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
        });

        // Create admin account
        await Account.create({
            userId: admin._id,
            balance: 100000
        });

        console.log('Admin user created successfully!');
        console.log('Email: admin@paytm.com');
        console.log('Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

// Wait for DB connection
setTimeout(() => {
    createAdmin();
}, 2000);
