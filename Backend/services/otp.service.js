const smtpService = require("./smtp.service");
const redisClient = require("../config/redis");

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mask email for display
const maskEmail = (email) => {
  if (!email) return "your email";
  if (!email.includes("@")) return "your email";

  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
};

// Store OTP in Redis with expiration (5 minutes) and rate limit check
const storeOTP = async (userId, email, otp) => {
  const key = `otp:${userId}`;

  const existing = await redisClient.get(key);
  if (existing) {
    const data = JSON.parse(existing);
    const elapsed = (Date.now() - new Date(data.created_at).getTime()) / 1000;
    if (elapsed < 60) {
      throw new Error("Please wait 60 seconds before requesting another OTP");
    }
  }

  await redisClient.setEx(
    key,
    300,
    JSON.stringify({
      otp,
      email,
      attempts: 0,
      created_at: new Date().toISOString(),
    }),
  );
  return true;
};

// Get OTP with TTL in one Redis call
const getOTPWithTTL = async (userId) => {
  const key = `otp:${userId}`;
  const [data, ttl] = await Promise.all([
    redisClient.get(key),
    redisClient.ttl(key),
  ]);

  return {
    data: data ? JSON.parse(data) : null,
    ttl: ttl > 0 ? ttl : 0,
  };
};

// Get OTP from Redis
const getOTP = async (userId) => {
  const key = `otp:${userId}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

// Verify OTP
const verifyOTP = async (userId, userOTP) => {
  const { data: stored, ttl: remainingTTL } = await getOTPWithTTL(userId);

  if (!stored) {
    return {
      success: false,
      message: "OTP expired. Please request a new code.",
    };
  }

  if (stored.attempts >= 5) {
    await redisClient.del(`otp:${userId}`);
    return {
      success: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  if (stored.otp !== userOTP) {
    stored.attempts++;
    const ttl = remainingTTL > 0 ? remainingTTL : 300;
    await redisClient.setEx(`otp:${userId}`, ttl, JSON.stringify(stored));

    const remainingAttempts = 5 - stored.attempts;
    return {
      success: false,
      message:
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`
          : "No attempts remaining. Please request a new OTP.",
    };
  }

  await redisClient.del(`otp:${userId}`);
  return { success: true, message: "OTP verified successfully" };
};

// Delete OTP
const deleteOTP = async (userId) => {
  const key = `otp:${userId}`;
  await redisClient.del(key);
};

// Resend OTP with rate limit
const resendOTP = async (userId, email, userName) => {
  const otp = generateOTP();
  await storeOTP(userId, email, otp);
  await sendOTPEmail(email, otp, userName);
  return { success: true, message: "New OTP sent to your email" };
};

// Get masked email for frontend
const getMaskedEmail = async (userId) => {
  const stored = await getOTP(userId);
  if (stored && stored.email) {
    return maskEmail(stored.email);
  }
  return null;
};

const sendOTPEmail = async (email, otp, userName) => {
  console.log("[OTP] Preparing to send OTP email to:", email);
  console.log("[OTP] OTP code:", otp);
  console.log("[OTP] User name:", userName);

  const subject = "Login Verification Code - UnivoHR";

  //  UPDATED: Complete HTML template with UnivoHR branding
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>UnivoHR - Login Verification</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }
        
        .container {
          max-width: 560px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Header with gradient */
        .header {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          padding: 32px 24px;
          text-align: center;
        }
        
        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }
        
        .header-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin-top: 8px;
        }
        
        /* Content */
        .content {
          padding: 40px 32px;
        }
        
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
        }
        
        .message {
          color: #475569;
          margin-bottom: 32px;
          font-size: 16px;
        }
        
        /* OTP Code Box */
        .otp-box {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          margin: 24px 0;
          border: 1px solid #e2e8f0;
        }
        
        .otp-label {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #64748b;
          margin-bottom: 16px;
          font-weight: 600;
        }
        
        .otp-code {
          font-size: 56px;
          font-weight: 800;
          letter-spacing: 12px;
          color: #4F46E5;
          background: white;
          display: inline-block;
          padding: 16px 32px;
          border-radius: 16px;
          font-family: 'Courier New', monospace;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        
        .expiry {
          margin-top: 16px;
          font-size: 13px;
          color: #64748b;
        }
        
        /* Info Box */
        .info-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px 20px;
          border-radius: 12px;
          margin: 24px 0;
        }
        
        .info-box p {
          color: #92400e;
          font-size: 13px;
          margin: 0;
        }
        
        /* Footer */
        .footer {
          padding: 24px 32px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        
        .footer p {
          color: #64748b;
          font-size: 12px;
          margin: 4px 0;
        }
        
        .footer a {
          color: #4F46E5;
          text-decoration: none;
        }
        
        .footer a:hover {
          text-decoration: underline;
        }
        
        /* Button Style */
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white;
          padding: 12px 28px;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          margin-top: 16px;
        }
        
        hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 20px 0;
        }
        
        @media (max-width: 480px) {
          .content {
            padding: 28px 20px;
          }
          .otp-code {
            font-size: 40px;
            letter-spacing: 8px;
            padding: 12px 20px;
          }
          .greeting {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
       
        
        <!-- Content -->
        <div class="content">
          <div class="greeting">
            Hello, ${userName}! 
          </div>
          
          <div class="message">
            We received a request to log in to your UnivoHR account. Please use the verification code below to complete your login.
          </div>
          
          <!-- OTP Code -->
          <div class="otp-box">
            <div class="otp-label">Verification Code</div>
            <div class="otp-code">${otp}</div>
            <div class="expiry">
              This code will expire in <strong>5 minutes</strong>
            </div>
          </div>
          
          <div class="info-box">
            <p>
              <strong>Security Notice:</strong> If you didn't request this code, please ignore this email 
              and ensure your account is secure. Never share this code with anyone.
            </p>
          </div>
          
          <hr />
          
          <p style="font-size: 13px; color: #475569; text-align: center;">
            Having trouble? Contact your system administrator or HR department for assistance.
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>© ${new Date().getFullYear()} UnivoHR. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
          <p style="margin-top: 12px;">
            <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a> • <a href="#">Security</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log("[OTP] HTML length:", html.length);
    console.log("[OTP] Calling smtpService.sendEmail...");
    const result = await smtpService.sendEmail(email, subject, html);
    console.log(
      "[OTP] OTP email sent successfully, messageId:",
      result.messageId,
    );
    return result;
  } catch (err) {
    console.error("[OTP] Failed to send OTP email:", err.message);
    console.error("[OTP] Full error:", err);
    throw new Error(`Failed to send OTP email: ${err.message}`);
  }
};

module.exports = {
  generateOTP,
  storeOTP,
  getOTP,
  verifyOTP,
  deleteOTP,
  sendOTPEmail,
  resendOTP,
  maskEmail,
  getMaskedEmail,
};
