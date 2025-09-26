import { type Express } from "express";import type { Express, Request, Response } from "express";

import multer from "multer";import { createServer, type Server } from "http";

import path from "path";import { Server as SocketIOServer } from "socket.io";

import { storage } from "./storage";import multer from "multer";

import { aiService } from "./ai-service";import path from "path";

import { ocrQueue, aiQueue, priceComparisonQueue } from "./job-queue";import fs from "fs";

import { enhancedStorage as storage } from "./storage-enhanced";

// Configure multer for file uploadsimport { aiService } from "./ai-service";

const upload = multer({import { jobQueue } from "./job-queue-simple";

  dest: 'uploads/',import { nanoid } from "nanoid";

  limits: {

    fileSize: 10 * 1024 * 1024, // 10MB limit// Configure multer for file uploads

  },const uploadDir = path.join(process.cwd(), 'uploads', 'receipts');

  fileFilter: (req, file, cb) => {if (!fs.existsSync(uploadDir)) {

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];  fs.mkdirSync(uploadDir, { recursive: true });

    if (allowedTypes.includes(file.mimetype)) {}

      cb(null, true);

    } else {const upload = multer({

      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));  storage: multer.diskStorage({

    }    destination: uploadDir,

  }    filename: (req, file, cb) => {

});      const uniqueName = `${Date.now()}-${nanoid()}-${file.originalname}`;

      cb(null, uniqueName);

export function registerRoutes(app: Express) {    }

  // Health check endpoint  }),

  app.get("/api/health", (req, res) => {  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit

    res.json({   fileFilter: (req, file, cb) => {

      status: "healthy",     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      timestamp: new Date().toISOString(),    if (allowedTypes.includes(file.mimetype)) {

      uptime: process.uptime()      cb(null, true);

    });    } else {

  });      cb(new Error('Invalid file type. Only images are allowed.'));

    }

  // Receipt endpoints  }

  app.get("/api/receipts", async (req, res) => {});

    try {

      const receipts = await storage.getAllReceipts();export async function registerRoutes(app: Express): Promise<Server> {

      res.json(receipts);  const httpServer = createServer(app);

    } catch (error) {  const io = new SocketIOServer(httpServer, {

      console.error("Error fetching receipts:", error);    cors: {

      res.status(500).json({ error: "Failed to fetch receipts" });      origin: "*",

    }      methods: ["GET", "POST"]

  });    }

  });

  app.get("/api/receipts/:id", async (req, res) => {

    try {  // WebSocket connection handling

      const receipt = await storage.getReceipt(req.params.id);  io.on('connection', (socket) => {

      if (!receipt) {    console.log('Client connected:', socket.id);

        return res.status(404).json({ error: "Receipt not found" });    

      }    socket.on('join-user', (userId) => {

      res.json(receipt);      socket.join(`user-${userId}`);

    } catch (error) {      console.log(`User ${userId} joined room`);

      console.error("Error fetching receipt:", error);    });

      res.status(500).json({ error: "Failed to fetch receipt" });

    }    socket.on('disconnect', () => {

  });      console.log('Client disconnected:', socket.id);

    });

  // Upload receipt with OCR processing  });

  app.post("/api/receipts/upload", upload.single('receipt'), async (req, res) => {

    try {  // Store io instance for broadcasting

      if (!req.file) {  (app as any).io = io;

        return res.status(400).json({ error: "No file uploaded" });

      }  // =============================================================================

  // RECEIPT MANAGEMENT & OCR

      const userId = req.body.userId || 'default-user';  // =============================================================================

      

      // Create initial receipt record  // Upload and process receipt with OCR

      const receipt = await storage.insertReceipt({  app.post("/api/receipts/upload", upload.single('receipt'), async (req: Request, res: Response) => {

        userId,    try {

        imagePath: req.file.path,      if (!req.file) {

        status: 'processing'        return res.status(400).json({ message: "No file uploaded" });

      });      }



      // Queue OCR processing      const { userId, aiEnabled = true } = req.body;

      const job = await ocrQueue.add('process-ocr', {      const filePath = req.file.path;

        receiptId: receipt.id,

        imagePath: req.file.path,      // Create receipt record

        userId: userId      const receipt = await storage.createReceipt({

      });        userId,

        imagePath: filePath,

      res.json({        status: "processing",

        receiptId: receipt.id,        currency: "USD",

        jobId: job.id,      });

        status: 'processing',

        message: 'Receipt uploaded successfully. Processing OCR...'      // Create OCR job

      });      const ocrJob = await storage.createIngestionJob({

        receiptId: receipt.id,

    } catch (error) {        userId,

      console.error("Error uploading receipt:", error);        jobType: "ocr",

      res.status(500).json({ error: "Failed to upload receipt" });        status: "pending",

    }        priority: "1",

  });      });



  // AI categorization endpoint      // Queue OCR processing

  app.post("/api/receipts/:id/categorize", async (req, res) => {      await jobQueue.addOCRJob({

    try {        receiptId: receipt.id,

      const receipt = await storage.getReceipt(req.params.id);        jobId: ocrJob.id,

      if (!receipt) {        imagePath: filePath,

        return res.status(404).json({ error: "Receipt not found" });        userId,

      }        aiEnabled: Boolean(aiEnabled)

      });

      if (!receipt.rawOcrText && !receipt.merchant) {

        return res.status(400).json({ error: "Receipt needs OCR data for categorization" });      // Broadcast to user

      }      io.to(`user-${userId}`).emit('receipt-upload', {

        receiptId: receipt.id,

      // Queue AI categorization        status: 'processing',

      const job = await aiQueue.add('categorize-receipt', {        message: 'Receipt uploaded and processing started'

        receiptId: receipt.id,      });

        text: receipt.rawOcrText || '',

        merchant: receipt.merchant || ''      res.status(202).json({ 

      });        receiptId: receipt.id, 

        status: "processing",

      res.json({        message: "Receipt uploaded successfully. Processing started." 

        jobId: job.id,      });

        status: 'processing',

        message: 'AI categorization started'    } catch (error) {

      });      console.error('Receipt upload error:', error);

      res.status(500).json({ message: "Upload failed", error: error.message });

    } catch (error) {    }

      console.error("Error starting categorization:", error);  });

      res.status(500).json({ error: "Failed to start categorization" });

    }  // Get receipt details with OCR results

  });  app.get("/api/receipts/:id", async (req: Request, res: Response) => {

    try {

  // Price comparison endpoint      const receipt = await storage.getReceipt(req.params.id);

  app.post("/api/receipts/:id/price-compare", async (req, res) => {      if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    try {

      const receipt = await storage.getReceipt(req.params.id);      const lineItems = await storage.listLineItemsByReceipt(receipt.id);

      if (!receipt) {      const transactions = await storage.listTransactionsByReceipt(receipt.id);

        return res.status(404).json({ error: "Receipt not found" });      const aiClassifications = await storage.listAIClassifications(receipt.id);

      }      const corrections = await storage.listCorrections(receipt.id);



      if (!receipt.merchant || !receipt.total) {      res.json({ 

        return res.status(400).json({ error: "Receipt needs merchant and total for price comparison" });        receipt, 

      }        lineItems,

        transactions,

      // Queue price comparison        aiClassifications, 

      const job = await priceComparisonQueue.add('compare-prices', {        corrections 

        receiptId: receipt.id,      });

        merchant: receipt.merchant,    } catch (error) {

        total: parseFloat(receipt.total),      res.status(500).json({ message: "Failed to fetch receipt", error: error.message });

        category: receipt.category || 'general'    }

      });  });



      res.json({  // Get detailed analysis for receipt panel

        jobId: job.id,  app.get("/api/receipts/:id/analysis", async (req: Request, res: Response) => {

        status: 'processing',    try {

        message: 'Price comparison started'      const receipt = await storage.getReceipt(req.params.id);

      });      if (!receipt) return res.status(404).json({ message: "Receipt not found" });



    } catch (error) {      // Get user's spending analytics

      console.error("Error starting price comparison:", error);      const userAnalytics = await storage.getUserSpendingAnalytics(receipt.userId!, 30);

      res.status(500).json({ error: "Failed to start price comparison" });      const categoryBreakdown = await storage.getCategoryBreakdown(receipt.userId!, 30);

    }      

  });      // Get recent transactions for merchant analysis

      const recentTransactions = await storage.listTransactionsByUser(receipt.userId!, 50);

  // Job status endpoint      const merchantHistory = recentTransactions

  app.get("/api/jobs/:jobId", async (req, res) => {        .filter(t => t.merchant === receipt.merchant)

    try {        .slice(0, 5)

      const jobId = req.params.jobId;        .map(t => ({ name: t.merchant, total: parseFloat(t.amount), date: t.date }));

      

      // Try to find the job in different queues      // Get AI reasoning

      const queues = [ocrQueue, aiQueue, priceComparisonQueue];      const latestAI = await storage.getLatestAIClassification(receipt.id);

      let job = null;      

            // Mock price comparison (would integrate with real service)

      for (const queue of queues) {      const priceComparison = [

        try {        { item: "Sample Item", you: 23.37, best: 21.99, delta: -1.38, vendorUrl: "https://amazon.com" },

          job = await queue.getJob(jobId);        { item: "Another Item", you: 15.49, best: 14.99, delta: -0.50, vendorUrl: "https://walmart.com" }

          if (job) break;      ];

        } catch (error) {

          // Continue to next queue      // Generate budget impact analysis

        }      const budgets = await storage.listBudgets(receipt.userId!);

      }      const budgetImpact = budgets.map(budget => ({

        category: budget.name,

      if (!job) {        spent: userAnalytics.totalSpend * 0.3, // Mock calculation

        return res.status(404).json({ error: "Job not found" });        budget: parseFloat(budget.amount),

      }        percentage: (userAnalytics.totalSpend * 0.3 / parseFloat(budget.amount)) * 100

      }));

      const state = await job.getState();

      const progress = job.progress;      res.json({

              receiptTotal: parseFloat(receipt.total || "0"),

      res.json({        periodDelta: userAnalytics.totalSpend - (userAnalytics.totalSpend * 0.8), // Mock previous period

        id: job.id,        categoryShare: categoryBreakdown.map(c => ({ name: c.category, value: c.amount })),

        name: job.name,        merchantsLast5: merchantHistory,

        state: state,        priceComparison,

        progress: progress,        aiReasoning: latestAI?.reasoning || ["Processing complete", "Category assigned based on merchant"],

        data: job.data,        ocrHistogram: receipt.ocrConfidence || [

        result: job.returnvalue,          { field: "merchant", confidence: 0.99 },

        error: job.failedReason          { field: "total", confidence: 0.96 },

      });          { field: "date", confidence: 0.91 },

          { field: "items", confidence: 0.88 }

    } catch (error) {        ],

      console.error("Error fetching job status:", error);        ocrRaw: receipt.ocrRaw || { text: "OCR processing complete" },

      res.status(500).json({ error: "Failed to fetch job status" });        budgetImpact: budgetImpact.slice(0, 2), // Show top 2 impacted budgets

    }      });

  });    } catch (error) {

      res.status(500).json({ message: "Failed to generate analysis", error: error.message });

  // Analytics endpoints    }

  app.get("/api/analytics/spending-by-category", async (req, res) => {  });

    try {

      const categoryTotals = await storage.getTotalSpendingByCategory();  // Confirm receipt and create transaction

      res.json(categoryTotals);  app.post("/api/receipts/:id/confirm", async (req: Request, res: Response) => {

    } catch (error) {    try {

      console.error("Error fetching category spending:", error);      const receipt = await storage.getReceipt(req.params.id);

      res.status(500).json({ error: "Failed to fetch spending data" });      if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    }

  });      const { category, adjustments } = req.body;



  app.get("/api/analytics/monthly-spending", async (req, res) => {      // Create main transaction

    try {      const transaction = await storage.createTransaction({

      const monthlyTotals = await storage.getMonthlySpending();        userId: receipt.userId!,

      res.json(monthlyTotals);        receiptId: receipt.id,

    } catch (error) {        amount: receipt.total!,

      console.error("Error fetching monthly spending:", error);        description: `Purchase at ${receipt.merchant}`,

      res.status(500).json({ error: "Failed to fetch spending data" });        merchant: receipt.merchant!,

    }        categoryId: category,

  });        date: receipt.purchaseAt || receipt.createdAt!,

        type: "expense",

  // WebSocket endpoint for real-time updates (placeholder)        source: "receipt",

  app.get("/api/ws", (req, res) => {        isVerified: true,

    res.json({      });

      message: "WebSocket endpoint - implementation depends on your WebSocket library choice",

      suggestion: "Consider using socket.io or ws library for real-time updates"      // Update receipt status

    });      await storage.updateReceiptStatus(receipt.id, "verified");

  });

}      // Check for anomalies
      const userTransactions = await storage.listTransactionsByUser(receipt.userId!, 100);
      const anomalies = await aiService.detectAnomalies(userTransactions, { userId: receipt.userId });
      
      for (const anomaly of anomalies) {
        await storage.createAnomaly(
          receipt.userId!,
          anomaly.type,
          anomaly.message,
          anomaly.metadata
        );
      }

      // Broadcast confirmation to user
      io.to(`user-${receipt.userId}`).emit('receipt-confirmed', {
        receiptId: receipt.id,
        transactionId: transaction.id,
        anomalies: anomalies.length
      });

      res.json({ 
        success: true, 
        transactionId: transaction.id,
        anomalies: anomalies.length,
        message: "Receipt confirmed and transaction created"
      });
    } catch (error) {
      res.status(500).json({ message: "Confirmation failed", error: error.message });
    }
  });

  // Submit correction for active learning
  app.post("/api/receipts/:id/correction", async (req: Request, res: Response) => {
    try {
      const { field, oldValue, newValue, userId } = req.body;
      const receipt = await storage.getReceipt(req.params.id);
      if (!receipt) return res.status(404).json({ message: "Receipt not found" });

      const correction = await storage.addCorrection({
        userId,
        receiptId: receipt.id,
        field,
        oldValue,
        newValue,
        correctionType: "user",
      });

      // Update accuracy metrics (mock implementation)
      const totalCorrections = (await storage.listCorrections(undefined, userId)).length;
      const totalClassifications = (await storage.listAIClassifications(receipt.id)).length;
      const accuracyRate = Math.max(0.7, 1 - (totalCorrections / Math.max(totalClassifications, 1)));

      // Broadcast correction to user
      io.to(`user-${userId}`).emit('correction-logged', {
        receiptId: receipt.id,
        correction,
        accuracyRate: Math.round(accuracyRate * 100)
      });

      res.json({ 
        correction, 
        accuracyRate,
        message: "Correction logged for active learning"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to log correction", error: error.message });
    }
  });

  // =============================================================================
  // SMS TRANSACTION PROCESSING
  // =============================================================================

  app.post("/api/sms/parse", async (req: Request, res: Response) => {
    try {
      const { smsText, userId } = req.body;

      if (!smsText || !userId) {
        return res.status(400).json({ message: "SMS text and userId are required" });
      }

      // Create SMS transaction record
      const smsTransaction = await storage.createSmsTransaction({
        userId,
        rawSmsText: smsText,
      });

      // Parse with AI
      const parseResult = await aiService.parseSMSTransaction(smsText);

      if (parseResult.success) {
        // Create transaction
        const transaction = await storage.createTransaction({
          userId,
          amount: parseResult.amount.toString(),
          description: `SMS: ${parseResult.merchant}`,
          merchant: parseResult.merchant,
          date: new Date(parseResult.timestamp),
          type: parseResult.type,
          source: "sms",
        });

        // Categorize transaction
        const categoryResult = await aiService.categorizeTransaction(
          parseResult.merchant,
          parseResult.amount,
          parseResult.merchant
        );

        if (categoryResult.confidence > 0.7) {
          // Update transaction with category
          transaction.categoryId = categoryResult.category;
        }

        // Update SMS transaction with results
        smsTransaction.parsedData = parseResult;
        smsTransaction.transactionId = transaction.id;
        smsTransaction.status = "processed";

        res.json({
          success: true,
          transaction,
          parseResult,
          categoryResult,
          smsTransactionId: smsTransaction.id
        });
      } else {
        res.status(400).json({
          success: false,
          error: parseResult.error,
          smsTransactionId: smsTransaction.id
        });
      }
    } catch (error) {
      res.status(500).json({ message: "SMS parsing failed", error: error.message });
    }
  });

  // =============================================================================
  // AI CATEGORIZATION & INSIGHTS
  // =============================================================================

  app.post("/api/ai/categorize", async (req: Request, res: Response) => {
    try {
      const { merchant, amount, description, userId } = req.body;

      // Get user's merchant rules
      const userRules = await storage.listMerchantRules(userId);

      // Categorize with AI
      const result = await aiService.categorizeTransaction(merchant, amount, description, userRules);

      // Store AI classification
      await storage.addAIClassification({
        transactionId: req.body.transactionId,
        modelName: "gpt-4o-mini",
        prompt: `Categorize: ${merchant} - $${amount}`,
        response: JSON.stringify(result),
        category: result.category,
        confidence: result.confidence.toString(),
        reasoning: result.reasoning,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Categorization failed", error: error.message });
    }
  });

  // Get intelligent nudges
  app.get("/api/ai/nudges/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const analytics = await storage.getUserSpendingAnalytics(userId, 30);
      const categoryBreakdown = await storage.getCategoryBreakdown(userId, 30);
      const anomalies = await storage.listAnomalies(userId, false);

      const nudges = await aiService.generateNudges({
        ...analytics,
        categoryBreakdown,
        anomalies
      });

      res.json(nudges);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate nudges", error: error.message });
    }
  });

  // =============================================================================
  // PRICE COMPARISON
  // =============================================================================

  app.get("/api/price-comparison/:product", async (req: Request, res: Response) => {
    try {
      const { product } = req.params;
      const comparisons = await aiService.comparePrice(product);

      // Store vendor prices
      const vendorPrices = comparisons.map(c => ({
        normalizedProduct: product.toLowerCase().replace(/\s+/g, '-'),
        vendor: c.vendor,
        price: c.bestPrice.toString(),
        sourceUrl: c.sourceUrl,
      }));

      await storage.upsertVendorPrices(vendorPrices);

      res.json({
        product,
        comparisons,
        lastUpdated: new Date(),
        totalSavingsOpportunity: comparisons.reduce((sum, c) => sum + c.savings, 0)
      });
    } catch (error) {
      res.status(500).json({ message: "Price comparison failed", error: error.message });
    }
  });

  // =============================================================================
  // ANALYTICS & DASHBOARD
  // =============================================================================

  app.get("/api/analytics/dashboard/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      const analytics = await storage.getUserSpendingAnalytics(userId, Number(days));
      const categoryBreakdown = await storage.getCategoryBreakdown(userId, Number(days));
      const recentTransactions = await storage.listTransactionsByUser(userId, 10);
      const budgets = await storage.listBudgets(userId);
      const anomalies = await storage.listAnomalies(userId, false);

      // Calculate KPIs
      const totalTransactions = recentTransactions.length;
      const aiCategorized = await storage.listAIClassifications();
      const corrections = await storage.listCorrections(undefined, userId);
      
      const kpis = {
        totalSpend: analytics.totalSpend,
        transactionCount: totalTransactions,
        avgTransactionAmount: analytics.avgTransactionAmount,
        aiAccuracy: Math.round((1 - (corrections.length / Math.max(aiCategorized.length, 1))) * 100),
        budgetUtilization: budgets.length ? 
          budgets.reduce((sum, b) => sum + (analytics.totalSpend / parseFloat(b.amount)), 0) / budgets.length * 100 : 0,
        anomaliesCount: anomalies.length,
      };

      res.json({
        kpis,
        analytics,
        categoryBreakdown,
        recentTransactions,
        budgets,
        anomalies: anomalies.slice(0, 5), // Top 5 unresolved anomalies
        period: `${days} days`
      });
    } catch (error) {
      res.status(500).json({ message: "Dashboard analytics failed", error: error.message });
    }
  });

  // =============================================================================
  // BUDGET MANAGEMENT
  // =============================================================================

  app.post("/api/budgets", async (req: Request, res: Response) => {
    try {
      const { userId, categoryId, amount, period = "monthly" } = req.body;
      
      const budget = await storage.createBudget(userId, categoryId, amount, period);
      
      res.json({ 
        success: true, 
        budget,
        message: "Budget created successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Budget creation failed", error: error.message });
    }
  });

  app.get("/api/budgets/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const budgets = await storage.listBudgets(userId);
      
      // Get status for each budget
      const budgetsWithStatus = await Promise.all(
        budgets.map(async (budget) => {
          const status = await storage.checkBudgetStatus(userId, budget.categoryId!);
          return { ...budget, status };
        })
      );

      res.json(budgetsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets", error: error.message });
    }
  });

  // =============================================================================
  // SYSTEM HEALTH & MONITORING
  // =============================================================================

  app.get("/api/system/health", async (req: Request, res: Response) => {
    try {
      const jobs = await storage.listPendingJobs();
      const metrics = await storage.getSystemHealthMetrics();
      
      const health = {
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date(),
        jobs: {
          pending: jobs.length,
          processing: jobs.filter(j => j.status === "processing").length
        },
        memory: process.memoryUsage(),
        metrics: metrics.slice(-10) // Last 10 metrics
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        status: "unhealthy", 
        error: error.message,
        timestamp: new Date()
      });
    }
  });

  // =============================================================================
  // USER SETTINGS & PRIVACY
  // =============================================================================

  app.post("/api/users/:userId/settings", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const settings = req.body;

      const updatedUser = await storage.updateUserSettings(userId, settings);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        success: true,
        settings: updatedUser.settings,
        message: "Settings updated successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Settings update failed", error: error.message });
    }
  });

  // =============================================================================
  // MERCHANT RULES MANAGEMENT
  // =============================================================================

  app.post("/api/merchant-rules", async (req: Request, res: Response) => {
    try {
      const { userId, merchantPattern, categoryId } = req.body;
      
      const rule = await storage.createMerchantRule(userId, merchantPattern, categoryId);
      
      res.json({
        success: true,
        rule,
        message: "Merchant rule created successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Rule creation failed", error: error.message });
    }
  });

  app.get("/api/merchant-rules/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const rules = await storage.listMerchantRules(userId);
      
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rules", error: error.message });
    }
  });

  return httpServer;
}