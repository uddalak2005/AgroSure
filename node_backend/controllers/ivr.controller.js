import twilio from "twilio";
const { twiml } = twilio;

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

        try{
            const gather = twimlResponse.gather({
                input : 'dtmf',
                numDigits: 1,
                action: `${process.env.BASE_URL}/ivr/language`,
                method: 'POST',
                timeout : 5
            });

            gather.say("Hello! welcome to AgriSure. Press 1 for Hindi. Press 2 for Bengali. Press 3 for English.", {
                language : "hi-IN",
                voice : "Polly.Aditi"
            });

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

    //After Intro Control will come here
    async languageSelection(req, res) {
        console.log("languageSelection");
        const twimlResponse = new twiml.VoiceResponse();

        try{
            const digit = req.body.Digits;

            const langMap = {
                "1" : "hi-IN",
                "2" : "bn-IN",
                "3" : "en-IN"
            };

            const lang = langMap[digit] || "hi-IN";

            twimlResponse.say("भाई, ये भाषा अभी विकास में है — थोड़ा सब्र रखो!", {
                language: "hi-IN",
                voice: 'Polly.Aditi'
            });

            twimlResponse.redirect({ method: 'POST' }, `/ivr/get-name?lang=${lang}`);
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
}

export default new IvrController();