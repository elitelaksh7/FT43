// Simple in-memory storage for development
export const storage = {
  receipts: new Map(),
  
  async insertReceipt(receipt: any) {
    const id = `receipt-${Date.now()}`;
    const newReceipt = {
      id,
      ...receipt,
      createdAt: new Date(),
    };
    this.receipts.set(id, newReceipt);
    return newReceipt;
  },

  async getReceipt(id: string) {
    return this.receipts.get(id) || null;
  },

  async getAllReceipts() {
    return Array.from(this.receipts.values());
  },

  async updateReceipt(id: string, updates: any) {
    const existing = this.receipts.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    this.receipts.set(id, updated);
    return updated;
  },

  async deleteReceipt(id: string) {
    return this.receipts.delete(id);
  }
};
