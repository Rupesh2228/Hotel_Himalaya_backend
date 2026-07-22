require('dotenv').config();
const { sendEmail } = require('./services/emailService');

(async () => {
  console.log("Testing email to purnadangol2018@gmail.com...");
  const result = await sendEmail("purnadangol2018@gmail.com", "Test OTP", "Your OTP is 123456", "<p>Your OTP is 123456</p>");
  console.log("Result:", result);
})();
