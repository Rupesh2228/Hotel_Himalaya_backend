const { BrevoClient } = require('@getbrevo/brevo');

// Initialize Brevo client with API key
const brevoClient = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || ''
});

module.exports = { brevoClient };
