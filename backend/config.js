import mongoose from "mongoose";
import dotenv from "dotenv";
import InsuranceCompany from "./models/insuranceCompanies.model.js";

dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://uddalakmukhopadhyay:Uddalak2005@cluster0.fifwikr.mongodb.net/agrosure", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

const seedInsuranceCompanies = async () => {
  const insurers = [
    {
      name: "ICICI Lombard",
      uinPrefix: "ICL",
      email: "mukhopadhyayuddalak2005@gmail.com",
      phone: "18002666",
      website: "https://www.icicilombard.com",
      supportedCrops: ["Paddy", "Cotton", "Maize"],
    },
    {
      name: "HDFC Ergo",
      uinPrefix: "HDE",
      email: "niruponpal2003@gmail.com",
      phone: "18002660700",
      website: "https://www.hdfcergo.com",
      supportedCrops: ["Wheat", "Bajra", "Mustard"],
    },
    {
      name: "Bajaj Allianz",
      uinPrefix: "BAZ",
      email: "niruponpal@gmail.com",
      phone: "18002095858",
      website: "https://www.bajajallianz.com",
      supportedCrops: ["Rice", "Sorghum"],
    },
    {
      name: "Tata AIG",
      uinPrefix: "TAG",
      email: "customersupport@tataaig.com",
      phone: "18002667780",
      website: "https://www.tataaig.com",
      supportedCrops: ["Barley", "Groundnut"],
    },
    {
      name: "Reliance General",
      uinPrefix: "REL",
      email: "rgicl.services@relianceada.com",
      phone: "18003009",
      website: "https://www.reliancegeneral.co.in",
      supportedCrops: ["Soybean", "Sugarcane"],
    },
    {
      name: "IFFCO Tokio",
      uinPrefix: "IFT",
      email: "support@iffcotokio.co.in",
      phone: "18001030359",
      website: "https://www.iffcotokio.co.in",
      supportedCrops: ["Chickpea", "Sunflower"],
    },
    {
      name: "SBI General",
      uinPrefix: "SBG",
      email: "customer.care@sbigeneral.in",
      phone: "18001021111",
      website: "https://www.sbigeneral.in",
      supportedCrops: ["Jowar", "Millets"],
    },
    {
      name: "Universal Sompo",
      uinPrefix: "USP",
      email: "contactus@universalsompo.com",
      phone: "18002005142",
      website: "https://www.universalsompo.com",
      supportedCrops: ["Lentil", "Peas"],
    },
    {
      name: "Future Generali",
      uinPrefix: "FGL",
      email: "fgcare@futuregenerali.in",
      phone: "18001023388",
      website: "https://general.futuregenerali.in",
      supportedCrops: ["Banana", "Tobacco"],
    },
    {
      name: "New India Assurance",
      uinPrefix: "NIA",
      email: "tech.support@newindia.co.in",
      phone: "18002091415",
      website: "https://www.newindia.co.in",
      supportedCrops: ["Tea", "Rubber"],
    },
  ];

  try {
    await InsuranceCompany.deleteMany(); // Optional: clear existing
    const result = await InsuranceCompany.insertMany(insurers);
    console.log(`✅ Inserted ${result.length} insurance companies`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to seed insurance companies:", err.message);
    process.exit(1);
  }
};

await connectDB();
await seedInsuranceCompanies();
