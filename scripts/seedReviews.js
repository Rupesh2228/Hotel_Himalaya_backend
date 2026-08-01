require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("./models/Review");

const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/hotel";
const ATLAS_MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const seedReviews = async () => {
  let mongoUri = ATLAS_MONGO_URI || LOCAL_MONGO_URI;

  console.log("🌱 Seeding reviews...\n");

  try {
    console.log(`📡 Trying to connect to: ${mongoUri.substring(0, 50)}...`);
    
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log("✅ Connected to MongoDB\n");
  } catch (atlasError) {
    if (ATLAS_MONGO_URI) {
      console.log(
        "❌ Atlas connection failed (IP whitelist issue or network problem)\n"
      );
      console.log(
        "💡 To fix: Add your IP to MongoDB Atlas IP Whitelist:"
      );
      console.log("   1. Go to https://cloud.mongodb.com");
      console.log("   2. Select your cluster (Cluster0)");
      console.log("   3. Go to Network Access > IP Whitelist");
      console.log("   4. Add your current IP or 0.0.0.0/0 for testing\n");

      if (LOCAL_MONGO_URI !== ATLAS_MONGO_URI) {
        console.log("🔄 Trying local MongoDB as fallback...\n");
        try {
          await mongoose.connect(LOCAL_MONGO_URI, {
            autoIndex: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
          });
          console.log("✅ Connected to local MongoDB\n");
          isLocalFallback = true;
        } catch (localError) {
          console.log(
            "❌ Local MongoDB not running. Start MongoDB:\n   Windows: mongod\n"
          );
          throw localError;
        }
      } else {
        throw atlasError;
      }
    } else {
      throw atlasError;
    }
  }

  try {
    // Clear existing reviews
    const deleteResult = await Review.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing reviews\n`);

    // Sample reviews data from Hotel HI Khokana
   
    await mongoose.connection.close();
    console.log("✓ Database connection closed\n");
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedReviews();
