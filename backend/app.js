import express, { urlencoded } from "express";
import cors from "cors"

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
}));

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({ message: "You are near to mukherjee" });
})

export default app;