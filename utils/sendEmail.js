const SibApiV3Sdk = require('sib-api-v3-sdk');
const dotenv = require('dotenv');
dotenv.config();

const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
    const transEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();
    
    const sender = {
      email: "taherbasha295@gmail.com",
      name: "BloodMatch",
    };
    
    const receivers = [{ email: toEmail }];
    
    const emailResponse = await transEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: subject,
      htmlContent: htmlContent
    });
    
    console.log(`Email sent to ${toEmail}`);
    return emailResponse;
  } catch (error) {
    console.error('Sendinblue email error:', error);
    throw error;
  }
};

module.exports = sendEmail;