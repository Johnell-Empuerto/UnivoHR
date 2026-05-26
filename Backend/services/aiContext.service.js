// In-memory conversation context store
// Keyed by sessionId, persists within the session's lifetime
const contextStore = new Map();

const getContext = (sessionId) => {
  return contextStore.get(sessionId) || null;
};

const setContext = (sessionId, context) => {
  contextStore.set(sessionId, {
    entities: context.entities || {},
    lastIntent: context.lastIntent || null,
    lastQuestion: context.lastQuestion || null,
    lastModule: context.lastModule || null,
    lastCutoffDates: context.lastCutoffDates || null,
    lastQuestionType: context.lastQuestionType || null,
    updatedAt: new Date().toISOString(),
  });
};

const updateContext = (sessionId, updates) => {
  const existing = getContext(sessionId) || { entities: {}, lastIntent: null, lastQuestion: null, lastModule: null, lastCutoffDates: null, lastQuestionType: null };
  const merged = {
    entities: { ...existing.entities, ...(updates.entities || {}) },
    lastIntent: updates.lastIntent !== undefined ? updates.lastIntent : existing.lastIntent,
    lastQuestion: updates.lastQuestion !== undefined ? updates.lastQuestion : existing.lastQuestion,
    lastModule: updates.lastModule !== undefined ? updates.lastModule : existing.lastModule,
    lastCutoffDates: updates.lastCutoffDates !== undefined ? updates.lastCutoffDates : existing.lastCutoffDates,
    lastQuestionType: updates.lastQuestionType !== undefined ? updates.lastQuestionType : existing.lastQuestionType,
    updatedAt: new Date().toISOString(),
  };
  contextStore.set(sessionId, merged);
  return merged;
};

const clearContext = (sessionId) => {
  contextStore.delete(sessionId);
};

// Cleanup old entries periodically (optional)
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const cleanup = () => {
  const now = Date.now();
  for (const [key, value] of contextStore.entries()) {
    if (value.updatedAt && (now - new Date(value.updatedAt).getTime()) > MAX_AGE_MS) {
      contextStore.delete(key);
    }
  }
};
setInterval(cleanup, 5 * 60 * 1000); // every 5 minutes

module.exports = {
  getContext,
  setContext,
  updateContext,
  clearContext,
};
