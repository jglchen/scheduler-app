import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';
import {ActivityJwtPayload, NoAuthorization, AcceptInvitation, ErrorResponse, MeetingTarget} from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse<NoAuthorization | AcceptInvitation | ErrorResponse>) {
    try {
        if (req.method === 'POST'){
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
            const { userId, id } = jwt.verify(token, APP_SECRET) as ActivityJwtPayload;
            const doc = await db.collection('scheduler').doc(userId).collection('activities').doc(id).get();
            if (!doc.exists) {
                res.status(200).json({no_authorization: 1});
                return;
            }
            const mTargets = doc.data()?.meetingTargets.slice();
            const {email, confirm} = req.body;
            const idx = mTargets.findIndex((item: MeetingTarget) => item.email == email);
            if (idx > -1){
                mTargets[idx] = {...mTargets[idx], email, confirm};
            }
            const currTime = new Date().toISOString();
            await db.collection('scheduler').doc(userId).collection('activities').doc(id).update({meetingTargets: mTargets, created: currTime});   
            res.status(200).json({accept_invitation: 1});
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}
