/**
 * Quick test script for Staff Performance API
 * Run: node backend/test-staff-performance.js
 */

const axios = require('axios');

console.log("\n" + "=".repeat(80));
console.log("🧪 TESTING STAFF PERFORMANCE API");
console.log("=".repeat(80));

async function testStaffPerformanceAPI() {
  try {
    const apiUrl = 'https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel';
    
    const params = {
      DateFrom: '2025-8-21',
      DateTo: '2025-8-21',
      LocationID: '0',
      UserID: '7777'
    };
    
    console.log("\n📊 Test Parameters:");
    console.log("   API URL:", apiUrl);
    console.log("   DateFrom:", params.DateFrom);
    console.log("   DateTo:", params.DateTo);
    console.log("   LocationID:", params.LocationID);
    console.log("   UserID:", params.UserID);
    
    console.log("\n🔄 Making API request...");
    
    const urlWithParams = new URL(apiUrl);
    Object.keys(params).forEach(key => {
      urlWithParams.searchParams.append(key, params[key]);
    });
    
    console.log("🌐 Full URL:", urlWithParams.toString());
    
    const response = await axios.post(urlWithParams.toString(), {}, {
      timeout: 30000,
      headers: {
        'User-Agent': 'DSR-Analysis-System/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log("\n✅ API REQUEST SUCCESSFUL!");
    console.log("=".repeat(80));
    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Type:", typeof response.data);
    
    let dataArray = response.data;
    
    // Handle different response structures
    if (response.data && response.data.dataSet && response.data.dataSet.data) {
      dataArray = response.data.dataSet.data;
      console.log("📊 Data Structure: dataSet.data");
    } else if (Array.isArray(response.data)) {
      dataArray = response.data;
      console.log("📊 Data Structure: Array");
    } else {
      console.log("📊 Data Structure: Unknown");
      console.log("📊 Response keys:", Object.keys(response.data).join(', '));
    }
    
    console.log("📊 Total Records:", dataArray.length);
    
    if (dataArray.length > 0) {
      console.log("\n📋 Sample Record (First Record):");
      console.log(JSON.stringify(dataArray[0], null, 2));
      
      // Group by location/store
      const storeData = {};
      dataArray.forEach(record => {
        const location = record.location || record.Location || record.LocationName || 'Unknown';
        if (!storeData[location]) {
          storeData[location] = {
            count: 0,
            totalWalkIns: 0,
            totalBills: 0
          };
        }
        storeData[location].count++;
        storeData[location].totalWalkIns += parseFloat(record.walkIns || record.WalkIns || 0);
        storeData[location].totalBills += parseFloat(record.bills || record.Bills || 0);
      });
      
      console.log("\n📊 Stores Found:");
      Object.entries(storeData).forEach(([storeName, data]) => {
        const convRate = data.totalWalkIns > 0 ? ((data.totalBills / data.totalWalkIns) * 100).toFixed(2) : 0;
        console.log(`   • ${storeName}: ${data.count} staff, ${data.totalWalkIns} walk-ins, ${data.totalBills} bills (${convRate}% conversion)`);
      });
      
      console.log("\n✅ SUCCESS! Staff performance data is available.");
      console.log("✅ The API is working correctly.");
      
    } else {
      console.log("\n⚠️  WARNING: API returned empty data");
      console.log("⚠️  This might mean:");
      console.log("   1. No data exists for this date (2025-8-21)");
      console.log("   2. LocationID '0' doesn't return all stores");
      console.log("   3. Try a different date that you know has data");
    }
    
    console.log("=".repeat(80));
    
  } catch (error) {
    console.error("\n❌ API REQUEST FAILED!");
    console.error("=".repeat(80));
    console.error("❌ Error:", error.message);
    
    if (error.code) {
      console.error("❌ Error Code:", error.code);
    }
    
    if (error.response) {
      console.error("❌ Response Status:", error.response.status);
      console.error("❌ Response Data:", error.response.data);
    } else if (error.request) {
      console.error("❌ No response received from server");
      console.error("❌ Possible reasons:");
      console.error("   1. API server is down");
      console.error("   2. Network/firewall blocking the request");
      console.error("   3. Incorrect API URL");
    } else {
      console.error("❌ Error setting up request:", error.message);
    }
    
    console.error("=".repeat(80));
    process.exit(1);
  }
}

// Run the test
testStaffPerformanceAPI()
  .then(() => {
    console.log("\n🎉 Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  });


