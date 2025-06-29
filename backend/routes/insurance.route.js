import express from "express";
import insuranceController from "../controllers/insurance.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/create",
    upload.fields([
        { name: "damageImage", maxCount: 1 },
        { name: "cropImage", maxCount: 1 },
        { name: "fieldImage", maxCount: 1 }
    ]),
    insuranceController.createInsurance
);

// router.post("/submit/:id", insuranceController.submitInsurance)

export default router;