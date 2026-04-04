const twilio = require("twilio");

// ✅ Twilio Credentials (Environment Variables से लोड करें)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// ✅ Twilio Client बनाएं
const client = new twilio(accountSid, authToken);

// ✅ SMS भेजने का Function
async function sendSMS(to, message) {
    try {
        const response = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to
        });
        console.log("✅ SMS Sent Successfully:", response.sid);
    } catch (error) {
        console.error("❌ Error Sending SMS:", error.message);
    }
}

module.exports = { sendSMS };
