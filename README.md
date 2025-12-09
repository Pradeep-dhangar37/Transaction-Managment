# 💰 SmartTransact - Intelligent Transaction Management Platform

> A full-stack payment and transaction management system with AI-powered fraud detection, real-time insights, and comprehensive admin controls.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://www.mongodb.com/)

## 🚀 Features

### 👤 User Features
- **Secure Authentication** - JWT-based authentication with role-based access control
- **Money Transfers** - Send and receive money with real-time balance updates
- **Payment Requests** - Request money from other users with 7-day expiry
- **Transaction History** - Complete history with advanced filters (date, amount, type, search)
- **Favorites** - Save frequently used contacts for quick access
- **AI-Powered Insights** - Smart spending analysis, predictions, and recommendations
- **Transaction Categorization** - Automatic categorization (Food, Shopping, Bills, etc.)
- **Notifications** - Real-time alerts for all activities
- **Receipt Download** - Download detailed receipts for any transaction
- **Profile Management** - Update profile, change password, view limits

### 🛡️ Security & Fraud Detection
- **AI Fraud Detection** - Rule-based intelligent fraud detection system
- **Auto-Suspension** - Automatic account suspension for high-risk activities
- **Risk Scoring** - Real-time risk assessment (0-100 scale)
- **Transaction Limits** - Daily transaction limits with automatic reset
- **Status Monitoring** - Active/Suspended/Blocked account status
- **Suspicious Activity Alerts** - Instant notifications for unusual patterns

### 👨‍💼 Admin Features
- **Comprehensive Dashboard** - Real-time stats (users, transactions, volume)
- **User Management** - View, suspend, unsuspend, delete users
- **Balance Control** - Add or deduct money from any account
- **Transaction Monitoring** - View all platform transactions
- **Transaction Reversal** - Reverse completed transactions
- **Flag Management** - Flag/unflag suspicious transactions
- **Transaction Limits** - Set custom daily limits per user
- **Audit Logs** - Complete log of all admin actions
- **Export Reports** - Download transactions as CSV
- **Analytics** - Platform-wide analytics and insights

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication
- **Zod** - Input validation
- **AI/ML** - Custom fraud detection algorithms

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Clone Repository
```bash
git clone https://github.com/yourusername/smarttransact.git
cd smarttransact
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
node index.js
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Create Admin Account
```bash
cd backend
node createAdmin.js
```

## 🚀 Quick Start

1. **Start Backend** (Port 3000)
```bash
cd backend
node index.js
```

2. **Start Frontend** (Port 5173)
```bash
cd frontend
npm run dev
```

3. **Access Application**
- User Portal: http://localhost:5173/signin
- Admin Portal: http://localhost:5173/admin-signin
- Admin Credentials: admin@paytm.com / admin123

## � Documetntation

- [Complete Features List](./COMPLETE_FEATURES_LIST.md)
- [Testing Guide](./TEST_ALL_FEATURES.md)
- [How to Use](./HOW_TO_USE.md)
- [AI/ML Features](./AI_ML_FEATURES_SUGGESTIONS.md)
- [API Documentation](./TESTING_GUIDE.md)

## 🎯 Key Highlights

### Fraud Detection System
- **Risk Scoring**: 0-100 scale based on multiple factors
- **Auto-Actions**: 
  - Score 70-79: Block transaction
  - Score 80-100: Block + Auto-suspend account
- **Detection Factors**:
  - New user with large amounts
  - Rapid successive transactions
  - Unusual amounts (3x+ average)
  - Too many daily transactions
  - Round large amounts

### AI-Powered Insights
- **Spending Analysis**: Monthly trends and patterns
- **Predictions**: Future spending forecasts
- **Categorization**: Automatic transaction categorization
- **Recommendations**: Smart payment suggestions
- **Alerts**: Proactive spending alerts

### Admin Control Panel
- **5 Tabs**: Overview, Users, Transactions, Flagged, Logs
- **Real-time Stats**: Live platform metrics
- **User Actions**: Suspend, unsuspend, set limits, manage balances
- **Transaction Actions**: Reverse, flag, unflag
- **Audit Trail**: Complete action history

## 📊 Statistics

- **23 Major Features** implemented
- **40+ API Endpoints**
- **10 Frontend Pages**
- **7 Database Schemas**
- **5500+ Lines of Code**
- **100% Feature Complete**

## 🔒 Security Features

- JWT token authentication
- Role-based access control (User/Admin)
- Protected routes
- Input validation (Zod)
- MongoDB sessions for atomic transactions
- Daily transaction limits
- Account status checks
- Fraud detection and prevention
- Admin action logging

## 🧪 Testing

### Automated Tests
```bash
cd backend
node test/autoTest.js
```

### Manual Testing
Follow the comprehensive testing guide in `TEST_ALL_FEATURES.md`

## 📁 Project Structure

```
smarttransact/
├── backend/
│   ├── routes/          # API routes
│   ├── ml/              # AI/ML algorithms
│   ├── test/            # Test scripts
│   ├── db.js            # Database schemas
│   ├── middleware.js    # Auth middleware
│   └── index.js         # Server entry
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # React components
│   │   └── App.jsx      # Main app
│   └── package.json
└── README.md
```

## 🎨 Screenshots

### User Dashboard
- Balance display
- Favorites section
- User search
- Transaction history with filters

### Admin Dashboard
- Real-time statistics
- User management table
- Transaction monitoring
- Flagged transactions view
- Admin audit logs

### AI Insights
- Spending trends
- Category breakdown
- Smart recommendations
- Predictive analytics

## 🚦 API Endpoints

### User Routes
- `POST /api/v1/user/signup` - Register
- `POST /api/v1/user/signin` - Login
- `GET /api/v1/user/bulk` - Search users

### Account Routes
- `GET /api/v1/account/balance` - Get balance
- `POST /api/v1/account/transfer` - Send money
- `GET /api/v1/account/transactions` - Transaction history

### User Features Routes
- `GET /api/v1/me/profile` - Get profile
- `POST /api/v1/me/request-money` - Request payment
- `GET /api/v1/me/insights` - AI insights
- `GET /api/v1/me/favorites` - Get favorites
- `GET /api/v1/me/notifications` - Get notifications

### Admin Routes
- `GET /api/v1/admin/users` - All users
- `GET /api/v1/admin/stats` - Dashboard stats
- `POST /api/v1/admin/user/suspend` - Suspend user
- `POST /api/v1/admin/reverse-transaction` - Reverse transaction
- `GET /api/v1/admin/logs` - Audit logs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Pradeep Dhangar**

## 🙏 Acknowledgments

- Built with MERN Stack
- AI/ML algorithms for fraud detection
- Inspired by modern fintech applications
- Comprehensive admin controls for platform management

## 📞 Support

For support, email support@smarttransact.com or open an issue in the repository.

## 🔮 Future Enhancements

- Real ML models (Python integration)
- Email notifications
- SMS alerts
- QR code payments
- Split bills
- Scheduled payments
- Multi-currency support
- Mobile app (React Native)
- Blockchain integration
- Advanced analytics dashboard

---

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by Pradeep Dhangar
