import mongoose from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch(() => {
    console.log("ERROR CONNECTION WITH MONGODB");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`app is listeing to port ${PORT}`);
})