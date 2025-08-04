import mongoose from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";
import cluster from "node:cluster";
import os from "os";
import morgan from 'morgan';

const numCPU = os.cpus().length;

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (cluster.isPrimary) {

    console.log(`Primary ${process.pid} is running`);

    for (let i = 0; i < numCPU; i++) {
        cluster.fork();
    }

} else {

    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch(() => {
            console.log("ERROR CONNECTION WITH MONGODB");
        });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`app is listeing to port ${PORT}`);
    })

}
