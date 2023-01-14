import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
import {ActivityJwtPayload} from '@/lib/types';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'POST'){
            const {token} = req.body;
            const { userId, id } = jwt.verify(token, APP_SECRET) as ActivityJwtPayload;
            const docUser = await db.collection('scheduler').doc(userId).get();
            if (!docUser.exists) {
                res.status(200).json({no_meeting: 1});
                return;
            } 
            const userName =  docUser.data()?.name;
            const doc = await db.collection('scheduler').doc(userId).collection('activities').doc(id).get();
            if (!doc.exists) {
                res.status(200).json({no_meeting: 1});
                return;
            }
            res.status(200).json({userId, userName, id, ...doc.data()});
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}        