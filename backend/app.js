import express from "express";
import userRoutes from "./routes/user.route.js"
import cropRoutes from "./routes/crop.route.js";
import loanRoutes from "./routes/loan.route.js";
import insuranceRoutes from "./routes/insurance.route.js";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use("/user", userRoutes);
app.use("/crop", cropRoutes);
app.use("/loan", loanRoutes);
app.use("/insurance", insuranceRoutes);

app.get("/", (req, res) => {
    res.send("AgriSure Backend");
});


export default app;