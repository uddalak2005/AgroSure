import express from "express";
import loanController from "../controllers/loan.controller.js";

const router = express.Router();

router.post('/submit/:id', loanController.submitLoan);


export default router;