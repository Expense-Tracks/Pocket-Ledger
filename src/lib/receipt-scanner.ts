import { createWorker } from 'tesseract.js';

export async function scanReceipt(imageFile: File): Promise<{
  items: Array<{ name: string; price: number; quantity: number }>;
  tax: number;
  taxPercent: number | null;
  tip: number;
  total: number;
}> {
  try {
    // Create Tesseract worker with English + Indonesian support
    const worker = await createWorker(['eng', 'ind']);
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    
    // Terminate worker to free memory
    await worker.terminate();
    
    if (!text) {
      throw new Error('No text detected in receipt');
    }

    return parseReceiptText(text);
  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
}

function parseReceiptText(text: string): {
  items: Array<{ name: string; price: number; quantity: number }>;
  tax: number;
  taxPercent: number | null;
  tip: number;
  total: number;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items: Array<{ name: string; price: number; quantity: number }> = [];
  let tax = 0;
  let taxPercent: number | null = null;
  let tip = 0;
  let total = 0;

  // Enhanced regex patterns for better accuracy
  // Supports: $12.34, €10,50, 48,637 (IDR thousands), 250.129, 1234, 1,234.56
  // Requires at least 2 digits to avoid matching stray single digits (e.g., "No Customer :3")
  // Uses global flag so we can find the rightmost (last) price on each line
  const pricePattern = /(?:[$€£¥₹Rp]\s*)?(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{1,2})?)(?:\s*[$€£¥₹])?(?:\s|$)/g;
  const percentPattern = /(\d+(?:\.\d+)?)\s*%/;
  const taxPattern = /\b(tax|vat|gst|hst|sales\s*tax|tax\s*amount|pajak|ppn)\b/i;
  const tipPattern = /\b(tip|gratuity|service\s*\.?\s*charge|serv\s*\.?\s*charge|service\s*fee)\b/i;
  const totalPattern = /\b(total|amount\s*due|balance|grand\s*total|net\s*total|final\s*total)\b/i;
  const subtotalPattern = /\b(subtotal|sub\s*total|sub-total|items\s*:\s*\d+)\b/i;
  // Supports: "2x Pizza", "Pizza x 2", "2 nasi goreng" (leading number without x)
  const itemQuantityPattern = /^(\d+)\s*[xX×]\s*(.+)|(.+?)\s+[xX×]\s*(\d+)|^(\d+)\s+(.+)/;
  
  // Keywords to skip (not items) - more precise to avoid false positives
  const skipPatterns = /^(subtotal|sub\s*total|discount|change\b|cash\b|credit\s*card|debit\s*card|debit\s*mdr|payment|visa|mastercard|amex|total|balance|thank|receipt\s*(no|#)|date\b|time\b|server|table|order|before\s*rounding|rounding|items\s*:|no\s*customer|customer|chasier|cashier|kasir)/i;

  // Lines that look like receipt headers/metadata (dates, reference numbers, staff names)
  const headerPatterns = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|^[a-z]?\s*\/\d+|^\w+\s+\d{4,}$/i;

  let foundSubtotal = false;
  let subtotalValue = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find the LAST (rightmost) price on the line, since prices are typically right-aligned
    // and leading numbers are often quantities
    const priceMatches = [...line.matchAll(pricePattern)];
    const priceMatch = priceMatches.length > 0 ? priceMatches[priceMatches.length - 1] : null;
    
    if (!priceMatch) continue;

    // Clean and parse price - remove both commas and periods used as thousands separators
    let priceStr = priceMatch[1];
    // Determine if comma or period is used as decimal separator vs thousands separator
    // If format is like 48,637 or 250,150 (comma followed by 3 digits at end) -> comma is thousands sep
    // If format is like 22.739 or 250.129 (period followed by 3 digits at end) -> period is thousands sep
    // If format is like 12.34 or 10,50 (followed by 2 digits at end) -> decimal separator
    const lastSep = priceStr.match(/[,\.](\d+)$/);
    if (lastSep && lastSep[1].length === 3) {
      // Thousands separator - remove all commas and periods
      priceStr = priceStr.replace(/[,\.]/g, '');
    } else {
      // Decimal separator - remove thousands separators, keep last as decimal
      const parts = priceStr.split(/[,\.]/);
      if (parts.length > 2) {
        // e.g., 1,234.56 or 1.234,56
        const decimalPart = parts.pop()!;
        priceStr = parts.join('') + '.' + decimalPart;
      } else if (parts.length === 2) {
        priceStr = parts[0] + '.' + parts[1];
      }
    }
    const price = parseFloat(priceStr);
    
    // Skip invalid prices: must be a meaningful amount (at least 2 digits originally)
    // This filters out stray single digits like "No Customer :3"
    if (isNaN(price) || price <= 0 || priceMatch[1].replace(/[,\.]/g, '').length < 2) continue;

    const beforePrice = line.substring(0, line.indexOf(priceMatch[0])).trim();

    // Check for tax (including VAT with percentage)
    if (taxPattern.test(line)) {
      tax = price;
      const percentMatch = line.match(percentPattern);
      if (percentMatch) {
        taxPercent = parseFloat(percentMatch[1]);
      }
      continue;
    }

    // Check for tip
    if (tipPattern.test(line)) {
      tip = price;
      continue;
    }

    // Check for total
    if (totalPattern.test(line)) {
      total = price;
      continue;
    }

    // Check for subtotal (including "Items : 8  227,390" format)
    if (subtotalPattern.test(line)) {
      foundSubtotal = true;
      subtotalValue = price;
      continue;
    }

    // Skip non-item lines (rounding, before rounding, debit mdr, etc.)
    if (skipPatterns.test(line)) {
      continue;
    }

    // Skip receipt header/metadata lines (dates, reference numbers, staff codes)
    if (headerPatterns.test(line)) {
      continue;
    }

    // Skip lines after subtotal that aren't tax/tip/total
    if (foundSubtotal && !taxPattern.test(line) && !tipPattern.test(line) && !totalPattern.test(line)) {
      continue;
    }

    // Parse potential item
    if (beforePrice && !skipPatterns.test(beforePrice)) {
      let quantity = 1;
      let name = beforePrice;

      // Check for quantity pattern (supports "2x Pizza", "Pizza x 2", and "2 nasi goreng")
      const qtyMatch = beforePrice.match(itemQuantityPattern);
      if (qtyMatch) {
        if (qtyMatch[1] && qtyMatch[2]) {
          // "2x Pizza" format
          quantity = parseInt(qtyMatch[1]) || 1;
          name = qtyMatch[2].trim();
        } else if (qtyMatch[3] && qtyMatch[4]) {
          // "Pizza x 2" format
          quantity = parseInt(qtyMatch[4]) || 1;
          name = qtyMatch[3].trim();
        } else if (qtyMatch[5] && qtyMatch[6]) {
          // "2 nasi goreng" format (leading number without x)
          quantity = parseInt(qtyMatch[5]) || 1;
          name = qtyMatch[6].trim();
        }
      }

      // Additional validation: name should have at least 2 characters
      if (name.length >= 2) {
        items.push({
          name,
          price: quantity > 1 ? price / quantity : price,
          quantity,
        });
      }
    }
  }

  // Calculate tax percent if not found but we have subtotal and tax
  if (taxPercent === null && subtotalValue > 0 && tax > 0) {
    taxPercent = Math.round((tax / subtotalValue) * 100);
  }

  // If total not found, calculate it
  if (total === 0 && items.length > 0) {
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    total = itemsTotal + tax + tip;
  }

  return { items, tax, taxPercent, tip, total };
}
