export const redactPII = (text: string): string => {
  // Redact PAN/PII: crude patterns for card numbers, emails, phones
  return text
    .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{1,4}\b/g, "[REDACTED_CARD]")
    .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED_EMAIL]")
    .replace(/\b\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, "[REDACTED_PHONE]");
};

export const categorizationPrompt = (ocrText: string) => `
You are a financial transaction categorizer.

Rules:
- Do not output any PAN/PII. If present, replace with placeholders.
- Choose one primary category and optionally a secondary.
- Return compact JSON with fields: {"category","confidence","reasoning"}.

Receipt Text (sanitized):
${redactPII(ocrText)}
`;


