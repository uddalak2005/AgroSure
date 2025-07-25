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

const {twiml} = twilio;

class IvrController {

    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        this.client = twilio(this.accountSid, this.authToken);
        this.makeCall = this.makeCall.bind(this);
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

    //Save name and the pin-code
    async saveName(req, res) {

        console.log("saveName");

        const twimlResponse = new VoiceResponse();

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
                fs.mkdirSync(tempDir, { recursive: true });
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
                timeout: 5
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

            console.log("pincode", pincode);

            updateSession(callSid, {pincode});

            const session = getSession(callSid);

            const apiId = process.env.OPENWEATHER_API_KEY;

            const locationData = await axios.get(`http://api.openweathermap.org/geo/1.0/zip?zip=${pincode},IN&appid=${apidId}`)

            twimlResponse.play(`${process.env.BASE_URL}/audio/${lang}/4_music_or_waiting.wav`);

            twimlResponse.say("Thank you for your information. We will process your request.");

            return res.type('text/xml').send(twimlResponse.toString());

        } catch (err) {
            console.log(err.message);
            twimlResponse.say("Sorry an application error has occurred");
            return res.status(500).json({
                message: err.message
            })
        }
    }
}

export default new IvrController();