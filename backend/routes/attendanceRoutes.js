const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Get attendance data from Google Sheet
router.get('/attendance', attendanceController.getAttendance);

// Export attendance data
router.get('/attendance/export', attendanceController.exportAttendance);

// Test endpoint to check sheet access
router.get('/attendance/test-access', async (req, res) => {
  try {
    const axios = require('axios');
    const SHEET_ID = '1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg';
    const GID = '848974343';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    
    console.log('\n🧪 Testing Google Sheet Access...');
    console.log('📍 URL:', csvUrl);
    
    const response = await axios.get(csvUrl, {
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    res.json({
      status: response.status,
      statusText: response.statusText,
      accessible: response.status === 200,
      message: response.status === 200 
        ? '✅ Sheet is accessible!' 
        : response.status === 401 
          ? '❌ Sheet is private. Please make it public (Share → Anyone with link → Viewer)'
          : response.status === 404
            ? '❌ Sheet not found. Check Sheet ID and GID'
            : response.status === 400
              ? '❌ Bad Request - GID might be incorrect'
              : `❌ Unexpected error: ${response.statusText}`,
      csvUrl: csvUrl
    });
    
  } catch (error) {
    res.json({
      accessible: false,
      error: error.message,
      message: '❌ Failed to test sheet access'
    });
  }
});

// Helper endpoint to test specific month GID
router.get('/attendance/test-month/:month', async (req, res) => {
  try {
    const axios = require('axios');
    const attendanceModel = require('../models/attendanceModel');
    const month = req.params.month.toUpperCase();
    const gid = attendanceModel.MONTH_GIDS[month];
    
    if (!gid) {
      return res.json({
        success: false,
        message: `❌ No GID configured for ${month}`,
        availableMonths: Object.keys(attendanceModel.MONTH_GIDS)
      });
    }
    
    const SHEET_ID = '1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
    
    console.log(`\n🧪 Testing ${month} tab (GID: ${gid})...`);
    
    const response = await axios.get(csvUrl, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const success = response.status === 200;
    console.log(`📊 ${month} Status: ${response.status} - ${success ? '✅ OK' : '❌ FAILED'}`);
    
    res.json({
      month: month,
      gid: gid,
      status: response.status,
      accessible: success,
      message: success 
        ? `✅ ${month} tab is accessible!` 
        : response.status === 400
          ? `❌ GID '${gid}' is INCORRECT for ${month}. Please update it in backend/models/attendanceModel.js`
          : response.status === 401
            ? '❌ Sheet is private'
            : `❌ Error: ${response.statusText}`,
      csvUrl: csvUrl,
      instructions: !success ? [
        `1. Open: https://docs.google.com/spreadsheets/d/1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg/edit`,
        `2. Click on the "${month}2025" or "${month}" tab at the bottom`,
        `3. Look at the URL - it will show #gid=XXXXXXXXX`,
        `4. Copy the number after gid=`,
        `5. Update MONTH_GIDS['${month}'] in backend/models/attendanceModel.js`
      ] : null
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Test ALL month GIDs at once
router.get('/attendance/test-all-months', async (req, res) => {
  try {
    const axios = require('axios');
    const attendanceModel = require('../models/attendanceModel');
    const SHEET_ID = '1AzQnOwo4clqIErrJGwz5D08juavUbiH2NYE6SLEKTBg';
    
    console.log('\n🧪 Testing ALL month tabs...\n');
    
    const results = [];
    
    for (const [month, gid] of Object.entries(attendanceModel.MONTH_GIDS)) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
      
      try {
        const response = await axios.get(csvUrl, {
          timeout: 5000,
          validateStatus: () => true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const accessible = response.status === 200;
        const status = accessible ? '✅' : '❌';
        
        console.log(`${status} ${month.padEnd(12)} GID: ${String(gid).padEnd(12)} Status: ${response.status}`);
        
        results.push({
          month,
          gid,
          status: response.status,
          accessible,
          message: accessible ? 'OK' : response.status === 400 ? 'WRONG GID' : 'ERROR'
        });
      } catch (error) {
        console.log(`❌ ${month.padEnd(12)} GID: ${String(gid).padEnd(12)} ERROR: ${error.message}`);
        results.push({
          month,
          gid,
          accessible: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.accessible).length;
    const failCount = results.length - successCount;
    
    console.log(`\n📊 Summary: ${successCount} OK, ${failCount} FAILED\n`);
    
    res.json({
      success: true,
      summary: {
        total: results.length,
        accessible: successCount,
        failed: failCount
      },
      results: results,
      instructions: failCount > 0 ? [
        'For each FAILED month:',
        '1. Open your Google Sheet',
        '2. Click on that month\'s tab',
        '3. Copy the GID from URL (#gid=XXXXX)',
        '4. Update in backend/models/attendanceModel.js'
      ] : null
    });
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

