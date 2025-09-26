# FinTrackAI Enhanced Setup Guide

Welcome to the fully enhanced FinTrackAI financial tracking platform! This guide will help you set up and run the complete system with all features.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Copy the example environment file:
```bash
copy .env.example .env
```

Edit the `.env` file with your configuration (minimum required):
```env
NODE_ENV=development
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=redis://localhost:6379
```

### 3. Start Redis (Required for Background Jobs)

**Option A: Using Docker**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Option B: Install Redis locally**
- Windows: https://github.com/microsoftarchive/redis/releases
- macOS: `brew install redis && brew services start redis`
- Linux: `sudo apt-get install redis-server`

### 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:5000 to use the enhanced FinTrackAI!

---

## 🎯 Available Features

### ✅ Core Financial Tracking
- **Receipt OCR Processing**: Upload receipt images for automatic text extraction
- **Transaction Management**: View, edit, and categorize all transactions
- **Real-time Dashboard**: Live analytics with spending insights
- **Budget Management**: Set budgets and track utilization

### 🤖 AI-Powered Features
- **Smart Categorization**: AI automatically categorizes transactions
- **Anomaly Detection**: Alerts for unusual spending patterns
- **Intelligent Nudges**: Personalized financial tips and insights
- **SMS Transaction Parsing**: Extract transactions from SMS messages
- **PII Redaction**: Automatic removal of sensitive information

### 📊 Advanced Analytics
- **Spending Analytics**: Detailed expense breakdowns and trends
- **Price Comparison**: Compare prices across different merchants
- **Merchant Rules**: Custom rules for automatic categorization
- **System Health Monitoring**: Real-time system performance metrics

### 🔧 Technical Features
- **Background Job Processing**: Efficient OCR and AI processing with BullMQ
- **Real-time Updates**: WebSocket connections for live notifications
- **File Upload System**: Secure receipt image handling
- **Enhanced Storage**: Comprehensive data management with analytics
- **Error Handling**: Robust error handling and recovery

---

## 🔧 Configuration Details

### Required Services

1. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - Used for: AI categorization, SMS parsing, anomaly detection
   - Cost: ~$0.50-2.00 per 1000 transactions (very affordable)

2. **Redis Server**
   - Used for: Background job queues
   - Free options: Local installation, Upstash free tier
   - Required for: OCR processing, AI jobs, price comparison

### Optional Services

1. **Database** (Currently using enhanced in-memory storage)
   - Can be upgraded to PostgreSQL for persistence
   - Current system includes full data analytics

2. **External Price APIs** (Currently using mock data)
   - Can integrate with real price comparison services

---

## 📱 How to Use

### 1. Upload Receipts
1. Navigate to the "Scan" section
2. Upload receipt images (JPEG, PNG, PDF)
3. Watch real-time OCR processing
4. Review extracted transactions and AI categorization

### 2. SMS Transaction Import
1. Go to "SMS" section
2. Paste SMS messages from banks
3. AI extracts transaction details automatically
4. Transactions are added to your dashboard

### 3. Monitor Spending
1. Dashboard shows real-time spending analytics
2. Set budgets and receive alerts
3. View anomaly detection results
4. Get intelligent spending nudges

### 4. Categorize Transactions
1. AI automatically categorizes most transactions
2. Review and correct AI suggestions
3. Create merchant rules for future automation
4. System learns from your corrections

---

## 🐛 Troubleshooting

### Common Issues

1. **"Redis connection failed"**
   ```bash
   # Start Redis server
   redis-server
   # Or using Docker
   docker start redis
   ```

2. **"OpenAI API error"**
   - Check your API key in `.env`
   - Verify you have credits in your OpenAI account
   - Set `MOCK_AI_RESPONSES=true` for testing without OpenAI

3. **"Upload failed"**
   - Check file size (must be < 10MB)
   - Verify file type (JPEG, PNG, WebP, PDF only)
   - Ensure `uploads` directory exists

4. **"Real-time updates not working"**
   - Check browser console for WebSocket errors
   - Verify server is running on correct port
   - Check firewall settings

### Development Mode

For development without external dependencies:
```env
MOCK_AI_RESPONSES=true
MOCK_PRICE_COMPARISON=true
DEBUG_MODE=true
```

---

## 🌟 API Endpoints

### Core Endpoints
- `GET /health` - System health check
- `POST /api/receipts/upload` - Upload receipt for OCR
- `GET /api/dashboard/analytics` - Dashboard data
- `POST /api/sms/parse` - Parse SMS transactions
- `GET /api/transactions` - List all transactions

### Real-time Features
- WebSocket at `/` for real-time updates
- Background job processing for OCR and AI
- Live notifications for anomalies and nudges

---

## 📈 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Express Server │───▶│  Background     │
│   (Enhanced)    │    │  (WebSocket +   │    │  Jobs (BullMQ)  │
│                 │    │   REST API)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Enhanced       │    │      Redis      │
                       │  Storage        │    │   Job Queues    │
                       │  (Analytics)    │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │  (AI Services)  │
                       └─────────────────┘
```

---

## 🎉 What's New in Enhanced Version

### Backend Enhancements
- ✅ Complete database schema with 13+ tables
- ✅ OpenAI integration with PII redaction
- ✅ Background job processing system
- ✅ WebSocket real-time updates
- ✅ Enhanced storage with analytics
- ✅ Comprehensive API endpoints
- ✅ System health monitoring

### Frontend Enhancements
- ✅ Real-time dashboard updates
- ✅ Enhanced OCR component with progress tracking
- ✅ WebSocket integration for live notifications
- ✅ Error handling and loading states
- ✅ Mobile-responsive design

### AI Features
- ✅ Smart transaction categorization
- ✅ SMS transaction parsing
- ✅ Anomaly detection with alerts
- ✅ Intelligent financial nudges
- ✅ Price comparison engine
- ✅ Active learning from corrections

---

## 🤝 Support

If you encounter any issues:
1. Check this README for troubleshooting tips
2. Review the console logs for error details
3. Ensure all required services (Redis, OpenAI) are configured
4. Try running in development mode with mock services

---

**🎯 You now have a fully functional, feature-complete financial tracking platform with AI, real-time processing, and comprehensive analytics!**