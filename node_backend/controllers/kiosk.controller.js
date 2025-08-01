import Kiosk from '../models/kiosk.model.js';
import axios from 'axios';

class KioskController {

    async registerKiosk(req, res) {
        try {
            console.log(req.body);
            const {uid, name, email, phone, address, locationLat, locationLong} = req.body;

            if (!uid || !name || !email || !phone || !address || !locationLat || !locationLong) {
                console.log("Missing or invalid fields");
                return res.status(400).json({error: 'Missing or invalid fields'});
            }

            const newKiosk = await Kiosk.create({
                uid,
                name,
                email,
                phone,
                location: {
                    address,
                    locationLat,
                    locationLong
                }
            });

            res.status(201).json({
                message: "Kiosk Created Successfully",
                newKiosk: newKiosk
            })

        } catch (err) {
            console.error(err.message);
            res.status(400).json({
                message: err.message
            })
        }
    }

    async addNewFarmer(req, res) {
        try {
            console.log(req.body);
            const {
                kioskUid,
                uid,
                email,
                name,
                phone,
                totalLand,
                locationLat,
                locationLong,
                aadhar,
                crops,
            } = req.body;


            if (!kioskUid || !uid || !email || !name || !phone || totalLand == null || !locationLat || !locationLong || !aadhar || !crops) {
                return res.status(400).json({message: "Missing or invalid fields"});
            }

            const newFarmer = await axios.post(`${process.env.BASE_URL}/user/register`, {
                uid,
                email,
                name,
                phone,
                totalLand,
                locationLat,
                locationLong,
                aadhar,
                crops,
            })

            if (!newFarmer || !newFarmer.data) {
                return res.status(400).json({
                    message: "Failed to create a new Farmer"
                })
            }

            const farmerId = newFarmer.data.user._id;

            const updatedKiosk = await Kiosk.findOneAndUpdate(
                {uid: kioskUid},
                {
                    $push: {
                        farmers: farmerId
                    }
                },
                {new: true}
            );

            if (!updatedKiosk) {
                return res.status(404).json({message: "Kiosk not found"});
            }

            return res.status(201).json({
                message: "Farmer created and added to kiosk successfully",
                user: newFarmer.data.user,
                kiosk: updatedKiosk
            });

        } catch (err) {
            console.error(err);
            return res.status(400).json({
                message: err.message
            });
        }
    }

    async getAllFarmers(req, res) {
        try {
            const {uid} = req.params;

            if (!uid) {
                return res.status(400).json({
                    message: "No UID provided"
                })
            }

            const kiosk = await Kiosk.findOne({uid: uid}).populate('farmers');

            if (!kiosk) {
                return res.status(400).json({
                    message: "No Kiosk with the provided uid found"
                })
            }

            const farmers = kiosk.farmers;

            return res.status(200).json({
                farmers
            })

        } catch (err) {
            console.error(err.message);
            return res.status(400).json({
                message: err.message
            })
        }
    }

    async getAllKiosks(req, res) {
        try{
            const kioskData = await Kiosk.find({});

            return res.status(200).json({
                kioskData
            });
        }catch(err){
            console.error(err.message);
            return res.status(400).json({
                message : err.message
            })
        }
    }
}

export default new KioskController();