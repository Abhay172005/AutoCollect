const { parsePendingBillsPdf } = require('./services/pdfParser');

const testString = `
ABHISHEK STEELS LUDHIANA G/000802 27-Mar-26 30 35 414,219.00 414,219.00 414,219.00
ADITYA ENERGY VENTURES LUDHIANA G/000087 24-Apr-26 30 7 965,332.00 365,953.00 365,953.00
`;

// Expose the internal functions for testing by temporarily requiring them directly if needed,
// but let's just write the regex test here.

const datePattern = /(\d{1,2}[\-\/\.][A-Za-z]{3}[\-\/\.]\d{2,4}|\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/;

const lines = testString.split('\n').filter(Boolean);
lines.forEach(line => {
  console.log('Line:', line);
  const match = line.match(datePattern);
  console.log('Match date:', match ? match[0] : 'None');
});

// Let's test the fallback parser logic which was also updated
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[₹,\s]/g, '').replace(/Dr|Cr/gi, '').trim();
  return parseFloat(cleaned) || 0;
}

const billPattern = /([A-Za-z\-\/]+\d+[\w\-\/]*)\s+(\d{1,2}[\-\/\.][A-Za-z]{3}[\-\/\.]\d{2,4}|\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/;

lines.forEach(line => {
    const match = line.match(billPattern);
    console.log('Bill Pattern Match:', match ? match[1] + ' and ' + match[2] : 'None');
});

