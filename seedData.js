require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./models/Room");
const Attraction = require("./models/Attraction");

const MONGO_URI = process.env.MONGO_URI;

const seedData = async () => {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    await Room.deleteMany({});
    await Attraction.deleteMany({});
    console.log("🗑️  Cleared existing data\n");

    // Sample Rooms
    const rooms = [
      {
        title: "Deluxe Room",
        description: "Spacious room with mountain view, queen bed, and modern amenities",
        price: 150,
        totalMembers: 2,
        images: [],
      },
      {
        title: "Suite Room",
        description: "Luxurious suite with king bed, separate living area, and premium bathroom",
        price: 250,
        totalMembers: 4,
        images: [],
      },
      {
        title: "Budget Room",
        description: "Comfortable room with single bed, basic amenities, perfect for budget travelers",
        price: 80,
        totalMembers: 1,
        images: [],
      },
      {
        title: "Family Room",
        description: "Large room with multiple beds, kitchenette, perfect for families",
        price: 200,
        totalMembers: 4,
        images: [],
      },
      {
        title: "Twin Room",
        description: "Room with two separate beds, ideal for friends or colleagues",
        price: 120,
        totalMembers: 2,
        images: [],
      },
    ];

    // Sample Attractions
    const attractions = [
      {
        title: "Pokhara City Tour",
        description: "Explore the beautiful city of Pokhara",
        subDescription: "Visit lakeside attractions and local markets",
        imageUrl: "https://via.placeholder.com/400x300?text=Pokhara+City",
        link: "#pokhara",
      },
      {
        title: "himalaya Trek",
        description: "Experience the majestic himalaya mountains",
        subDescription: "Multi-day trekking adventure with professional guides",
        imageUrl: "https://via.placeholder.com/400x300?text=himalaya+Trek",
        link: "#himalaya",
      },
      {
        title: "Paragliding Adventure",
        description: "Thrilling paragliding experience over valleys",
        subDescription: "Certified instructors and safety equipment provided",
        imageUrl: "https://via.placeholder.com/400x300?text=Paragliding",
        link: "#paragliding",
      },
      {
        title: "Lake Activities",
        description: "Boating and water sports on Fewa Lake",
        subDescription: "Kayaking, paddling, and sunset cruises available",
        imageUrl: "https://via.placeholder.com/400x300?text=Lake+Activities",
        link: "#lake",
      },
      {
        title: "Cultural Tour",
        description: "Discover local culture and traditions",
        subDescription: "Visit temples, museums, and meet local communities",
        imageUrl: "https://via.placeholder.com/400x300?text=Cultural+Tour",
        link: "#culture",
      },
      {
        title: "Adventure Sports",
        description: "Exciting adventure activities for thrill-seekers",
        subDescription: "Rock climbing, zip-lining, and more",
        imageUrl: "https://via.placeholder.com/400x300?text=Adventure+Sports",
        link: "#adventure",
      },
    ];

    // Insert rooms
    const createdRooms = await Room.insertMany(rooms);
    console.log(`✅ Created ${createdRooms.length} rooms`);

    // Insert attractions
    const createdAttractions = await Attraction.insertMany(attractions);
    console.log(`✅ Created ${createdAttractions.length} attractions\n`);

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Database connection closed");
  }
};

seedData();
