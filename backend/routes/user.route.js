import express from "express";
import userController from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", userController.userRegistration);

router.get("/dashboard/:uid", userController.getUserByUID);

export default router;