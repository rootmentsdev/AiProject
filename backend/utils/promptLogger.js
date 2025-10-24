const fs = require('fs');
const path = require('path');

/**
 * Save AI prompts and responses for auditing and improvement
 */
class PromptLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs/prompts');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Save prompt and response to file
   * @param {string} prompt - The prompt sent to AI
   * @param {Object} response - The AI response
   * @param {Object} metadata - Additional metadata
   */
  async savePromptLog(prompt, response, metadata = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `prompt_${timestamp}.json`;
      const filepath = path.join(this.logsDir, filename);

      const logData = {
        timestamp: new Date().toISOString(),
        metadata: metadata,
        prompt: {
          content: prompt,
          length: prompt.length
        },
        response: {
          content: response,
          length: JSON.stringify(response).length
        }
      };

      fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
      console.log(`✅ Prompt logged to: ${filename}`);
      
      return filepath;
    } catch (error) {
      console.error('❌ Failed to save prompt log:', error.message);
      return null;
    }
  }

  /**
   * Save prompt template to config
   * @param {string} templateName - Name of the template
   * @param {string} template - The template content
   */
  async savePromptTemplate(templateName, template) {
    try {
      const templatesDir = path.join(__dirname, '../config/promptTemplates');
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      const filename = `${templateName}_${Date.now()}.txt`;
      const filepath = path.join(templatesDir, filename);

      fs.writeFileSync(filepath, template);
      console.log(`✅ Template saved to: ${filename}`);
      
      return filepath;
    } catch (error) {
      console.error('❌ Failed to save template:', error.message);
      return null;
    }
  }

  /**
   * Get recent prompt logs
   * @param {number} limit - Number of recent logs to retrieve
   * @returns {Array} Array of log files
   */
  getRecentLogs(limit = 10) {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.startsWith('prompt_'))
        .sort()
        .reverse()
        .slice(0, limit);

      return files.map(file => {
        const filepath = path.join(this.logsDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(content);
      });
    } catch (error) {
      console.error('❌ Failed to read logs:', error.message);
      return [];
    }
  }
}

module.exports = new PromptLogger();

