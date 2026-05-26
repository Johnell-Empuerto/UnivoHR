const aiService = require("../services/ai.service");

const chat = async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return res.status(400).json({ message: "Question is required" });
    }

    const result = await aiService.processChat({
      user: req.user,
      question: question.trim(),
      sessionId: sessionId || null,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[AIController] chat error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await aiService.getSessions({
      user_id: req.user.id,
      status: status || "ACTIVE",
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json(result);
  } catch (error) {
    console.error("[AIController] getSessions error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await aiService.getSessionById(sessionId, req.user.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const messages = await aiService.getMessagesBySession(sessionId, req.user.id);
    res.json({ data: messages, session });
  } catch (error) {
    console.error("[AIController] getMessages error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const deleted = await aiService.deleteSession(sessionId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ message: "Session not found or already deleted" });
    }

    res.json({ message: "Session deleted", data: deleted });
  } catch (error) {
    console.error("[AIController] deleteSession error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { messageId, rating, comment } = req.body;

    if (!messageId || !rating) {
      return res.status(400).json({ message: "messageId and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const feedback = await aiService.createFeedback({
      message_id: messageId,
      user_id: req.user.id,
      rating,
      comment: comment || null,
    });

    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error("[AIController] submitFeedback error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  chat,
  getSessions,
  getMessages,
  deleteSession,
  submitFeedback,
};
