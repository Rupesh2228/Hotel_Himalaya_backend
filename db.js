require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI not set in .env file');
  process.exit(1);
}

const connectDB = async () => {
  let attempt = 1;
  const maxRetries = Infinity; // Retry forever
  const retryDelays = [2000, 5000, 10000, 15000];

  while (attempt <= maxRetries) {
    try {
      console.log(`[Attempt ${attempt}] Connecting to MongoDB...`);
      
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB connected successfully!\n');
      return;
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
      
      const delay = retryDelays[Math.min(attempt - 1, retryDelays.length - 1)];
      console.log(`⏳ Retrying in ${delay / 1000}s...\n`);
      
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

module.exports = { connectDB, mongoose };
