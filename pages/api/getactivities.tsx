import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
import {UserJwtPayload, Activities, NoAuthorization, Activity} from '@/lib/types';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<Activities | NoAuthorization>) {
    try {
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
        const {recent} = req.query;
        const result: Activity[] = [];
        let snapshot;
        if (recent){
           snapshot = await db.collection('scheduler').doc(userId).collection('activities').where('created', '>', recent).orderBy('created').get();
        }else{
           snapshot = await db.collection('scheduler').doc(userId).collection('activities').orderBy('created').get();
        }
        snapshot.forEach(doc => {
            result.push({id: doc.id, ...doc.data()} as Activity);
        });
        const removedact: string[] = [];
        let snapshot2;
        if (recent){
            snapshot2 = await db.collection('scheduler').doc(userId).collection('removedact').where('created', '>', recent).get();
         }else{
            snapshot2 = await db.collection('scheduler').doc(userId).collection('removedact').get();
         }
         snapshot2.forEach(doc => {
            removedact.push(doc.id);
         });
         res.status(200).json({result, removedact});
    } catch (e) {
        res.status(400).end();
    }
}        