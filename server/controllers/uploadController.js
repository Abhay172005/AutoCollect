const { parsePendingBillsPdf } = require('../services/pdfParser');
const { parsePendingBillsExcel } = require('../services/excelParser');
const { compareBills, syncParties } = require('../services/billComparison');
const UploadHistory = require('../models/UploadHistory');
const path = require('path');

// @desc    Upload and extract PDF/Excel (Step 1)
// @route   POST /api/upload/extract
exports.uploadPdfExtract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    let extractedBills = [];
    
    if (ext === '.pdf') {
      extractedBills = await parsePendingBillsPdf(filePath);
    } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      extractedBills = await parsePendingBillsExcel(filePath);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file format' });
    }

    if (!extractedBills || extractedBills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No bill data could be extracted from the file. Please check the format.'
      });
    }

    // Calculate preview stats
    const totalRows = extractedBills.length;
    const billNumbers = new Set();
    let duplicateRows = 0;
    
    // Simplistic validation: Check for missing critical fields
    let validRows = 0;
    let parsingErrors = 0;
    
    extractedBills.forEach(bill => {
      if (billNumbers.has(bill.billNumber)) {
        duplicateRows++;
      } else {
        billNumbers.add(bill.billNumber);
      }
      
      if (bill.partyName && bill.billNumber && bill.billAmount != null) {
        validRows++;
      } else {
        parsingErrors++;
      }
    });

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        stats: {
          totalRows,
          validRows,
          duplicateRows,
          parsingErrors
        },
        extractedBills
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm and import extracted PDF data (Step 2)
// @route   POST /api/upload/confirm
exports.uploadPdfConfirm = async (req, res) => {
  try {
    const { fileName, extractedBills, stats } = req.body;

    if (!extractedBills || !Array.isArray(extractedBills) || extractedBills.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide extracted bills data' });
    }

    // Create pending UploadHistory
    const uploadHistory = new UploadHistory({
      merchantId: req.user.id,
      fileName: fileName || 'Unknown PDF',
      totalRows: stats?.totalRows || extractedBills.length,
      validRows: stats?.validRows || extractedBills.length,
      duplicateRows: stats?.duplicateRows || 0,
      parsingErrors: stats?.parsingErrors || 0,
      status: 'Pending'
    });
    await uploadHistory.save();

    const uploadBatch = uploadHistory._id.toString();

    // Sync parties (auto-create if not existing)
    const partySync = await syncParties(extractedBills, req.user.id);

    // Compare with existing bills
    const comparison = await compareBills(extractedBills, uploadBatch, req.user.id);
    
    // Update UploadHistory status
    uploadHistory.status = 'Imported';
    await uploadHistory.save();

    res.json({
      success: true,
      data: {
        uploadBatch,
        comparison,
        partySync
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload manually entered bills (no PDF)
// @route   POST /api/upload/manual
exports.uploadManual = async (req, res) => {
  try {
    const { bills } = req.body;

    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide bill data' });
    }

    const uploadBatch = `manual-${Date.now()}`;
    const partySync = await syncParties(bills, req.user.id);
    const comparison = await compareBills(bills, uploadBatch, req.user.id);

    res.json({
      success: true,
      data: {
        uploadBatch,
        totalExtracted: bills.length,
        comparison,
        partySync
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
