import mongoose from "mongoose";
import dotenv from "dotenv";
import Bank from "./models/bank.schema.js";

dotenv.config();

// 1. Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://uddalakmukhopadhyay:Uddalak2005@cluster0.fifwikr.mongodb.net/agrosure", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,   // ✅ Increase timeout
      bufferCommands: false              // ✅ Avoid buffering when not connected
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// 2. Insert banks
const seedBanks = async () => {
  try {
    await Bank.deleteMany(); // optional: clear existing data

    await Bank.insertMany([
        // ✅ Nearby Banks (within 10km)
        {
          name: "SBI Park Street Branch",
          branchCode: "SBI1001",
          email: "mukhopadhyayuddalak2005@gmail.com",
          phone: "033-12345678",
          address: "12 Park Street, Kolkata",
          location: {
            type: "Point",
            coordinates: [88.3497, 22.5656] // ~2.5 km
          }
        },
        {
          name: "HDFC Camac Street",
          branchCode: "HDFC1010",
          email: "niruponpal2003@gmail.com",
          phone: "033-23456789",
          address: "5 Camac Street, Kolkata",
          location: {
            type: "Point",
            coordinates: [88.3774, 22.5411] // ~3.8 km
          }
        },
        {
          name: "Axis Ballygunge Branch",
          branchCode: "AXIS2020",
          email: "niruponpal@gmail.com",
          phone: "033-34567890",
          address: "Ballygunge Circular Rd, Kolkata",
          location: {
            type: "Point",
            coordinates: [88.3662, 22.5272] // ~5.3 km
          }
        },

        // ❌ Far Banks (10–60+ km away)
        {
          name: "PNB Barasat Branch",
          branchCode: "PNB9001",
          email: "barasat@pnb.co.in",
          phone: "033-45678901",
          address: "Station Rd, Barasat",
          location: {
            type: "Point",
            coordinates: [88.4510, 22.7235] // ~19.5 km
          }
        },
        {
          name: "ICICI Salt Lake Sector V",
          branchCode: "ICICI4004",
          email: "sector5@icici.com",
          phone: "033-56789012",
          address: "Godrej Waterside, Salt Lake",
          location: {
            type: "Point",
            coordinates: [88.4312, 22.5790] // ~7.5–8 km
          }
        },
        {
          name: "Canara Bank Howrah Branch",
          branchCode: "CAN123",
          email: "howrah@canarabank.in",
          phone: "033-65432109",
          address: "GT Road, Howrah",
          location: {
            type: "Point",
            coordinates: [88.3196, 22.5886] // ~6 km west
          }
        },
        {
          name: "Bandhan Bank Sonarpur",
          branchCode: "BANDHAN301",
          email: "sonarpur@bandhanbank.com",
          phone: "033-67678990",
          address: "Mission Pally, Sonarpur",
          location: {
            type: "Point",
            coordinates: [88.4233, 22.4465] // ~16 km
          }
        },
        {
          name: "BOI Kalyani Branch",
          branchCode: "BOI7007",
          email: "kalyani@boi.co.in",
          phone: "033-87654321",
          address: "A-Block, Kalyani",
          location: {
            type: "Point",
            coordinates: [88.4672, 22.9752] // ~50 km
          }
        },
        {
          name: "Union Bank Durgapur",
          branchCode: "UBD5005",
          email: "durgapur@unionbank.in",
          phone: "0343-2394567",
          address: "City Center, Durgapur",
          location: {
            type: "Point",
            coordinates: [87.3082, 23.5500] // ~160 km
          }
        },
        {
          name: "UCO Bank Siliguri",
          branchCode: "UCO999",
          email: "siliguri@ucobank.com",
          phone: "0353-2654321",
          address: "Hill Cart Road, Siliguri",
          location: {
            type: "Point",
            coordinates: [88.4305, 26.7271] // ~500 km
          }
        }
      ]);

console.log("✅ Inserted 10 bank records");
process.exit(0);
  } catch (err) {
  console.error("❌ Failed to insert banks:", err.message);
  process.exit(1);
}
};

// 3. Main
const main = async () => {
  await connectDB();
  await seedBanks();
};

main();
