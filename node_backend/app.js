import express from "express";
import userRoutes from "./routes/user.route.js"
import cropRoutes from "./routes/crop.route.js";
import loanRoutes from "./routes/loan.route.js";
import insuranceRoutes from "./routes/insurance.route.js";
import ivrRoutes from "./routes/ivr.route.js";
import cors from "cors";
import path from "path";
import { fileURLToPath} from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({extended : true}));
//To Server audio TTS files
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));

app.use("/user", userRoutes);
app.use("/crop", cropRoutes);
app.use("/loan", loanRoutes);
app.use("/insurance", insuranceRoutes);
app.use("/ivr", ivrRoutes);

app.get("/", (req, res) => {
    res.send("AgriSure Backend");
});


export default app;