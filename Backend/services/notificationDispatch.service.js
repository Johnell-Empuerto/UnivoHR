const notificationRuleService = require("./notificationRule.service");
const logger = require("../utils/logger");

const canSendInApp = async (ruleKey) => {
  return notificationRuleService.canSendInApp(ruleKey);
};

const canSendEmail = async (ruleKey) => {
  return notificationRuleService.canSendEmail(ruleKey);
};

const sendInAppIfEnabled = async (ruleKey, notifyFn) => {
  const allowed = await canSendInApp(ruleKey);
  if (!allowed) {
    logger.info(`[notificationDispatch] In-app disabled for ${ruleKey}, skipping`);
    return null;
  }
  return notifyFn();
};

const sendEmailIfEnabled = async (ruleKey, emailFn) => {
  const allowed = await canSendEmail(ruleKey);
  if (!allowed) {
    logger.info(`[notificationDispatch] Email disabled for ${ruleKey}, skipping`);
    return null;
  }
  return emailFn();
};

module.exports = {
  canSendInApp,
  canSendEmail,
  sendInAppIfEnabled,
  sendEmailIfEnabled,
};
