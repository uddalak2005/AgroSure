import User from "../models/user.schema.js";

class RegistrationController {

    async userRegistration(req, res) {
        try {
            console.log('req.body : ',req.body);
            const {
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


            if (!uid || !email || !name || !phone || totalLand == null || !locationLat || !locationLong || !aadhar || !crops) {
                return res.status(400).json({ message: "Missing or invalid fields" });
            }

            const isSmallFarmer = (totalLand < 5) ? true : false;
            const newUser = await User.create({
                uid,
                email,
                name,
                phone,
                totalLand,
                isSmallFarmer,
                location: {
                    lat: locationLat,
                    long: locationLong
                },
                aadhar,
                crops
            });

            res.status(201).json({ message: "User registered successfully!" });
        }
        catch (err) {
            console.log(err.message);
            res.status(400).json({
                message: "Unable to register user",
                error: err.message
            });
        }
    }

    async getUserByUID(req, res) {
        const { uid } = req.params;
        console.log('lookig for user : ',uid);

        

        if (!uid) {
            return res.status(400).json({ message: "UID is required" });
        }

        try {
            
            const user = await User.findOne({ uid });
            console.log(user);

            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }

            return res.status(200).json({ user });
        } catch (err) {
            console.error("❌ Error fetching user:", err.message);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

const userController = new RegistrationController();
export default userController;