import express from "express";
import cropController from '../controllers/crop.controller.js';

const router = express.Router();

router.post('/addNewCrop', cropController.addNewCrop);

router.get('/getPredictions/:id', cropController.getPredictionOnCrop);

router.get('/getAllCrops/:uid', cropController.getPastRecords);

export default router;