# FinTrackAI - Financial Tracking Application with AI

A modern full-stack financial tracking application built with React, TypeScript, and AI integration for smart expense management.

## 🚀 Features

- **Expense Dashboard**: Interactive charts and analytics for expense tracking
- **AI Categorization Engine**: Automatically categorizes transactions using AI and learns from user corrections for increasingly personalized accuracy.
- **OCR Bill Scanner**: Instantly extracts line-items, totals, taxes, and merchant details from receipts and bills for immediate, detailed analysis.
- **SMS Transaction Parser**: Parse transaction data from SMS messages
- **Personal Price Tracker**: Tracks prices for frequently purchased items, highlights trends, and alerts you on spikes or drops.
- **Intelligent Nudges**: AI-powered financial recommendations.
- **Real-time Analytics (WebSockets)**: Live expense tracking and budget monitoring with instant updates delivered over WebSockets.

> See the full, enriched descriptions in `docs/FEATURES.md`.

## 💡 Core User Journey — Instant Analysis Flow

1. **Scan a receipt** with the OCR Bill Scanner; data is extracted immediately.
2. **Quick confirmation** modal offers two choices: "Confirm & Close" or "See Impact".
3. **Mini-dashboard** shows AI Nudge Cards and focused charts for category impact, trends, and remaining budget.
4. **AI learns** from any corrections you make, improving future categorizations.
5. **Real-time updates** keep dashboards and budgets in sync via WebSockets.

> A detailed walkthrough is available in `docs/CORE_USER_JOURNEY.md`.

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** components
- **Recharts** for data visualization
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **OpenAI API** integration
- **WebSocket** support

### Development Tools
- **ESBuild** for bundling
- **PostCSS** for CSS processing
- **Cross-env** for environment variables

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)
- **VS Code** (recommended for development)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FinTrackAI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration (Optional)
The application uses in-memory storage by default, so no database setup is required for basic functionality.

If you want to use AI features, create a `.env` file in the root directory:
```bash
# Optional: Add your OpenAI API key for AI features
OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 Running the Application

### Method 1: Command Line
1. **Start the Development Server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

### Method 2: VS Code Debugging
1. Open the project in **VS Code**
2. Go to **Run and Debug** (Ctrl+Shift+D)
3. Select **"Launch FinTrackAI in Chrome"**
4. Press **F5** or click the **Play** button

The application will automatically open in Chrome at `http://localhost:5000`

## 📁 Project Structure

```
FinTrackAI/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── pages/          # Page components
│   └── index.html
├── server/                 # Backend Express application
│   ├── index.ts            # Main server file
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage logic
│   └── vite.ts             # Vite development setup
├── shared/                 # Shared TypeScript types
│   └── schema.ts
├── .vscode/                # VS Code configuration
│   ├── launch.json         # Debugger configuration
│   └── tasks.json          # Task runner configuration
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🧪 Demo script (Receipt Analysis Panel)

1. Start the app: `npm run dev`
2. Use the OCR flow or POST a receipt:
   ```bash
   curl -X POST http://localhost:5000/api/receipts -H "Content-Type: application/json" -d '{
     "userId": "demo-user",
     "merchant": "MarketPlace",
     "total": 54.20,
     "currency": "USD",
     "items": [
       {"item":"Milk 1L","quantity":1,"unitPrice":2.99,"lineTotal":2.99,"category":"Groceries"},
       {"item":"Eggs 12","quantity":1,"unitPrice":3.49,"lineTotal":3.49,"category":"Groceries"}
     ],
     "ocrRaw": {"lines": ["Milk 1L $2.99","Eggs 12 $3.49"], "meta": {"merchant": "MarketPlace"}},
     "aiEnabled": false
   }'
   ```
3. In the UI, click "View detailed analysis" to open the slide-over.

### Sample receipts
- "MarketPlace" — groceries total $54.20
- "CoffeeHaus" — dining total $8.15
- "PharmaOne" — pharmacy total $22.30

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run check

# Push database schema (if using external DB)
npm run db:push
```

## 🐛 Troubleshooting

### Common Issues

**1. Port 5000 already in use:**
```bash
# Kill any process using port 5000
netstat -ano | findstr :5000
# Then kill the process ID shown
taskkill /PID <process_id> /F
```

**2. Dependencies not installing:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**3. VS Code debugger not working:**
- Make sure you're in the correct directory: `FinTrackAI/`
- Ensure the server is not already running
- Try running `npm run dev` manually first

**4. TypeScript errors:**
```bash
# Run type checking
npm run check
```

### Windows-Specific Issues

**PowerShell Execution Policy:**
If you get execution policy errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Directory Path Issues:**
Always use the full path when navigating:
```powershell
cd "C:\path\to\your\FinTrackAI"
```

## 🔗 API Endpoints

The server exposes the following endpoints:

- `GET /` - Serves the React application
- `GET /api/*` - API routes (defined in `server/routes.ts`)

## 🎨 UI Components

The application uses a comprehensive set of UI components located in `client/src/components/ui/`:

- Buttons, Forms, Inputs
- Charts and Data Visualization
- Modals and Dialogs
- Navigation Components
- Layout Components

## 🤝 Development Workflow

1. **Start the development server**: `npm run dev`
2. **Make your changes** in the `client/` or `server/` directories
3. **Hot reload** will automatically update the application
4. **Run type checking**: `npm run check`
5. **Build for production**: `npm run build`

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and type checking: `npm run check`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to your branch: `git push origin feature-name`
7. Create a Pull Request

## 🆘 Getting Help

If you encounter any issues:

1. **Check the console** for error messages
2. **Verify all dependencies** are installed: `npm install`
3. **Ensure you're in the correct directory**: `FinTrackAI/`
4. **Check if port 5000 is available**
5. **Try restarting the development server**

## 📄 License

This project is licensed under the MIT License.

---

## 🚀 Quick Start Summary

For the impatient developer:

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm run dev

# 3. Open browser
# Navigate to http://localhost:5000
```

**That's it! Your FinTrackAI application should now be running! 🎉**