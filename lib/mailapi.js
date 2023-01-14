import nodemailer from 'nodemailer';
import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

//Gmail w/Oauth2
export const createGmailTransporter = async () => {
    const oauth2Client = new OAuth2(
      serverRuntimeConfig.GMAIL_CLIENT_ID,
      serverRuntimeConfig.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
  
    oauth2Client.setCredentials({
      refresh_token: serverRuntimeConfig.GMAIL_REFRESH_TOKEN
    });
  
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: serverRuntimeConfig.GMAIL_EMAIL,
        accessToken,
        clientId: serverRuntimeConfig.GMAIL_CLIENT_ID,
        clientSecret: serverRuntimeConfig.GMAIL_CLIENT_SECRET,
        refreshToken: serverRuntimeConfig.GMAIL_REFRESH_TOKEN
      }
    });
  
    return transporter;
};

//Outlook
export const outlookTransporter = nodemailer.createTransport({
    host: serverRuntimeConfig.SENDER_MAIL_HOST, // hostname
    secureConnection: serverRuntimeConfig.SECURE_CONNECTION, // TLS requires secureConnection to be false
    port: serverRuntimeConfig.SENDER_MAIL_PORT, // port for secure SMTP
    tls: {
        ciphers: serverRuntimeConfig.TLS_CIPHERS
    },
    auth: {
        user: serverRuntimeConfig.SENDER_MAIL_USER,
        pass: serverRuntimeConfig.SENDER_USER_PASSWORD
    }
});
