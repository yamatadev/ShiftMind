import { Router } from 'express';
import { handleChat } from '../aria/handler.js';

const router = Router();

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required and must be a string' });
      return;
    }

    const history = Array.isArray(conversationHistory) ? conversationHistory : [];

    const result = await handleChat(message, history);
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      reply: 'I ran into an issue processing your request. Please try again.',
      actions: [],
    });
  }
});

export default router;
