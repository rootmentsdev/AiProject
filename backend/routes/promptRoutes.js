const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');

// Prompt Management Routes
router.get('/prompts', promptController.getAllPrompts);
router.get('/prompts/:name', promptController.getPromptByName);
router.post('/prompts', promptController.createPrompt);
router.put('/prompts/:name', promptController.updatePrompt);
router.delete('/prompts/:name', promptController.deletePrompt);


module.exports = router;

