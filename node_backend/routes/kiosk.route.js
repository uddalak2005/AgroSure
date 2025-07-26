import express from 'express';
import KioskController from "../controllers/kiosk.controller.js";

const router = express.Router();

router.post("/register", KioskController.registerKiosk);

router.post("/farmer/register", KioskController.addNewFarmer);

router.get("/getAllFarmers/:uid", KioskController.getAllFarmers);

export default router;