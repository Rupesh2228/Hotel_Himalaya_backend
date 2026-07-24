const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
const defaultClient = brevo.ApiClient.instance;

// Configure API key authorization
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Create Transactional Emails API instance
const transactionalEmailsApi = new brevo.TransactionalEmailsApi();

module.exports = {
  brevo,
  transactionalEmailsApi
};
