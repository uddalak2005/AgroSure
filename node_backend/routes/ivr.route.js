import express from "express";
import IvrController from "../controllers/ivr.controller.js";

const router = express.Router();

router.post("/makeCall", IvrController.makeCall);

router.post("/intro", IvrController.outGoingIVR);

router.post("/language", IvrController.languageSelection);

router.post("/saveName", IvrController.saveName);

router.post("/savePincode", IvrController.savePinCode);

router.post("/fetchAndPlayCrops", IvrController.fetchAndPlayCrops);

router.post("/saveCropSelection", IvrController.saveCropSelection);

router.post("/saveLandArea", IvrController.saveLandArea);

router.post("/loanRequest", IvrController.askForLoanRequest);

router.post("/confirmLoan", IvrController.confirmLoan);

router.post("/askForLoanAmount", IvrController.askForLoanAmount);

export default router;
