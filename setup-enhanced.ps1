# FinTrackAI Enhanced Setup Script for Windows PowerShell
# Run this script to quickly set up the enhanced FinTrackAI system

Write-Host "🚀 Setting up FinTrackAI Enhanced System..." -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to check if a service is running
function Test-ServiceRunning {
    param($serviceName, $port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
if (Test-CommandExists "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm found: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies. Please run 'npm install' manually." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setup environment file
Write-Host "🔧 Setting up environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists, skipping..." -ForegroundColor Orange
} else {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "📝 Please edit .env file with your OpenAI API key and other settings" -ForegroundColor Cyan
}

Write-Host ""

# Check Redis
Write-Host "🔍 Checking Redis server..." -ForegroundColor Yellow
if (Test-ServiceRunning "redis" 6379) {
    Write-Host "✅ Redis server is running on port 6379" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis server not found on port 6379" -ForegroundColor Orange
    Write-Host "   Redis is required for background job processing" -ForegroundColor Cyan
    Write-Host "   Options to start Redis:" -ForegroundColor Cyan
    Write-Host "   1. Docker: docker run -d --name redis -p 6379:6379 redis:alpine" -ForegroundColor White
    Write-Host "   2. Install Redis for Windows: https://github.com/microsoftarchive/redis/releases" -ForegroundColor White
    Write-Host "   3. Use cloud Redis: Update REDIS_URL in .env" -ForegroundColor White
}

Write-Host ""

# Create uploads directory
Write-Host "📁 Creating uploads directory..." -ForegroundColor Yellow
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads"
    Write-Host "✅ Created uploads directory" -ForegroundColor Green
} else {
    Write-Host "✅ Uploads directory already exists" -ForegroundColor Green
}

Write-Host ""

# Check if .env is configured
Write-Host "🔧 Checking configuration..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
if ($envContent) {
    if ($envContent -match "OPENAI_API_KEY=your_openai_api_key_here") {
        Write-Host "⚠️  OpenAI API key not configured in .env" -ForegroundColor Orange
        Write-Host "   Get your API key from: https://platform.openai.com/api-keys" -ForegroundColor Cyan
        Write-Host "   Or set MOCK_AI_RESPONSES=true for testing" -ForegroundColor Cyan
    } else {
        Write-Host "✅ OpenAI API key appears to be configured" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Could not read .env file" -ForegroundColor Orange
}

Write-Host ""
Write-Host "🎯 Setup Summary:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host "✅ Environment file created" -ForegroundColor Green
Write-Host "✅ Uploads directory ready" -ForegroundColor Green

if (Test-ServiceRunning "redis" 6379) {
    Write-Host "✅ Redis server ready" -ForegroundColor Green
    $redisReady = $true
} else {
    Write-Host "⚠️  Redis server needs setup" -ForegroundColor Orange
    $redisReady = $false
}

Write-Host ""

# Check if we can start the server
if ($redisReady) {
    Write-Host "🚀 Ready to start! Run the following command:" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 The enhanced FinTrackAI will be available at:" -ForegroundColor Cyan
    Write-Host "   http://localhost:5000" -ForegroundColor White
    Write-Host ""
    
    $startNow = Read-Host "Would you like to start the development server now? (y/N)"
    if ($startNow -eq "y" -or $startNow -eq "Y") {
        Write-Host ""
        Write-Host "🚀 Starting FinTrackAI Enhanced Server..." -ForegroundColor Cyan
        npm run dev
    }
} else {
    Write-Host "⚠️  Please set up Redis server before starting:" -ForegroundColor Orange
    Write-Host "   1. Start Redis server" -ForegroundColor White
    Write-Host "   2. Update .env with your OpenAI API key" -ForegroundColor White
    Write-Host "   3. Run: npm run dev" -ForegroundColor White
}

Write-Host ""
Write-Host "📖 For detailed setup instructions, see README-Enhanced.md" -ForegroundColor Cyan
Write-Host "🎉 Setup complete! Enjoy your enhanced FinTrackAI system!" -ForegroundColor Green