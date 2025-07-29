import twilio from "twilio";
import {
    initSession,
    getSession,
    updateSession,
    clearSession,
} from '../utils/twilioSessionManager.util.js';
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {twiml} = twilio;

class IvrController {

    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        this.client = twilio(this.accountSid, this.authToken);
        this.makeCall = this.makeCall.bind(this);
        this.outGoingIVR = this.outGoingIVR.bind(this);
        this.languageSelection = this.languageSelection.bind(this);
        this.saveName = this.saveName.bind(this);
        this.savePinCode = this.savePinCode.bind(this);
        this.saveCropSelection = this.saveCropSelection.bind(this);
        this.saveLandArea = this.saveLandArea.bind(this);
    }


    async makeCall(req, res) {
        console.log("making call");
        try {
            const {phone} = req.body;

            const call = await this.client.calls.create({
                from: this.twilioPhoneNumber,
                to: phone,
                url: `${process.env.BASE_URL}/ivr/intro`,
            });

            console.log(call.sid);

            return res.status(200).json(call);

        } catch (err) {
            return res.status(500).json({
                message: err.message,
            })
        }
    }

    //Webhook for outgoing ivr
    async outGoingIVR(req, res) {
        console.log("outgoing IVR");
        const twimlResponse = new twiml.VoiceResponse();

        try {
            const callSid = req.body.CallSid;

            let session = getSession(callSid);

            if (!session) {
                console.log("Initializing new session for:", callSid);
                initSession(callSid);
                session = getSession(callSid);
            } else {
                console.log("Session already exists:", session);
            }

            console.log(getSession(callSid));

            const gather = twimlResponse.gather({
                input: 'dtmf',
                numDigits: 1,
                action: `${process.env.BASE_URL}/ivr/language`,
                method: 'POST',
                timeout: 5
            });

            gather.play(`${process.env.BASE_URL}/audio/1_welcome_and_lang_select.wav`)
            // gather.play('https://api.twilio.com/cowbell.mp3');

            twimlResponse.say("We did not receive any input");
            twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);

            res.type('text/xml');
            res.send(twimlResponse.toString());

        } catch (err) {
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(400).json({
                message: err.message,
            })
        }
    }

    //After Intro Control will come here
    async languageSelection(req, res) {
        console.log("languageSelection");
        const twimlResponse = new twiml.VoiceResponse();

        try {
            const digit = req.body.Digits;
            const callSid = req.body.CallSid;

            console.log(getSession(callSid));

            console.log(digit, " ", callSid);

            const langMap = {
                "1": "hi-IN",
                "2": "bn-IN",
                "3": "te-IN",
                "4": "en-IN",
            };

            // Only update language if a valid digit was provided
            if (digit && langMap[digit]) {
                const lang = langMap[digit];
                updateSession(callSid, {lang});

                twimlResponse.play(`${process.env.BASE_URL}/audio/${lang}/2_prompt_name_after_beep.wav`)


                //To record the name of the farmer
                twimlResponse.record({
                    maxLength: 5,
                    timeout: 3,
                    transcribe: true,
                    playBeep: true,
                    action: `${process.env.BASE_URL}/ivr/saveName`,
                    method: 'POST',
                });

                res.type('text/xml');
                res.send(twimlResponse.toString());

            } else {

                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);
                return res.type('text/xml').send(twimlResponse.toString());
            }

        } catch (err) {
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(400).json({
                message: err.message,
            })
        }
    }

    //Save name
    async saveName(req, res) {

        console.log("saveName");

        const twimlResponse = new twiml.VoiceResponse();

        try {
            const callSid = req.body.CallSid;
            console.log(getSession(callSid));
            const recordingUrl = req.body.RecordingUrl;

            if (!recordingUrl) {
                console.log("No audio heard");
                const fallbackTwiml = new twiml.VoiceResponse();
                fallbackTwiml.play("Sorry, we did not get your name."); //improvement - Made could be in local language
                fallbackTwiml.redirect(`${process.env.BASE_URL}/ivr/intro`); //scope of improvement of adding a new name fallback function
                return res.type('text/xml').send(fallbackTwiml.toString());

            }

            //Get Call language
            const lang = getSession(callSid)?.lang;

            console.log("language from saveName : ", lang);

            let transcribedText = '';

            console.log("Processing audio with Reverie STT");

            //Parsing audio from the recording URL
            const audioResponse = await axios.get(recordingUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                auth: {
                    username: process.env.TWILIO_ACCOUNT_SID,
                    password: process.env.TWILIO_AUTH_TOKEN
                }
            });

            //preparing the form-data
            console.log("preparing the form-data")

            const audioBuffer = audioResponse.data;
            console.log(audioBuffer);

            if (!audioResponse.data || audioResponse.data.byteLength === 0) {
                throw new Error('Empty audio file received from Twilio');
            }

            const tempDir = './temp';
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, {recursive: true});
            }

            const filename = `recording_${callSid || Date.now()}.wav`;
            const tempFilePath = path.join(tempDir, filename);

            fs.writeFileSync(tempFilePath, audioBuffer);

            const formData = new FormData();
            formData.append('audio_file', fs.createReadStream(tempFilePath));


            let reverieLang = lang;
            if (lang === 'bn-IN') {
                reverieLang = 'bn';
            } else if (lang === 'hi-IN') {
                reverieLang = 'hi';
            } else if (lang === 'te-IN') {
                reverieLang = 'te';
            } else if (lang === 'en-IN') {
                reverieLang = 'en';
            }

            //API request to revup STT
            console.log("Reverie STT")
            const sttResponse = await axios.post('https://revapi.reverieinc.com/', formData, {
                headers: {
                    'src_lang': reverieLang,
                    'domain': 'generic',
                    'REV-API-KEY': process.env.REVERIE_API_KEY,
                    'REV-APPNAME': 'stt_file',
                    'REV-APP-ID': process.env.REVERIE_APP_ID,
                    ...formData.getHeaders() // This gets the correct Content-Type with boundary
                },
                timeout: 15000
            });

            //Below is the step to check accuracy of the Revup STT
            let confidence = null;

            if (sttResponse.data && sttResponse.data.success && sttResponse.data.text) {
                console.log('transcribed', sttResponse.data.text.trim());
                transcribedText = sttResponse.data.text.trim();
                confidence = sttResponse.data.confidence;

                console.log('confidence', confidence); //Only for Dev
                console.log('transcribed', transcribedText); //Only for Dev
            }

            fs.unlinkSync(tempFilePath);


            //Storing the name in memory map
            updateSession(callSid, {name: transcribedText});
            console.log(getSession(callSid));

            console.log("Moving to Pincode")
            //DTMF to capture pincode
            const gather = twimlResponse.gather({
                input: 'dtmf',
                numDigits: 6,
                action: `${process.env.BASE_URL}/ivr/savePincode`,
                method: 'POST',
                timeout: 10
            });



            //To play the audio instruction to enter pincode
            gather.play(`${process.env.BASE_URL}/audio/${lang}/3_enter_pincode.wav`)

            return res.type('text/xml').send(twimlResponse.toString());

        } catch (err) {
            console.log(err.message);
            const errorTwiml = new twiml.VoiceResponse();
            errorTwiml.say("Sorry an application error has occurred");
            return res.type('text/xml').send(errorTwiml.toString());
        }
    }

    //To save Pincode and get GeoLocation Latitude and Longitude
    async savePinCode(req, res) {
        console.log("savePinCode");
        const twimlResponse = new twiml.VoiceResponse();

        try {
            const callSid = req.body.CallSid;
            const pincode = req.body.Digits;
            const session = getSession(callSid);
            const lang = session?.lang;

            console.log("pincode", pincode);
            console.log("pincode length", pincode?.length);
            console.log("language", lang);

            // Validate pincode length
            if (!pincode || pincode.length !== 6) {
                console.log(`Invalid pincode length: ${pincode?.length}. Expected 6 digits.`);

                const gather = twimlResponse.gather({
                    input: 'dtmf',
                    numDigits: 6,
                    action: `${process.env.BASE_URL}/ivr/savePincode`,
                    method: 'POST',
                    timeout: 10
                });

                gather.play(`${process.env.BASE_URL}/audio/${lang}/3_enter_pincode.wav`);

                // Fallback if no input
                twimlResponse.say("We did not receive your pincode");
                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);

                return res.type('text/xml').send(twimlResponse.toString());
            }

            // Store valid pincode
            updateSession(callSid, {pincode});

            twimlResponse.play(`${process.env.BASE_URL}/audio/${lang}/4_music_or_waiting.wav`);

            // Play background processing music (10 seconds)
            // twimlResponse.play(`${process.env.BASE_URL}/audio/processing_music.wav`);

            twimlResponse.redirect(`${process.env.BASE_URL}/ivr/fetchAndPlayCrops`);

            return res.type("text/xml").send(twimlResponse.toString());

        } catch (err) {
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(500).json({
                message: err.message
            })
        }
    }

    async fetchAndPlayCrops(req, res) {
        const twimlResponse = new twiml.VoiceResponse();

        try{
            const callSid = req.body.CallSid;
            const session = getSession(callSid);
            const { pincode, lang } = session || {};

            console.log("pincode", pincode, lang);

            const apiId = process.env.OPENWEATHER_API_KEY;

            const locationData = await axios.get(`http://api.openweathermap.org/geo/1.0/zip?zip=${pincode},IN&appid=${apiId}`)

            if (!locationData) {
                console.error("Unable to fetch location data");
                return;
            }

            console.log(locationData.data.lat);
            console.log(locationData.data.lon);

            let cropList;

            try{
                const cropResponse = await axios.get(`${process.env.FLASK_URL}/top-crops?lat=${locationData.data.lat}&lon=${locationData.data.lon}`);

                if(!cropResponse.data){
                    console.log(`Could not fetch crop data for ${locationData.data.lat}`);
                    throw new Error(`Could not fetch crop data for ${locationData.data.lat}`);
                }

                cropList = cropResponse.data.top_5_crops;

            }catch(err){
                console.log(err.message);
                return res.status(400).json({
                    message : err.message
                })
            }

            console.log("Available crops for location:", cropList);

            const gather = twimlResponse.gather({
                input: 'dtmf',
                numDigits: 1,
                action: `${process.env.BASE_URL}/ivr/saveCropSelection`,
                method: 'POST',
                timeout: 10
            });

            cropList.forEach((crop, index) => {

                const cropAudio = encodeURIComponent(`${crop}.wav`);
                const cropAudioURL = `${process.env.BASE_URL}/audio/${lang}/crop_names/${cropAudio}`;

                console.log(`${index+1} cropAudio : ${cropAudioURL}`)
                const instructionAudio = encodeURIComponent(`press_${index+1}.wav`);

                const instructionURL = `${process.env.BASE_URL}/audio/${lang}/dtmf_instructions/${instructionAudio}`;
                console.log(`${index+1} instructionURL : ${instructionURL}`)

                const silenceAudioURL = `${process.env.BASE_URL}/audio/silence_1sec.wav`;

                gather.play(instructionURL);
                gather.play(silenceAudioURL);
                gather.play(cropAudioURL);

            });

            // Store crop list in session for later use
            updateSession(callSid, {cropList});

            console.log("Processing complete, redirecting call...");

            console.log("Call redirected successfully");

            return res.type('text/xml').send(twimlResponse.toString());

        }catch(err){
            console.log(err);
            return res.status(500).json({
                message: err.message
            })
        }
    }

    // Handle crop selection
    async saveCropSelection(req, res) {
        console.log("saveCropSelection");
        const twimlResponse = new twiml.VoiceResponse();

        try {
            const callSid = req.body.CallSid;
            const selectedDigit = req.body.Digits;
            const session = getSession(callSid);
            const cropList = session?.cropList;
            const lang = session?.lang;

            console.log("Selected digit:", selectedDigit);
            console.log("Available crops:", cropList);

            if (!selectedDigit || !cropList) {
                twimlResponse.say("Invalid selection");
                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);
                return res.type('text/xml').send(twimlResponse.toString());
            }


            const digit = parseInt(selectedDigit, 10);

            if (isNaN(digit) || digit < 1 || digit > 5) {
                twimlResponse.play("Sorry");
                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/fetchAndPlayCrops`);
                return res.type('text/xml').send(twimlResponse.toString());
            }

            const selectedCrop = cropList[parseInt(selectedDigit) - 1];

            if (!selectedCrop) {
                twimlResponse.say("Invalid crop selection");
                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);
                return res.type('text/xml').send(twimlResponse.toString());
            }

            // Store selected crop
            updateSession(callSid, {selectedCrop: selectedCrop});

            console.log("Selected crop:", selectedCrop);

            // Play land area instruction
            twimlResponse.play(`${process.env.BASE_URL}/audio/${lang}/6_enter_land_area.wav`);

            // Set up gather for land area input
            const gather = twimlResponse.gather({
                input: 'dtmf',
                numDigits: 3, // Assuming max 999 acres
                action: `${process.env.BASE_URL}/ivr/saveLandArea`,
                method: 'POST',
                timeout: 10
            });

            return res.type('text/xml').send(twimlResponse.toString());

        } catch (err) {
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(500).json({
                message: err.message
            });
        }
    }

    // Handle land area input
    async saveLandArea(req, res) {
        console.log("saveLandArea");
        const twimlResponse = new twiml.VoiceResponse();

        try {
            const callSid = req.body.CallSid;
            const landArea = req.body.Digits;
            const session = getSession(callSid);
            const lang = session?.lang;

            console.log("Land area:", landArea);

            if (!landArea) {
                twimlResponse.say("Invalid land area");
                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);
                return res.type('text/xml').send(twimlResponse.toString());
            }

            // Store land area
            updateSession(callSid, {landArea});

            // Play processing done message
            twimlResponse.play(`${process.env.BASE_URL}/audio/${lang}/7_processing_done.wav`);

            // Here you can add logic to save the complete data to database
            console.log("Complete session data:", getSession(callSid));

            // Clear session after processing
            clearSession(callSid); // to be removed

            twimlResponse.hangup();

            return res.type('text/xml').send(twimlResponse.toString());

        } catch (err) {
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(500).json({
                message: err.message
            })
        }
    }


    async makeCallAfterAPIResponse(req, res) {
        try{
            console.log("making call after AI Response");
            try {
                const {phone} = req.body;

                const call = await this.client.calls.create({
                    from: this.twilioPhoneNumber,
                    to: phone,
                    url: `${process.env.BASE_URL}/ivr/loanRequest`,
                });

                console.log(call.sid);

                return res.status(200).json(call);

            } catch (err) {
                return res.status(500).json({
                    message: err.message,
                })
            }

        }catch(err){

        }
    }

    //Language Choice is still unde development for this part
    async askForLoanRequest(req, res) {
        const twimlResponse = new twiml.VoiceResponse();
        try{
            const callSid = req.body.CallSid;

            const gather = twimlResponse.gather({
                input: 'dtmf',
                numDigits: 1,
                action: `${process.env.BASE_URL}/ivr/language`,
                method: 'POST',
                timeout: 5
            });

            gather.play(`${process.env.BASE_URL}/audio/8_ask_for_loan_request.wav`);

            twimlResponse.say("We did not receive any input");
            twimlResponse.redirect(`${process.env.BASE_URL}/ivr/intro`);

            res.type('text/xml');
            res.send(twimlResponse.toString());
        }catch(err){
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(400).json({
                message: err.message,
            })
        }
    }

    async confirmLoan(req, res) {
        console.log("languageSelection");
        const twimlResponse = new twiml.VoiceResponse();

        try {
            const digit = req.body.Digits;
            const callSid = req.body.CallSid;

            console.log(getSession(callSid));

            console.log(digit, " ", callSid);

            if(!digit || digit !== '1' || digit !== '2'){
                const gather = twimlResponse.gather({
                    input: 'dtmf',
                    numDigits: 6,
                    action: `${process.env.BASE_URL}/ivr/confirmLoan`,
                    method: 'POST',
                    timeout: 10
                })

                gather.say("Sorry");
                gather.play(`${process.env.BASE_URL}/audio/8_ask_for_loan_request.wav`); //language to be set

                // Fallback if no input
                twimlResponse.say("We did not receive your input");
                twimlResponse.redirect(`${process.env.BASE_URL}/ivr/askForLoanRequest`);

                return res.type('text/xml').send(twimlResponse.toString());
            }

            if(digit === '1'){
                //Sent mail
            }else{
                //hangup
            }

        } catch (err){
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(400).json({
                message: err.message,
            })
        }
    }
}

export default new IvrController();