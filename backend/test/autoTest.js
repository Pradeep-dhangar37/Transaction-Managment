// Automated API Testing Script
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let userToken = '';
let adminToken = '';
let testUserId = '';
let testTransactionId = '';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

async function test(name, fn) {
    try {
        info(`Testing: ${name}`);
        await fn();
        success(`PASSED: ${name}`);
        return true;
    } catch (err) {
        error(`FAILED: ${name}`);
        console.error(err.response?.data || err.message);
        return false;
    }
}

async function runTests() {
    log('\n🧪 Starting Automated Tests for pd@gmail.com\n', 'yellow');

    let passed = 0;
    let failed = 0;

    // Test 1: Sign Up
    if (await test('User Signup', async () => {
        const response = await axios.post(`${BASE_URL}/user/signup`, {
            username: 'pd@gmail.com',
            password: 'password123',
            firstName: 'PD',
            lastName: 'Test'
        });
        userToken = response.data.token;
        if (!userToken) throw new Error('No token received');
    })) passed++; else failed++;

    // Test 2: Sign In
    if (await test('User Signin', async () => {
        const response = await axios.post(`${BASE_URL}/user/signin`, {
            username: 'pd@gmail.com',
            password: 'password123'
        });
        userToken = response.data.token;
        if (!userToken) throw new Error('No token received');
    })) passed++; else failed++;

    // Test 3: Get Balance
    if (await test('Get Balance', async () => {
        const response = await axios.get(`${BASE_URL}/account/balance`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (typeof response.data.balance !== 'number') throw new Error('Invalid balance');
        info(`   Balance: ₹${response.data.balance}`);
    })) passed++; else failed++;

    // Test 4: Get Profile
    if (await test('Get Profile', async () => {
        const response = await axios.get(`${BASE_URL}/me/profile`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!response.data.user) throw new Error('No user data');
        info(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
    })) passed++; else failed++;

    // Test 5: Search Users
    if (await test('Search Users', async () => {
        const response = await axios.get(`${BASE_URL}/user/bulk?filter=test`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!Array.isArray(response.data.user)) throw new Error('Invalid response');
        info(`   Found ${response.data.user.length} users`);
    })) passed++; else failed++;

    // Test 6: Get Notifications
    if (await test('Get Notifications', async () => {
        const response = await axios.get(`${BASE_URL}/me/notifications`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!Array.isArray(response.data.notifications)) throw new Error('Invalid response');
        info(`   Notifications: ${response.data.notifications.length}, Unread: ${response.data.unreadCount}`);
    })) passed++; else failed++;

    // Test 7: Get Favorites
    if (await test('Get Favorites', async () => {
        const response = await axios.get(`${BASE_URL}/me/favorites`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!Array.isArray(response.data.favorites)) throw new Error('Invalid response');
        info(`   Favorites: ${response.data.favorites.length}`);
    })) passed++; else failed++;

    // Test 8: Get Transaction History
    if (await test('Get Transaction History', async () => {
        const response = await axios.get(`${BASE_URL}/account/transactions`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!Array.isArray(response.data.transactions)) throw new Error('Invalid response');
        info(`   Transactions: ${response.data.transactions.length}`);
    })) passed++; else failed++;

    // Test 9: Get Insights
    if (await test('Get AI Insights', async () => {
        const response = await axios.get(`${BASE_URL}/me/insights`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!response.data.insights) throw new Error('No insights data');
        info(`   Total Spent: ₹${response.data.insights.summary.totalSpent}`);
        info(`   Trend: ${response.data.insights.trends.trend}`);
    })) passed++; else failed++;

    // Test 10: Get Recommendations
    if (await test('Get Smart Recommendations', async () => {
        const response = await axios.get(`${BASE_URL}/me/recommendations`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!Array.isArray(response.data.recommendations)) throw new Error('Invalid response');
        info(`   Recommendations: ${response.data.recommendations.length}`);
    })) passed++; else failed++;

    // Test 11: Admin Login
    if (await test('Admin Login', async () => {
        const response = await axios.post(`${BASE_URL}/user/signin`, {
            username: 'admin@paytm.com',
            password: 'admin123'
        });
        adminToken = response.data.token;
        if (!adminToken) throw new Error('No admin token');
        if (response.data.role !== 'admin') throw new Error('Not admin role');
    })) passed++; else failed++;

    // Test 12: Admin Get All Users
    if (await test('Admin: Get All Users', async () => {
        const response = await axios.get(`${BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data.users)) throw new Error('Invalid response');
        info(`   Total Users: ${response.data.users.length}`);

        // Find test user
        const testUser = response.data.users.find(u => u.username === 'pd@gmail.com');
        if (testUser) {
            testUserId = testUser._id;
            info(`   Test User ID: ${testUserId}`);
            info(`   Test User Status: ${testUser.status || 'active'}`);
        }
    })) passed++; else failed++;

    // Test 13: Admin Get Stats
    if (await test('Admin: Get Dashboard Stats', async () => {
        const response = await axios.get(`${BASE_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.totalUsers) throw new Error('No stats data');
        info(`   Total Users: ${response.data.totalUsers}`);
        info(`   Total Transactions: ${response.data.totalTransactions}`);
        info(`   Total Volume: ₹${response.data.totalVolume}`);
    })) passed++; else failed++;

    // Test 14: Admin Get All Transactions
    if (await test('Admin: Get All Transactions', async () => {
        const response = await axios.get(`${BASE_URL}/admin/transactions`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data.transactions)) throw new Error('Invalid response');
        info(`   Total Transactions: ${response.data.transactions.length}`);
        if (response.data.transactions.length > 0) {
            testTransactionId = response.data.transactions[0]._id;
        }
    })) passed++; else failed++;

    // Test 15: Admin Get Flagged Transactions
    if (await test('Admin: Get Flagged Transactions', async () => {
        const response = await axios.get(`${BASE_URL}/admin/transactions/flagged`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data.transactions)) throw new Error('Invalid response');
        info(`   Flagged Transactions: ${response.data.transactions.length}`);
    })) passed++; else failed++;

    // Test 16: Admin Get Logs
    if (await test('Admin: Get Audit Logs', async () => {
        const response = await axios.get(`${BASE_URL}/admin/logs`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!Array.isArray(response.data.logs)) throw new Error('Invalid response');
        info(`   Audit Logs: ${response.data.logs.length}`);
    })) passed++; else failed++;

    // Test 17: Invalid Amount Transfer (should fail)
    if (await test('Fraud Detection: Invalid Amount', async () => {
        try {
            await axios.post(`${BASE_URL}/account/transfer`, {
                to: testUserId || '507f1f77bcf86cd799439011',
                amount: 0
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            throw new Error('Should have failed');
        } catch (err) {
            if (err.response?.status === 400) {
                info('   Correctly blocked invalid amount');
            } else {
                throw err;
            }
        }
    })) passed++; else failed++;

    // Test 18: Check Auth
    if (await test('Check Authentication', async () => {
        const response = await axios.get(`${BASE_URL}/user/checkAuth`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (!response.data.success) throw new Error('Auth check failed');
    })) passed++; else failed++;

    // Summary
    log('\n' + '='.repeat(50), 'yellow');
    log(`\n📊 Test Results Summary\n`, 'yellow');
    success(`Passed: ${passed}`);
    error(`Failed: ${failed}`);
    log(`Total: ${passed + failed}`, 'blue');
    log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue');
    log('\n' + '='.repeat(50) + '\n', 'yellow');

    if (failed === 0) {
        success('🎉 All tests passed! Application is working correctly.');
    } else {
        error(`⚠️  ${failed} test(s) failed. Please review the errors above.`);
    }
}

// Run tests
runTests().catch(err => {
    error('Test suite failed to run');
    console.error(err);
    process.exit(1);
});
