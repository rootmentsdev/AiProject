const Prompt = require('../models/promptModel');

class PromptController {
  // Get all prompts
  async getAllPrompts(req, res) {
    try {
      const prompts = await Prompt.find().sort({ updatedAt: -1 });
      res.json({
        success: true,
        count: prompts.length,
        prompts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to fetch prompts: ${error.message}`
      });
    }
  }

  // Get a specific prompt by name
  async getPromptByName(req, res) {
    try {
      const { name } = req.params;
      const prompt = await Prompt.findOne({ name });
      
      if (!prompt) {
        return res.status(404).json({
          success: false,
          error: `Prompt '${name}' not found`
        });
      }
      
      res.json({
        success: true,
        prompt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to fetch prompt: ${error.message}`
      });
    }
  }

  // Create a new prompt
  async createPrompt(req, res) {
    try {
      const { name, promptText, description, category, version } = req.body;
      
      if (!name || !promptText) {
        return res.status(400).json({
          success: false,
          error: 'Name and promptText are required'
        });
      }
      
      const newPrompt = new Prompt({
        name,
        promptText,
        description,
        category,
        version
      });
      
      await newPrompt.save();
      
      res.status(201).json({
        success: true,
        message: 'Prompt created successfully',
        prompt: newPrompt
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'A prompt with this name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: `Failed to create prompt: ${error.message}`
      });
    }
  }

  // Update an existing prompt
  async updatePrompt(req, res) {
    try {
      const { name } = req.params;
      const updates = req.body;
      
      const prompt = await Prompt.findOne({ name });
      
      if (!prompt) {
        return res.status(404).json({
          success: false,
          error: `Prompt '${name}' not found`
        });
      }
      
      // Update fields
      Object.keys(updates).forEach(key => {
        if (key !== 'name' && key !== '_id') { // Don't allow changing name or _id
          prompt[key] = updates[key];
        }
      });
      
      prompt.updatedAt = Date.now();
      await prompt.save();
      
      res.json({
        success: true,
        message: 'Prompt updated successfully',
        prompt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to update prompt: ${error.message}`
      });
    }
  }

  // Delete a prompt
  async deletePrompt(req, res) {
    try {
      const { name } = req.params;
      const prompt = await Prompt.findOneAndDelete({ name });
      
      if (!prompt) {
        return res.status(404).json({
          success: false,
          error: `Prompt '${name}' not found`
        });
      }
      
      res.json({
        success: true,
        message: `Prompt '${name}' deleted successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to delete prompt: ${error.message}`
      });
    }
  }
}

module.exports = new PromptController();

