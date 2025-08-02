import express from "express";
import userRoutes from "./routes/user.route.js"
import cropRoutes from "./routes/crop.route.js";
import loanRoutes from "./routes/loan.route.js";
import insuranceRoutes from "./routes/insurance.route.js";
import ivrRoutes from "./routes/ivr.route.js";
import kioskRoutes from "./routes/kiosk.route.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import morgan from 'morgan';
import client from 'prom-client';
import responseTime from "response-time";
import logger from './logger.js';

console.log = (...args) => logger.info(args.join(" "));
console.error = (...args) => logger.error(args.join(" "));

const app = express();


const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });


const reqResTime = new client.Histogram({
  name: "http_express_req_res_time",
  help: "This tells you how much time you require in a request response cycle",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000]
});

const totalRequestCounter = new client.Counter({
  name: 'total_requests',
  help: 'Total number of requests received'
});

app.use(responseTime((req, res, time) => {
  if (req.url !== "/metrics") {
    totalRequestCounter.inc();
  }
  reqResTime.labels({
    route: req.url,
    method: req.method,
    status_code: res.statusCode
  })
    .observe(time);
}))


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(morgan(':remote-addr :method :url :status', {
  stream: {
    write: (message) => logger.info(message.trim())
  },
  skip: (req, res) => req.url === '/metrics'
}));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//To Server audio TTS files
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));

app.use("/user", userRoutes);
app.use("/crop", cropRoutes);
app.use("/loan", loanRoutes);
app.use("/insurance", insuranceRoutes);
app.use("/ivr", ivrRoutes);
app.use("/kiosk", kioskRoutes);

app.get("/", (req, res) => {
  res.send("AgriSure Backend");
});

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
})

export default app;