import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { storage } from './storage';
import { aiService } from './ai-service';

// Redis connection configuration for BullMQ
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  retryDelayOnFailover: 100,
  lazyConnect: true,
  keepAlive: 1000,
};

const redis = new Redis(redisConfig);

// Handle Redis connection gracefully
redis.on('connect', () => {
  console.log('✅ Redis connected for job queues');
});

redis.on('error', (err) => {
  console.log('⚠️ Redis connection error (job queues will use fallback):', err.message);
});

// Job queues with error handling
export const ocrQueue = new Queue('ocr-processing', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  }
});

export const aiQueue = new Queue('ai-processing', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  }
});

export const priceQueue = new Queue('price-comparison', { 
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  }
});

// Job interfaces
interface OCRJobData {
  receiptId: string;
  jobId: string;
  imagePath: string;
  userId: string;
  aiEnabled: boolean;
}

interface AIJobData {
  receiptId: string;
  transactionId?: string;
  merchant: string;
  amount: number;
  description: string;
  userId: string;
}

interface PriceJobData {
  product: string;
  userId: string;
  receiptId?: string;
}

class JobQueueService {
  private ocrWorker: Worker | null = null;
  private aiWorker: Worker | null = null;
  private priceWorker: Worker | null = null;
  private isRedisAvailable: boolean = false;

  constructor() {
    this.checkRedisConnection().then(() => {
      if (this.isRedisAvailable) {
        this.initializeWorkers();
      } else {
        console.log('⚠️ Redis not available - running without background job processing');
      }
    });
  }

  private async checkRedisConnection(): Promise<void> {
    try {
      await redis.ping();
      this.isRedisAvailable = true;
      console.log('✅ Redis connection verified for job workers');
    } catch (error) {
      this.isRedisAvailable = false;
      console.log('⚠️ Redis not available - background jobs disabled');
    }
  }

  private initializeWorkers() {
    if (!this.isRedisAvailable) return;

    try {
      // OCR Processing Worker
      this.ocrWorker = new Worker('ocr-processing', async (job: Job<OCRJobData>) => {
        const startTime = Date.now();
        const { receiptId, jobId, imagePath, userId, aiEnabled } = job.data;

        try {
          console.log(`Processing OCR job ${jobId} for receipt ${receiptId}`);

          // Update job status
          await storage.updateIngestionJob(jobId, {
            status: "processing",
            startedAt: new Date(),
          });

        // Perform OCR
        const ocrResult = await aiService.performOCR(imagePath);

        // Update receipt with OCR results
        await storage.updateReceiptStatus(receiptId, "ocr_complete", {
          raw: ocrResult,
          confidence: ocrResult.fields,
          text: ocrResult.text
        });

        // Extract structured data from OCR
        const extractedData = this.extractReceiptData(ocrResult);
        
        // Update receipt with extracted data
        const receipt = await storage.getReceipt(receiptId);
        if (receipt && extractedData.merchant) {
          receipt.merchant = extractedData.merchant;
          receipt.total = extractedData.total?.toString();
          receipt.purchaseAt = extractedData.date ? new Date(extractedData.date) : receipt.purchaseAt;
        }

        // Create line items if found
        if (extractedData.items && extractedData.items.length > 0) {
          await storage.createLineItems(extractedData.items.map(item => ({
            receiptId,
            item: item.name,
            quantity: item.quantity?.toString() || "1",
            unitPrice: item.unitPrice?.toString(),
            lineTotal: item.lineTotal?.toString(),
          })));
        }

        const latency = Date.now() - startTime;

        // Complete OCR job
        await storage.updateIngestionJob(jobId, {
          status: "completed",
          finishedAt: new Date(),
          latencyMs: latency.toString(),
          result: { ocrResult, extractedData }
        });

        // Queue AI categorization if enabled
        if (aiEnabled && extractedData.merchant && extractedData.total) {
          await this.addAIJob({
            receiptId,
            merchant: extractedData.merchant,
            amount: parseFloat(extractedData.total),
            description: extractedData.merchant,
            userId
          });
        }

        // Broadcast completion
        const io = (global as any).io;
        if (io) {
          io.to(`user-${userId}`).emit('ocr-complete', {
            receiptId,
            status: 'ocr_complete',
            ocrResult: {
              confidence: ocrResult.confidence,
              extractedData
            }
          });
        }

        console.log(`OCR job ${jobId} completed in ${latency}ms`);

      } catch (error) {
        console.error(`OCR job ${jobId} failed:`, error);

        await storage.updateIngestionJob(jobId, {
          status: "failed",
          finishedAt: new Date(),
          errorMessage: error.message,
          latencyMs: (Date.now() - startTime).toString()
        });

        throw error;
      }
    }, { connection: redis, concurrency: 3 });

    // AI Processing Worker
    this.aiWorker = new Worker('ai-processing', async (job: Job<AIJobData>) => {
      const startTime = Date.now();
      const { receiptId, transactionId, merchant, amount, description, userId } = job.data;

      try {
        console.log(`Processing AI job for receipt ${receiptId}`);

        // Get user's merchant rules
        const userRules = await storage.listMerchantRules(userId);

        // Categorize transaction
        const categoryResult = await aiService.categorizeTransaction(
          merchant,
          amount,
          description,
          userRules
        );

        // Store AI classification
        await storage.addAIClassification({
          receiptId,
          transactionId,
          modelName: 'gpt-4o-mini',
          prompt: `Categorize: ${merchant} - $${amount} - ${description}`,
          response: JSON.stringify(categoryResult),
          category: categoryResult.category,
          confidence: categoryResult.confidence.toString(),
          reasoning: categoryResult.reasoning,
        });

        // Update receipt/transaction with category
        if (receiptId) {
          const receipt = await storage.getReceipt(receiptId);
          if (receipt) {
            receipt.category = categoryResult.category;
          }
        }

        // Check for anomalies
        const recentTransactions = await storage.listTransactionsByUser(userId, 50);
        const anomalies = await aiService.detectAnomalies(recentTransactions, { userId });

        // Create anomaly records
        for (const anomaly of anomalies) {
          await storage.createAnomaly(
            userId,
            anomaly.type,
            anomaly.message,
            anomaly.metadata
          );
        }

        const latency = Date.now() - startTime;

        // Broadcast completion
        const io = (global as any).io;
        if (io) {
          io.to(`user-${userId}`).emit('ai-complete', {
            receiptId,
            transactionId,
            categoryResult,
            anomalies: anomalies.length,
            latency
          });
        }

        console.log(`AI job completed in ${latency}ms - Category: ${categoryResult.category} (${Math.round(categoryResult.confidence * 100)}%)`);

      } catch (error) {
        console.error(`AI job failed for receipt ${receiptId}:`, error);
        throw error;
      }
    }, { connection: redis, concurrency: 5 });

    // Price Comparison Worker
    this.priceWorker = new Worker('price-comparison', async (job: Job<PriceJobData>) => {
      const { product, userId, receiptId } = job.data;

      try {
        console.log(`Processing price comparison for: ${product}`);

        const comparisons = await aiService.comparePrice(product);

        // Store vendor prices
        if (comparisons.length > 0) {
          const vendorPrices = comparisons.map(c => ({
            normalizedProduct: product.toLowerCase().replace(/\s+/g, '-'),
            vendor: c.vendor,
            price: c.bestPrice.toString(),
            sourceUrl: c.sourceUrl,
          }));

          await storage.upsertVendorPrices(vendorPrices);
        }

        // Find best savings opportunity
        const bestDeal = comparisons.reduce((best, current) => 
          current.savings > best.savings ? current : best, comparisons[0]);

        // Broadcast results
        const io = (global as any).io;
        if (io) {
          io.to(`user-${userId}`).emit('price-comparison-complete', {
            product,
            receiptId,
            comparisons,
            bestDeal,
            totalSavings: comparisons.reduce((sum, c) => sum + c.savings, 0)
          });
        }

        console.log(`Price comparison completed for ${product}: ${comparisons.length} options found`);

      } catch (error) {
        console.error(`Price comparison failed for ${product}:`, error);
        throw error;
      }
    }, { connection: redis, concurrency: 2 });

    this.setupWorkerEvents();
  }

  private setupWorkerEvents() {
    // OCR Worker events
    this.ocrWorker.on('completed', (job, result) => {
      console.log(`✅ OCR job ${job.id} completed`);
    });

    this.ocrWorker.on('failed', (job, err) => {
      console.error(`❌ OCR job ${job?.id} failed:`, err.message);
    });

    // AI Worker events
    this.aiWorker.on('completed', (job, result) => {
      console.log(`🤖 AI job ${job.id} completed`);
    });

    this.aiWorker.on('failed', (job, err) => {
      console.error(`❌ AI job ${job?.id} failed:`, err.message);
    });

    // Price Worker events
    this.priceWorker.on('completed', (job, result) => {
      console.log(`💰 Price job ${job.id} completed`);
    });

    this.priceWorker.on('failed', (job, err) => {
      console.error(`❌ Price job ${job?.id} failed:`, err.message);
    });
  }

  // Extract structured data from OCR result
  private extractReceiptData(ocrResult: any) {
    const text = ocrResult.text || '';
    const fields = ocrResult.fields || [];

    // Extract merchant name (first line usually)
    const lines = text.split('\n').filter(line => line.trim());
    const merchant = fields.find(f => f.field === 'merchant')?.value || lines[0]?.trim();

    // Extract total
    const totalField = fields.find(f => f.field === 'total');
    const total = totalField?.value || this.extractTotal(text);

    // Extract date
    const dateField = fields.find(f => f.field === 'date');
    const date = dateField?.value || this.extractDate(text);

    // Extract items (simplified)
    const items = this.extractItems(text);

    return {
      merchant,
      total,
      date,
      items,
      confidence: ocrResult.confidence
    };
  }

  private extractTotal(text: string): string | null {
    // Look for total patterns
    const totalPatterns = [
      /TOTAL[:\s]*\$?(\d+\.\d{2})/i,
      /Total[:\s]*\$?(\d+\.\d{2})/i,
      /AMOUNT[:\s]*\$?(\d+\.\d{2})/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  private extractDate(text: string): string | null {
    // Look for date patterns
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(\d{1,2}-\d{1,2}-\d{2,4})/,
      /(\d{2,4}-\d{1,2}-\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  private extractItems(text: string): any[] {
    // Simplified item extraction - would be more sophisticated in production
    const lines = text.split('\n');
    const items = [];

    for (const line of lines) {
      // Look for price patterns in lines
      const priceMatch = line.match(/\$(\d+\.\d{2})/);
      if (priceMatch && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('tax')) {
        const price = parseFloat(priceMatch[1]);
        const itemName = line.replace(/\$\d+\.\d{2}.*/, '').trim();
        
        if (itemName && itemName.length > 2) {
          items.push({
            name: itemName,
            lineTotal: price,
            unitPrice: price,
            quantity: 1
          });
        }
      }
    }

    return items.slice(0, 10); // Limit to 10 items
  }

  // Public methods to add jobs
  async addOCRJob(data: OCRJobData) {
    return await ocrQueue.add('process-ocr', data, {
      priority: 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }

  async addAIJob(data: AIJobData) {
    return await aiQueue.add('process-ai', data, {
      priority: 5,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1000 }
    });
  }

  async addPriceJob(data: PriceJobData) {
    return await priceQueue.add('compare-price', data, {
      priority: 1,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 }
    });
  }

  // Queue management methods
  async getQueueStats() {
    const [ocrStats, aiStats, priceStats] = await Promise.all([
      ocrQueue.getJobCounts(),
      aiQueue.getJobCounts(),
      priceQueue.getJobCounts()
    ]);

    return {
      ocr: ocrStats,
      ai: aiStats,
      price: priceStats
    };
  }

  async pauseQueues() {
    await Promise.all([
      ocrQueue.pause(),
      aiQueue.pause(),
      priceQueue.pause()
    ]);
  }

  async resumeQueues() {
    await Promise.all([
      ocrQueue.resume(),
      aiQueue.resume(),
      priceQueue.resume()
    ]);
  }

  async shutdown() {
    await Promise.all([
      this.ocrWorker.close(),
      this.aiWorker.close(),
      this.priceWorker.close(),
      ocrQueue.close(),
      aiQueue.close(),
      priceQueue.close()
    ]);

    await redis.quit();
  }
}

export const jobQueue = new JobQueueService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down job queues...');
  await jobQueue.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down job queues...');
  await jobQueue.shutdown();
  process.exit(0);
});