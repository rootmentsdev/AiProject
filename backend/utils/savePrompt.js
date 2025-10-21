const Prompt = require('../models/promptModel');
const dsrPrompts = require('../config/dsrPrompts');

async function savePromptOnStartup() {
  try {
    // Get the DSR analysis prompt template
    const promptTemplate = dsrPrompts.getDSRAnalysisPrompt('[DSR_DATA_PLACEHOLDER]');
    
    // Check if prompt already exists
    const existingPrompt = await Prompt.findOne({ name: 'DSR_ANALYSIS_PROMPT' });
    
    if (existingPrompt) {
      // Update existing prompt
      existingPrompt.promptText = promptTemplate;
      existingPrompt.updatedAt = Date.now();
      await existingPrompt.save();
      console.log("✅ DSR Analysis Prompt updated in MongoDB");
    } else {
      // Create new prompt
      const newPrompt = new Prompt({
        name: 'DSR_ANALYSIS_PROMPT',
        promptText: promptTemplate,
        description: 'Prompt template for analyzing Daily Sales Report (DSR) data for Suitor Guy Kerala stores. Identifies bad performing stores and provides actionable recommendations.',
        category: 'DSR_ANALYSIS',
        version: '1.0'
      });
      
      await newPrompt.save();
      console.log("✅ DSR Analysis Prompt saved to MongoDB");
    }
    
    // Display prompt info
    const savedPrompt = await Prompt.findOne({ name: 'DSR_ANALYSIS_PROMPT' });
    console.log("📝 Prompt Details:");
    console.log("   - Name:", savedPrompt.name);
    console.log("   - Category:", savedPrompt.category);
    console.log("   - Version:", savedPrompt.version);
    console.log("   - Length:", savedPrompt.promptText.length, "characters");
    console.log("   - Last Updated:", savedPrompt.updatedAt);
    
  } catch (error) {
    console.error("❌ Error saving prompt to MongoDB:", error.message);
  }
}

module.exports = savePromptOnStartup;

