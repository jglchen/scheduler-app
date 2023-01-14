import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import {confirmMailOptions} from '@/lib/utils';
import {createGmailTransporter, outlookTransporter} from '@/lib/mailapi';
import {UserJwtPayload, Activity, NoAuthorization, ErrorResponse, MeetingTarget} from '@/lib/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import getConfig from "next/config";
const { serverRuntimeConfig } = getConfig();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Activity | NoAuthorization | ErrorResponse>) {    
    try {
        if (req.method === 'PUT'){
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

            const {userName, timezone, activity, activityObj} = req.body;
            const { id } = activity;
            delete activity.id;
 
            if (activity.sendConfirm && activity.meetingTargets.length > 0){
                let changeAppointTime = false;
                if (activity.startTime != activityObj.startTime || activity.endTime != activityObj.endTime){
                    changeAppointTime = true; 
                }    
                if (changeAppointTime){
                    for (let i = 0; i < activity.meetingTargets.length; i++){
                        activity.meetingTargets[i] = {name: activity.meetingTargets[i].name, email: activity.meetingTargets[i].email};
                    }    
                }
                const mailList = activity.meetingTargets.filter((item: MeetingTarget) => item.email && !item.send);
                if (mailList.length > 0){
                    const token = jwt.sign({ userId, id }, APP_SECRET);
                    const proto = req.headers["x-forwarded-proto"] ? "https": "http";
                    const fullUrl = `${proto}://${req.headers.host}/meetingaccept`;
                    const appointPeriod = {startTime: activity.startTime, endTime: activity.endTime};
                    const prevAppointPeriod = {startTime: activityObj.startTime, endTime: activityObj.endTime};
                    
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

                    for (let item of mailList){
                        try {
                            let mailOptions: any;
                            if (changeAppointTime){
                               mailOptions = confirmMailOptions(userName, item.email, appointPeriod, token, fullUrl, senderMail, timezone, activityObj);
                            }else{
                               mailOptions = confirmMailOptions(userName, item.email, appointPeriod, token, fullUrl, senderMail, timezone);
                            }
                        
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
                            const idx = activity.meetingTargets.findIndex((itm: any) => itm.email == item.email);
                            if (idx > -1){
                               activity.meetingTargets[idx] = {...activity.meetingTargets[idx], send: true};
                            }
                        }catch(e){
                            console.log(e);
                        }
                    }
                }
            }
            const currTime = new Date().toISOString();
            await db.collection('scheduler').doc(userId).collection('activities').doc(id).update({...activity, created: currTime});
            res.status(200).json({id, ...activity, created: currTime});
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        } 
    }catch(e){
       res.status(400).end();
    }
}
  