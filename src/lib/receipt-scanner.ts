export async function scanReceipt(imageFile: File): Promise<{
  items: Array<{ name: string; price: number; quantity: number }>;
  tax: number;
  taxPercent: number | null;
  tip: number;
  total: number;
}> {
  const apiKey = import.meta.env.VITE_OCR_API_KEY || 'K87899142388957';
  
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('apikey', apiKey);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (!result.IsErroredOnProcessing && result.ParsedResults?.[0]?.ParsedText) {
      const text = result.ParsedResults[0].ParsedText;
      return parseReceiptText(text);
    }
    
    throw new Error('OCR processing failed');
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

  // Regex patterns
  const pricePattern = /\$?\d+\.\d{2}/;
  const percentPattern = /(\d+(?:\.\d+)?)\s*%/;
  const taxPattern = /tax/i;
  const tipPattern = /tip|gratuity/i;
  const totalPattern = /total|amount/i;

  for (const line of lines) {
    const priceMatch = line.match(pricePattern);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[0].replace('$', ''));
    const beforePrice = line.substring(0, line.indexOf(priceMatch[0])).trim();

    if (taxPattern.test(line)) {
      tax = price;
      // Check if there's a percentage in the line
      const percentMatch = line.match(percentPattern);
      if (percentMatch) {
        taxPercent = parseFloat(percentMatch[1]);
      }
    } else if (tipPattern.test(line)) {
      tip = price;
    } else if (totalPattern.test(line)) {
      total = price;
    } else if (beforePrice) {
      const qtyMatch = beforePrice.match(/(\d+)\s*x|x\s*(\d+)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1] || qtyMatch[2]) : 1;
      const name = beforePrice.replace(/(\d+)\s*x|x\s*(\d+)/gi, '').trim();

      if (name) {
        items.push({
          name,
          price: price / quantity,
          quantity,
        });
      }
    }
  }

  return { items, tax, taxPercent, tip, total };
}
