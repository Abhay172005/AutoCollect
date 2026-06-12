const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Parse a Pending Bills PDF from accounting software.
 * Expected columns: Party Name, City, Bill Number, Bill Date, Credit Days, Days, Bill Amount, Balance Amount, Cumulative Amount
 * 
 * This parser handles standard Tally/accounting software Pending Bills report format.
 */
const parsePendingBillsPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    console.log('--- RAW PDF TEXT (FIRST 1000 CHARS) ---');
    console.log(text.substring(0, 1000));
    console.log('---------------------------------------');

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const bills = [];

    let currentParty = '';
    let currentCity = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip header lines and summary lines
      if (isHeaderLine(line) || isSummaryLine(line)) continue;

      // Try to extract bill data from the line
      const billData = extractBillFromLine(line, currentParty, currentCity);

      if (billData) {
        if (billData.partyName) currentParty = billData.partyName;
        if (billData.city) currentCity = billData.city;

        // Only add if we have a valid bill number
        if (billData.billNumber && billData.billNumber.trim()) {
          bills.push({
            partyName: billData.partyName || currentParty,
            city: billData.city || currentCity,
            billNumber: billData.billNumber.trim(),
            billDate: billData.billDate,
            creditDays: billData.creditDays || 30,
            days: billData.days || 0,
            billAmount: billData.billAmount || 0,
            balanceAmount: billData.balanceAmount || 0,
            cumulativeAmount: billData.cumulativeAmount || 0
          });
        }
      }
    }

    // If structured parsing didn't work well, try a fallback approach
    if (bills.length === 0) {
      return fallbackParse(text);
    }

    return bills;
  } catch (error) {
    console.error('PDF Parse Error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

/**
 * Check if a line is a header/title line
 */
function isHeaderLine(line) {
  const headerPatterns = [
    /pending\s*bills/i,
    /party\s*name/i,
    /bill\s*number/i,
    /particulars/i,
    /^date\s/i,
    /^sr\.?\s*no/i,
    /^\d{1,2}[\-\/]\w+[\-\/]\d{2,4}\s+to\s+/i,
    /page\s*\d+/i,
    /report/i
  ];
  return headerPatterns.some(p => p.test(line));
}

/**
 * Check if a line is a summary/total line
 */
function isSummaryLine(line) {
  const summaryPatterns = [
    /^total\b/i,
    /^grand\s*total/i,
    /^sub\s*total/i,
    /closing\s*balance/i
  ];
  return summaryPatterns.some(p => p.test(line));
}

/**
 * Try to extract bill data from a line
 */
function extractBillFromLine(line, currentParty, currentCity) {
  // Pattern: Look for date patterns and numeric values
  // Typical format: PartyName  City  BillNo  DD-MM-YYYY  CreditDays  Days  Amount  Balance  Cumulative

  // Try to match a line with bill number and date
  const datePattern = /(\d{1,2}[\-\/\.][A-Za-z]{3}[\-\/\.]\d{2,4}|\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/;
  const dateMatch = line.match(datePattern);

  if (!dateMatch) {
    // This might be a party name line
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.match(/^\d/) && !isSummaryLine(trimmedLine)) {
      return { partyName: trimmedLine, city: '' };
    }
    return null;
  }

  // Split by multiple spaces or tabs
  const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p);

  if (parts.length < 4) return null;

  // Find the date position
  let dateIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    if (datePattern.test(parts[i])) {
      dateIdx = i;
      break;
    }
  }

  if (dateIdx === -1) return null;

  // Extract data based on position relative to date
  const result = {
    partyName: currentParty,
    city: currentCity,
    billNumber: '',
    billDate: null,
    creditDays: 30,
    days: 0,
    billAmount: 0,
    balanceAmount: 0,
    cumulativeAmount: 0
  };

  // If there's text before the date, it could be party name, city, or bill number
  if (dateIdx >= 1) {
    // Check if first parts are party/city
    let billNoIdx = dateIdx - 1;
    result.billNumber = parts[billNoIdx];

    if (dateIdx >= 3) {
      result.partyName = parts[0];
      result.city = parts[1];
      result.billNumber = parts[dateIdx - 1];
    } else if (dateIdx >= 2) {
      // Could be party + bill or city + bill
      const firstPart = parts[0];
      if (firstPart.match(/^[A-Za-z\s&\.]+$/) && firstPart.length > 3) {
        result.partyName = firstPart;
      }
      result.billNumber = parts[dateIdx - 1];
    }
  }

  // Parse date
  result.billDate = parseDate(parts[dateIdx]);

  // Parse numeric values after date
  const numericParts = [];
  for (let i = dateIdx + 1; i < parts.length; i++) {
    const num = parseAmount(parts[i]);
    if (!isNaN(num)) {
      numericParts.push(num);
    }
  }

  // Assign numeric values: creditDays, days, billAmount, balanceAmount, cumulativeAmount
  if (numericParts.length >= 5) {
    result.creditDays = numericParts[0];
    result.days = numericParts[1];
    result.billAmount = numericParts[2];
    result.balanceAmount = numericParts[3];
    result.cumulativeAmount = numericParts[4];
  } else if (numericParts.length >= 4) {
    result.creditDays = numericParts[0];
    result.days = numericParts[1];
    result.billAmount = numericParts[2];
    result.balanceAmount = numericParts[3];
    result.cumulativeAmount = numericParts[3];
  } else if (numericParts.length >= 3) {
    result.creditDays = numericParts[0];
    result.billAmount = numericParts[1];
    result.balanceAmount = numericParts[2];
    result.cumulativeAmount = numericParts[2];
  } else if (numericParts.length >= 2) {
    result.billAmount = numericParts[0];
    result.balanceAmount = numericParts[1];
    result.cumulativeAmount = numericParts[1];
  }

  return result;
}

/**
 * Parse date string in various formats
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();

  // Try DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY or DD-MMM-YYYY
  const match = dateStr.match(/(\d{1,2})[\-\/\.]([a-zA-Z]{3}|\d{1,2})[\-\/\.](\d{2,4})/);
  if (match) {
    let [, day, monthRaw, year] = match;
    if (year.length === 2) year = '20' + year;
    let month = parseInt(monthRaw);
    if (isNaN(month)) {
       const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       month = monthNames.findIndex(m => m.toLowerCase() === monthRaw.toLowerCase()) + 1;
    }
    const date = new Date(parseInt(year), month - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try native Date parse
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Parse amount string, removing commas and currency symbols
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[₹,\s]/g, '').replace(/Dr|Cr/gi, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Fallback parser – tries a more lenient approach to extract bill data
 */
function fallbackParse(text) {
  const bills = [];
  const lines = text.split('\n');

  // Look for patterns: bill number (alphanumeric), date, amounts
  const billPattern = /([A-Za-z\-\/]+\d+[\w\-\/]*)\s+(\d{1,2}[\-\/\.][A-Za-z]{3}[\-\/\.]\d{2,4}|\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/;

  let currentParty = 'Unknown';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(billPattern);
    if (match) {
      const billNumber = match[1];
      const billDate = parseDate(match[2]);

      // Extract all numbers from the rest of the line
      const afterMatch = trimmed.substring(trimmed.indexOf(match[0]) + match[0].length);
      const numbers = afterMatch.match(/[\d,]+\.?\d*/g) || [];
      const amounts = numbers.map(n => parseAmount(n)).filter(n => n > 0);

      bills.push({
        partyName: currentParty,
        city: '',
        billNumber,
        billDate,
        creditDays: amounts.length > 0 ? amounts[0] : 30,
        days: amounts.length > 1 ? amounts[1] : 0,
        billAmount: amounts.length > 2 ? amounts[2] : 0,
        balanceAmount: amounts.length > 3 ? amounts[3] : amounts.length > 2 ? amounts[2] : 0,
        cumulativeAmount: amounts.length > 4 ? amounts[4] : amounts.length > 3 ? amounts[3] : 0
      });
    } else if (trimmed.match(/^[A-Za-z]/) && !isHeaderLine(trimmed) && !isSummaryLine(trimmed)) {
      // Potential party name line
      currentParty = trimmed.split(/\s{2,}/)[0].trim();
    }
  }

  return bills;
}

module.exports = { parsePendingBillsPdf };
