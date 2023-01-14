import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import {passwdResetHTML} from '@/lib/utils';
import {NoAccount, ErrorResponse, UserData} from '@/lib/types';
import { createGmailTransporter, outlookTransporter } from '@/lib/mailapi';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

interface PasswdCheck {
    mail_sent: number;
    numForCheck: string;
    token: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PasswdCheck | NoAccount | ErrorResponse>) {
    try {
        if (req.method === 'POST'){
            const {email} = req.body;
            const entryQuery = await db.collection('scheduler').where('email', '==', email).get();
            if (entryQuery.empty){
                res.status(200).json({no_account: 1});
                return;
            }
            
            const arr: UserData[] = [];
            entryQuery.forEach(doc => {
                arr.push({id: doc.id, ...doc.data()} as UserData); 
            });
            const user = arr[0];
            const token = jwt.sign({ userId: user.id}, APP_SECRET);
            const numForCheck = (Math.random() * 1000000).toFixed();
            
            let emailTransporter: any;
            let senderMail: string;
            // Create the transporter with the required configuration
            try {
                emailTransporter = await createGmailTransporter();
                senderMail = serverRuntimeConfig.GMAIL_EMAIL as string;
            }catch(err){
                emailTransporter = outlookTransporter;
                senderMail = serverRuntimeConfig.SENDER_MAIL_USER as string;
            }
            // setup e-mail data, even with unicode symbols
            const mailOptions = {
                from: `"No Reply - Appointment Scheduler Application " <${senderMail}>`, // sender address (who sends)
                to: email, // list of receivers (who receives)
                subject: "Reset your password for Appointment Scheduler", // Subject line
                html: passwdResetHTML(numForCheck)
            };
            
            try {
                if (senderMail === serverRuntimeConfig.GMAIL_EMAIL){
                    await emailTransporter.sendMail(mailOptions);
                }else{
                    //Code for ordinary local development
                    //emailTransporter.sendMail(mailOptions);
                    
                    //Special code for Vercel
                    await new Promise((resolve, reject) => {
                        // verify connection configuration
                        emailTransporter.verify(function (error: any, success: any) {
                            if (error) {
                                console.log(error);
                                reject(error);
                            } else {
                                console.log("Server is ready to take our messages");
                                resolve(success);
                            }
                        });
                    });
    
                    await new Promise((resolve, reject) => {
                        // send mail
                        emailTransporter.sendMail( mailOptions, (err: any, info: any) => {
                            if (err) {
                                console.error(err);
                                reject(err);
                            } else {
                                console.log(info);
                                resolve(info);
                            }
                        });
                    });
    
                }
    
            }catch(e){
                //-----
            }
            res.status(200).json({mail_sent: 1, numForCheck, token});
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}    