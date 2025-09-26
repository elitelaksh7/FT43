import OpenAI from 'openai';

interface OCRResult {
  text: string;
  confidence: number;
  fields: {
    field: string;
    value: string;
    confidence: number;
  }[];
}

interface AICategorizationResult {
  category: string;
  confidence: number;
  reasoning: string[];
}

interface PriceComparisonResult {
  product: string;
  bestPrice: number;
  vendor: string;
  savings: number;
  sourceUrl?: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private isEnabled: boolean = false;

  constructor() {
    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isEnabled = true;
    } else {
      console.warn('OpenAI API key not found. AI features will use mock data.');
    }
  }

  // PII Redaction - removes sensitive information before sending to AI
  private redactPII(text: string): string {
    if (!text) return text;

    // Remove credit card numbers (keep last 4 digits)
    text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?(\d{4})\b/g, '****-****-****-$1');
    
    // Remove phone numbers
    text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '***-***-****');
    
    // Remove email addresses
    text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '****@****.***');
    
    // Remove SSN-like patterns
    text = text.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '***-**-****');
    
    return text;
  }

  // Enhanced OCR with field-level confidence
  async performOCR(imageData: string | Buffer): Promise<OCRResult> {
    // For now, return mock OCR result with realistic field confidence
    // In production, this would integrate with Google Vision API, AWS Textract, or similar
    return {
      text: "WALMART SUPERCENTER\n#1234\n123 MAIN ST\nCITY, ST 12345\nTel: (555) 123-4567\n\nGROCERIES\nBananas 2.50 lbs @ $1.48/lb    $3.70\nMilk Gallon 2%                 $3.29\nBread Whole Wheat               $2.99\nEggs Large 12ct                 $2.49\nApples 3 lbs @ $2.99/lb         $8.97\n\nSubtotal:                      $21.44\nTax:                           $1.93\nTOTAL:                        $23.37\n\nVISA ****1234\nAuth# 123456\n12/15/2024 3:45 PM\nThank you for shopping!",
      confidence: 0.89,
      fields: [
        { field: "merchant", value: "WALMART SUPERCENTER", confidence: 0.99 },
        { field: "total", value: "23.37", confidence: 0.96 },
        { field: "date", value: "12/15/2024", confidence: 0.91 },
        { field: "tax", value: "1.93", confidence: 0.88 },
        { field: "subtotal", value: "21.44", confidence: 0.85 },
        { field: "items", value: "Bananas,Milk Gallon 2%,Bread Whole Wheat,Eggs Large 12ct,Apples", confidence: 0.82 }
      ]
    };
  }

  // AI-powered transaction categorization with rules-first approach
  async categorizeTransaction(merchant: string, amount: number, description: string, userRules?: any[]): Promise<AICategorizationResult> {
    // First, try rules-based categorization
    const rulesResult = this.categorizeWithRules(merchant, description, userRules);
    if (rulesResult.confidence > 0.8) {
      return rulesResult;
    }

    // Fallback to AI categorization
    return this.categorizeWithAI(merchant, amount, description);
  }

  private categorizeWithRules(merchant: string, description: string, userRules?: any[]): AICategorizationResult {
    // Check user-defined rules first
    if (userRules) {
      for (const rule of userRules) {
        const pattern = new RegExp(rule.pattern, 'i');
        if (pattern.test(merchant) || pattern.test(description)) {
          return {
            category: rule.category,
            confidence: parseFloat(rule.confidence) || 1.0,
            reasoning: [`Matched user rule: ${rule.pattern}`]
          };
        }
      }
    }

    // System rules
    const systemRules = [
      { patterns: ['walmart', 'grocery', 'supermarket', 'kroger', 'safeway'], category: 'Groceries' },
      { patterns: ['restaurant', 'food', 'pizza', 'burger', 'cafe', 'mcdonald'], category: 'Dining' },
      { patterns: ['gas', 'fuel', 'shell', 'exxon', 'bp', 'chevron'], category: 'Transportation' },
      { patterns: ['electric', 'water', 'utility', 'power', 'gas company'], category: 'Utilities' },
      { patterns: ['amazon', 'target', 'mall', 'shopping'], category: 'Shopping' },
      { patterns: ['movie', 'theater', 'netflix', 'spotify', 'entertainment'], category: 'Entertainment' },
      { patterns: ['hospital', 'doctor', 'pharmacy', 'cvs', 'walgreens', 'medical'], category: 'Health' }
    ];

    for (const rule of systemRules) {
      for (const pattern of rule.patterns) {
        if (merchant.toLowerCase().includes(pattern) || description.toLowerCase().includes(pattern)) {
          return {
            category: rule.category,
            confidence: 0.85,
            reasoning: [`Matched system rule for ${rule.category}: "${pattern}"`]
          };
        }
      }
    }

    return {
      category: 'Other',
      confidence: 0.3,
      reasoning: ['No matching rules found']
    };
  }

  private async categorizeWithAI(merchant: string, amount: number, description: string): Promise<AICategorizationResult> {
    if (!this.isEnabled) {
      // Return mock AI categorization
      return {
        category: 'Shopping',
        confidence: 0.75,
        reasoning: ['AI service not available, using mock categorization', 'Based on merchant name pattern']
      };
    }

    try {
      const redactedMerchant = this.redactPII(merchant);
      const redactedDescription = this.redactPII(description);

      const prompt = `Classify this transaction into one of these categories: Groceries, Dining, Transportation, Utilities, Entertainment, Health, Shopping, Other.

Transaction details:
- Merchant: "${redactedMerchant}"
- Amount: $${amount}
- Description: "${redactedDescription}"

Return JSON format:
{
  "category": "...",
  "confidence": 0.0-1.0,
  "reasoning": ["reason 1", "reason 2"]
}

If unsure, use "Other" with low confidence.`;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        category: result.category || 'Other',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
        reasoning: result.reasoning || ['AI categorization completed']
      };

    } catch (error) {
      console.error('AI categorization error:', error);
      return {
        category: 'Other',
        confidence: 0.1,
        reasoning: ['AI categorization failed', 'Using fallback category']
      };
    }
  }

  // Parse SMS transaction text
  async parseSMSTransaction(smsText: string): Promise<any> {
    if (!this.isEnabled) {
      // Mock SMS parsing
      return {
        amount: 125.50,
        type: 'debit',
        merchant: 'Amazon India',
        bankName: 'HDFC Bank',
        timestamp: new Date(),
        confidence: 0.85,
        success: true
      };
    }

    try {
      const redactedSMS = this.redactPII(smsText);
      
      const prompt = `Parse this bank SMS transaction into structured data:

SMS: "${redactedSMS}"

Return JSON format:
{
  "success": true/false,
  "amount": number,
  "type": "debit" or "credit",
  "merchant": "merchant name",
  "bankName": "bank name",
  "timestamp": "ISO date string",
  "confidence": 0.0-1.0
}

If parsing fails, return {"success": false, "error": "reason"}`;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{"success": false, "error": "Parse failed"}');

    } catch (error) {
      console.error('SMS parsing error:', error);
      return {
        success: false,
        error: 'SMS parsing service unavailable'
      };
    }
  }

  // Anomaly detection
  async detectAnomalies(transactions: any[], userProfile: any): Promise<any[]> {
    const anomalies = [];

    // Rule-based anomaly detection
    if (transactions.length === 0) return anomalies;

    const amounts = transactions.map(t => parseFloat(t.amount));
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // High spend anomaly
    const highSpendThreshold = avgAmount * 3;
    const highSpendTransactions = transactions.filter(t => parseFloat(t.amount) > highSpendThreshold);
    
    highSpendTransactions.forEach(t => {
      anomalies.push({
        type: 'high_spend',
        severity: 'medium',
        message: `Transaction amount $${t.amount} is ${Math.round(parseFloat(t.amount) / avgAmount)}x higher than your average`,
        transactionId: t.id,
        metadata: { threshold: highSpendThreshold, average: avgAmount }
      });
    });

    // Unusual merchant detection (simplified)
    const merchantCounts = new Map();
    transactions.forEach(t => {
      merchantCounts.set(t.merchant, (merchantCounts.get(t.merchant) || 0) + 1);
    });

    const unusualMerchants = Array.from(merchantCounts.entries())
      .filter(([_, count]) => count === 1 && transactions.length > 10);

    unusualMerchants.forEach(([merchant, _]) => {
      const transaction = transactions.find(t => t.merchant === merchant);
      if (parseFloat(transaction.amount) > avgAmount * 2) {
        anomalies.push({
          type: 'unusual_merchant',
          severity: 'low',
          message: `First time transaction at ${merchant} for $${transaction.amount}`,
          transactionId: transaction.id,
          metadata: { merchant }
        });
      }
    });

    return anomalies;
  }

  // Generate intelligent nudges/recommendations
  async generateNudges(userAnalytics: any): Promise<any[]> {
    const nudges = [];

    // Spending pattern nudges
    if (userAnalytics.totalSpend > userAnalytics.previousMonth * 1.2) {
      nudges.push({
        type: 'spending_alert',
        severity: 'medium',
        title: 'Spending Up 20%',
        message: `Your spending this month is 20% higher than last month. Consider reviewing your budget.`,
        actionable: true,
        actions: [
          { label: 'Review Budget', action: 'open_budget' },
          { label: 'See Breakdown', action: 'open_categories' }
        ]
      });
    }

    // Category-specific nudges
    if (userAnalytics.categoryBreakdown) {
      const topCategory = userAnalytics.categoryBreakdown[0];
      if (topCategory && topCategory.percentage > 40) {
        nudges.push({
          type: 'category_concentration',
          severity: 'low',
          title: 'High Category Concentration',
          message: `${topCategory.percentage.toFixed(1)}% of your spending is on ${topCategory.category}. Consider diversifying.`,
          actionable: false
        });
      }
    }

    // Savings opportunity nudges
    nudges.push({
      type: 'savings_opportunity',
      severity: 'low',
      title: 'Price Tracking Available',
      message: 'Enable price tracking on frequent purchases to find better deals.',
      actionable: true,
      actions: [
        { label: 'Enable Tracking', action: 'enable_price_tracking' }
      ]
    });

    return nudges;
  }

  // Price comparison (mock implementation)
  async comparePrice(product: string): Promise<PriceComparisonResult[]> {
    // Mock price comparison - in production this would integrate with price comparison APIs
    return [
      {
        product: product,
        bestPrice: 24.99,
        vendor: 'Amazon',
        savings: 5.00,
        sourceUrl: 'https://amazon.com/example'
      },
      {
        product: product,
        bestPrice: 26.49,
        vendor: 'Walmart',
        savings: 3.50,
        sourceUrl: 'https://walmart.com/example'
      }
    ];
  }
}

export const aiService = new AIService();