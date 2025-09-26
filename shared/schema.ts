import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  settings: jsonb("settings").default('{"privacyMode": false, "aiEnabled": true, "redactPII": true}'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  settings: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories with predefined system categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isSystem: boolean("is_system").default(true),
  userId: varchar("user_id"), // null for system categories
  color: varchar("color").default("#6366f1"),
  icon: varchar("icon"),
});

// User-defined merchant rules for categorization
export const merchantRules = pgTable("merchant_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  merchantPattern: text("merchant_pattern").notNull(), // regex pattern
  categoryId: varchar("category_id").notNull(),
  confidence: numeric("confidence").default("1.0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced receipts with better OCR support
export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  imagePath: text("image_path"),
  rawOcrText: text("raw_ocr_text"),
  merchant: text("merchant"),
  category: text("category"),
  total: numeric("total"),
  currency: varchar("currency").default("USD"),
  purchaseAt: timestamp("purchase_at"),
  ocrRaw: jsonb("ocr_raw"), // Full OCR response with field-level confidence
  ocrConfidence: jsonb("ocr_confidence"), // Per-field confidence scores
  status: varchar("status").default("pending"), // pending, processed, verified, error
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("receipts_user_id_idx").on(table.userId),
  statusIdx: index("receipts_status_idx").on(table.status),
}));

// Enhanced transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  receiptId: varchar("receipt_id"),
  amount: numeric("amount").notNull(),
  description: text("description"),
  merchant: text("merchant"),
  categoryId: varchar("category_id"),
  date: timestamp("date").notNull(),
  type: varchar("type").default("expense"), // expense, income
  source: varchar("source").default("receipt"), // receipt, sms, manual
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("transactions_user_id_idx").on(table.userId),
  dateIdx: index("transactions_date_idx").on(table.date),
  categoryIdx: index("transactions_category_idx").on(table.categoryId),
}));

// Line items for receipts
export const lineItems = pgTable("line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: varchar("receipt_id").notNull(),
  item: text("item").notNull(),
  quantity: numeric("quantity").default("1"),
  unitPrice: numeric("unit_price"),
  lineTotal: numeric("line_total"),
  category: text("category"),
});

// Enhanced AI classifications with better tracking
export const aiClassifications = pgTable("ai_classifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: varchar("receipt_id"),
  transactionId: varchar("transaction_id"),
  modelName: varchar("model_name").default("gpt-4o-mini"),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  category: text("category"),
  confidence: numeric("confidence"),
  reasoning: jsonb("reasoning"), // Array of reasoning bullets
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  receiptIdIdx: index("ai_classifications_receipt_idx").on(table.receiptId),
  transactionIdIdx: index("ai_classifications_transaction_idx").on(table.transactionId),
}));

// Enhanced corrections for active learning
export const corrections = pgTable("corrections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  receiptId: varchar("receipt_id"),
  transactionId: varchar("transaction_id"),
  field: varchar("field").notNull(), // category, amount, merchant, etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  correctionType: varchar("correction_type").default("user"), // user, system, batch
  isUsedForTraining: boolean("is_used_for_training").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("corrections_user_id_idx").on(table.userId),
  receiptIdIdx: index("corrections_receipt_idx").on(table.receiptId),
}));

// Enhanced vendor prices with better tracking
export const vendorPrices = pgTable("vendor_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  normalizedProduct: text("normalized_product").notNull(),
  vendor: text("vendor").notNull(),
  price: numeric("price").notNull(),
  sourceUrl: text("source_url"),
  confidence: numeric("confidence").default("0.8"),
  isActive: boolean("is_active").default(true),
  lastChecked: timestamp("last_checked").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  productIdx: index("vendor_prices_product_idx").on(table.normalizedProduct),
  vendorIdx: index("vendor_prices_vendor_idx").on(table.vendor),
}));

// Enhanced job tracking
export const ingestionJobs = pgTable("ingestion_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptId: varchar("receipt_id").notNull(),
  userId: varchar("user_id").notNull(),
  jobType: varchar("job_type").notNull(), // ocr, ai_classify, price_check
  status: varchar("status").notNull(), // pending, processing, completed, failed
  priority: numeric("priority").default("0"),
  attempts: numeric("attempts").default("0"),
  maxAttempts: numeric("max_attempts").default("3"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  latencyMs: numeric("latency_ms"),
  errorMessage: text("error_message"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  statusIdx: index("ingestion_jobs_status_idx").on(table.status),
  receiptIdIdx: index("ingestion_jobs_receipt_idx").on(table.receiptId),
}));

// Budgets and spending limits
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categoryId: varchar("category_id"),
  name: text("name").notNull(),
  amount: numeric("amount").notNull(),
  period: varchar("period").default("monthly"), // daily, weekly, monthly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  alertThreshold: numeric("alert_threshold").default("0.8"), // Alert at 80%
  createdAt: timestamp("created_at").defaultNow(),
});

// Anomalies and alerts
export const anomalies = pgTable("anomalies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  transactionId: varchar("transaction_id"),
  receiptId: varchar("receipt_id"),
  anomalyType: varchar("anomaly_type").notNull(), // high_spend, unusual_merchant, fraud_risk, budget_exceeded
  severity: varchar("severity").default("medium"), // low, medium, high, critical
  message: text("message").notNull(),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS transactions for parsing
export const smsTransactions = pgTable("sms_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  rawSmsText: text("raw_sms_text").notNull(),
  parsedData: jsonb("parsed_data"),
  transactionId: varchar("transaction_id"),
  status: varchar("status").default("pending"), // pending, processed, failed, ignored
  confidence: numeric("confidence"),
  bankName: text("bank_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System health metrics
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  metricValue: numeric("metric_value"),
  metricType: varchar("metric_type").default("gauge"), // gauge, counter, histogram
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

export type Receipt = typeof receipts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type LineItem = typeof lineItems.$inferSelect;
export type AIClassification = typeof aiClassifications.$inferSelect;
export type Correction = typeof corrections.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type MerchantRule = typeof merchantRules.$inferSelect;
export type VendorPrice = typeof vendorPrices.$inferSelect;
export type IngestionJob = typeof ingestionJobs.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Anomaly = typeof anomalies.$inferSelect;
export type SmsTransaction = typeof smsTransactions.$inferSelect;
export type SystemMetric = typeof systemMetrics.$inferSelect;

export const insertReceiptSchema = createInsertSchema(receipts).pick({
  userId: true,
  imagePath: true,
  rawOcrText: true,
  merchant: true,
  category: true,
  total: true,
  currency: true,
  purchaseAt: true,
  ocrRaw: true,
  ocrConfidence: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  receiptId: true,
  amount: true,
  description: true,
  merchant: true,
  categoryId: true,
  date: true,
  type: true,
  source: true,
});

export const insertLineItemSchema = createInsertSchema(lineItems).pick({
  receiptId: true,
  item: true,
  quantity: true,
  unitPrice: true,
  lineTotal: true,
  category: true,
});

export const insertAIClassificationSchema = createInsertSchema(aiClassifications).pick({
  receiptId: true,
  transactionId: true,
  modelName: true,
  prompt: true,
  response: true,
  category: true,
  confidence: true,
  reasoning: true,
});

export const insertCorrectionSchema = createInsertSchema(corrections).pick({
  userId: true,
  receiptId: true,
  transactionId: true,
  field: true,
  oldValue: true,
  newValue: true,
  correctionType: true,
});

export const insertSmsTransactionSchema = createInsertSchema(smsTransactions).pick({
  userId: true,
  rawSmsText: true,
  parsedData: true,
  bankName: true,
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type InsertAIClassification = z.infer<typeof insertAIClassificationSchema>;
export type InsertCorrection = z.infer<typeof insertCorrectionSchema>;
export type InsertSmsTransaction = z.infer<typeof insertSmsTransactionSchema>;
export type InsertVendorPrice = typeof vendorPrices.$inferInsert;
export type InsertIngestionJob = typeof ingestionJobs.$inferInsert;
