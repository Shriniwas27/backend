const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendOTP = async (phoneNumber) => {
  return await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
    .verifications
    .create({ to: phoneNumber, channel: 'sms' });
};

exports.verifyOTP = async (phoneNumber, code) => {
  return await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
    .verificationChecks
    .create({ to: phoneNumber, code });
};