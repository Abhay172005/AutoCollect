const xlsx = require('xlsx');

const parsePendingBillsExcel = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays to handle dynamic header row position
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
    
    const bills = [];
    let headerRowIndex = -1;
    let headers = [];

    // Find the header row (look for 'BillNo', 'Bill Date', 'Party', etc.)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const rowString = row.join(' ').toLowerCase();
      if (rowString.includes('billno') || rowString.includes('bill no') || (rowString.includes('party') && rowString.includes('city'))) {
        headerRowIndex = i;
        headers = row.map(h => (h || '').toString().toLowerCase().trim());
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error("Could not find the header row in the spreadsheet. Make sure it contains 'Party', 'City', 'BillNo', etc.");
    }

    // Determine column indices
    const colIdx = {
      party: headers.findIndex(h => h.includes('party')),
      city: headers.findIndex(h => h.includes('city')),
      billNo: headers.findIndex(h => h.includes('billno') || h === 'bill no' || h.includes('bill number')),
      billDate: headers.findIndex(h => h.includes('date')),
      creditDays: headers.findIndex(h => h.includes('cr.days') || h.includes('credit')),
      days: headers.findIndex(h => h === 'days' || h.includes('overdue')),
      billAmt: headers.findIndex(h => h.includes('bill amt') || h.includes('bill amount')),
      balAmt: headers.findIndex(h => h.includes('bal amt') || h.includes('balance')),
      cumAmt: headers.findIndex(h => h.includes('cumm.amt') || h.includes('cumulative'))
    };

    let currentParty = '';
    let currentCity = '';

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // Extract values safely
      const getVal = (idx) => (idx !== -1 && row[idx] !== undefined) ? row[idx].toString().trim() : '';
      
      let partyName = getVal(colIdx.party);
      let city = getVal(colIdx.city);
      const billNumber = getVal(colIdx.billNo);
      
      if (partyName) currentParty = partyName;
      if (city) currentCity = city;

      // Only process rows that have a bill number and are not totals
      if (!billNumber || billNumber.toLowerCase().includes('total')) continue;

      // Parse amounts (remove commas)
      const parseAmount = (val) => {
        if (!val) return 0;
        const cleaned = val.replace(/[₹,\s]/g, '').replace(/Dr|Cr/gi, '');
        return parseFloat(cleaned) || 0;
      };

      const billAmt = parseAmount(getVal(colIdx.billAmt));
      const balAmt = parseAmount(getVal(colIdx.balAmt));
      const cumAmt = parseAmount(getVal(colIdx.cumAmt));
      const creditDays = parseInt(getVal(colIdx.creditDays)) || 30;
      const days = parseInt(getVal(colIdx.days)) || 0;

      // Parse date (xlsx converts dates to strings if raw:false, e.g. "03/27/26" or "27-Mar-26")
      let billDate = new Date();
      const dateStr = getVal(colIdx.billDate);
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          billDate = parsed;
        } else {
           // Try custom parsing for DD-MMM-YY
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
             if (!isNaN(date.getTime())) billDate = date;
           }
        }
      }

      bills.push({
        partyName: partyName || currentParty,
        city: city || currentCity,
        billNumber,
        billDate,
        creditDays,
        days,
        billAmount: billAmt,
        balanceAmount: balAmt,
        cumulativeAmount: cumAmt
      });
    }

    if (bills.length === 0) {
      throw new Error("No bill data found in spreadsheet.");
    }

    return bills;
  } catch (error) {
    console.error('Excel Parse Error:', error);
    throw new Error(`Failed to parse spreadsheet: ${error.message}`);
  }
};

module.exports = { parsePendingBillsExcel };
