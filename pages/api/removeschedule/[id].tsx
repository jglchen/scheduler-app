import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import {removeScheduleOptions} from '@/lib/utils';
import {UserJwtPayload, NoAuthorization, RemoveDone, ErrorResponse} from '@/lib/types';
import {createGmailTransporter, outlookTransporter} from '@/lib/mailapi';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

export default async function handler(req: NextApiRequest, res: NextApiResponse<RemoveDone | NoAuthorization | ErrorResponse>) {
    try {
        if (req.method === 'DELETE'){
            //Check Authorization
            const {authorization} = req.headers;
            if (!authorization){
                res.status(200).json({no_authorization: 1});
                return;
            }
            const token = authorization.replace('Bearer ', '');
            if (!token){
                res.status(200).json({no_authorization: 1});
                return;
            }
            const { userId } = jwt.verify(token, APP_SECRET) as UserJwtPayload;
            if (!userId) {
                res.status(200).json({no_authorization: 1});
                return;
            } 
            const {id} = req.query;
            const {meetingTargets, sendConfirm, userName, startTime, endTime, timezone} = req.body;
            const currTime = (new Date()).getTime()/1000;
            if (sendConfirm && meetingTargets.length > 0 && startTime > currTime){
                const appointPeriod = {startTime, endTime};
                
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

                const mailOptionsArr = [];
                for (let item of meetingTargets){
                    if (item.email){
                       const mailOptions = removeScheduleOptions(userName, item.email, appointPeriod, timezone, senderMail);
                       mailOptionsArr.push(mailOptions);
                    }
                }

                try {
                    for (let mailOptions of mailOptionsArr){

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
                    }   
    
                }catch(e){
                    //-----
                }
            } 
            await db.collection('scheduler').doc(userId).collection('activities').doc(id as string).delete();
            await db.collection('scheduler').doc(userId).collection('removedact').doc(id as string).set({created: new Date().toISOString()});
            res.status(200).json({remove_done: 1});
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}        