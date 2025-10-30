const lossOfSaleModel = require('../models/lossOfSaleModel');
const dsrModel = require('../models/dsrModel');

class LossOfSaleController {
  /**
   * Get loss of sale data for DSR date
   */
  async getLossOfSaleForDSRDate(req, res) {
    try {
      console.log('📊 Fetching Loss of Sale data for DSR date...');

      // Step 1: Get DSR date from DSR sheet
      const dsrSheetData = await dsrModel.fetchSheetData();
      const dsrDate = dsrSheetData.date;
      console.log(`📅 DSR Date: ${dsrDate}`);

      // Step 2: Fetch all stores loss of sale data
      console.log('🔍 Fetching data from all stores...');
      const result = await lossOfSaleModel.fetchAllStoresData();

      // Step 3: Filter by DSR date
      const filteredData = lossOfSaleModel.filterByDate(result.data, dsrDate);
      console.log(`✅ Found ${filteredData.length} loss of sale entries for ${dsrDate}`);

      // Step 4: Group by store
      const groupedByStore = lossOfSaleModel.groupByStore(filteredData);

      // Step 5: Analyze reasons
      const reasonAnalysis = lossOfSaleModel.analyzeReasons(filteredData);

      // Step 6: Calculate statistics
      const stats = {
        totalEntries: filteredData.length,
        storesWithLoss: Object.keys(groupedByStore).length,
        topReasons: reasonAnalysis.slice(0, 5),
        storeBreakdown: Object.entries(groupedByStore).map(([store, entries]) => ({
          store,
          count: entries.length,
          reasons: lossOfSaleModel.analyzeReasons(entries)
        }))
      };

      res.json({
        success: true,
        date: dsrDate,
        data: filteredData,
        groupedByStore,
        stats,
        errors: result.errors
      });

    } catch (error) {
      console.error('❌ Error fetching loss of sale:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get loss of sale data for specific store and date
   */
  async getLossOfSaleByStore(req, res) {
    try {
      const { storeName } = req.params;
      const { date } = req.query;

      console.log(`📊 Fetching Loss of Sale for ${storeName}...`);

      // Fetch store data
      const storeData = await lossOfSaleModel.fetchStoreData(storeName);

      // Filter by date if provided
      let filteredData = storeData;
      if (date) {
        filteredData = lossOfSaleModel.filterByDate(storeData, date);
      }

      // Analyze reasons
      const reasonAnalysis = lossOfSaleModel.analyzeReasons(filteredData);

      res.json({
        success: true,
        store: storeName,
        date: date || 'all',
        totalEntries: filteredData.length,
        data: filteredData,
        reasonAnalysis
      });

    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get loss of sale data for all stores (no date filter)
   */
  async getAllLossOfSale(req, res) {
    try {
      console.log('📊 Fetching all Loss of Sale data...');

      const result = await lossOfSaleModel.fetchAllStoresData();

      // Group by store
      const groupedByStore = lossOfSaleModel.groupByStore(result.data);

      // Analyze reasons
      const reasonAnalysis = lossOfSaleModel.analyzeReasons(result.data);

      res.json({
        success: true,
        totalEntries: result.data.length,
        data: result.data,
        groupedByStore,
        reasonAnalysis,
        errors: result.errors
      });

    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get loss of sale summary for date range
   */
  async getLossOfSaleSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;

      console.log(`📊 Fetching Loss of Sale summary from ${startDate} to ${endDate}...`);

      // Fetch all data
      const result = await lossOfSaleModel.fetchAllStoresData();

      // Filter by date range if provided
      let filteredData = result.data;
      if (startDate && endDate) {
        filteredData = lossOfSaleModel.filterByDateRange(result.data, startDate, endDate);
      }

      // Group by store
      const groupedByStore = lossOfSaleModel.groupByStore(filteredData);

      // Analyze reasons
      const reasonAnalysis = lossOfSaleModel.analyzeReasons(filteredData);

      // Calculate store statistics
      const storeStats = Object.entries(groupedByStore).map(([store, entries]) => ({
        store,
        totalLoss: entries.length,
        reasons: lossOfSaleModel.analyzeReasons(entries).slice(0, 3)
      })).sort((a, b) => b.totalLoss - a.totalLoss);

      res.json({
        success: true,
        dateRange: { startDate, endDate },
        totalEntries: filteredData.length,
        storesAffected: Object.keys(groupedByStore).length,
        topReasons: reasonAnalysis.slice(0, 10),
        storeStats,
        errors: result.errors
      });

    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new LossOfSaleController();

