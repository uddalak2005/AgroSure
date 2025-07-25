import express from "express";
import IvrController from "../controllers/ivr.controller.js";

const router = express.Router();

router.post("/makeCall", IvrController.makeCall);

router.post("/intro", IvrController.outGoingIVR);

router.post("/language", IvrController.languageSelection);

router.post("/saveName", IvrController.saveName);

router.post("/savePincode", IvrController.savePinCode);

export default router;
