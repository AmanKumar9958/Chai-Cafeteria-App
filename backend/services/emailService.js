// backend/services/emailService.js
const Sib = require('sib-api-v3-sdk');

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME || 'Chai Cafeteria';

/**
 * Initialize Brevo client
 */
function getClient() {
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set');
  }
  const defaultClient = Sib.ApiClient.instance;
  const apiKeyAuth = defaultClient.authentications['api-key'];
  apiKeyAuth.apiKey = apiKey;
  return new Sib.TransactionalEmailsApi();
}

/**
 * Send an OTP email using Brevo
 * @param {string} toEmail Recipient email
 * @param {string} otp 6-digit OTP code
 */
async function sendOtpEmail(toEmail, otp) {
  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not set');
  }
  const apiInstance = getClient();
  const sendSmtpEmail = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail }],
    subject: 'Your Chai Cafeteria OTP Code',
    htmlContent: `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;color:#222">
        <p>Hi,</p>
        <p>Your verification code is:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:700">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
        <p>Thanks,<br/>${senderName}</p>
      </div>
    `,
  };
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

module.exports = { sendOtpEmail };
