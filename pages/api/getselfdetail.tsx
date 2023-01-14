import db from '@/lib/firestoreAdmin';
import jwt from 'jsonwebtoken';
import {UserJwtPayload, User, UserData, NoAuthorization} from '@/lib/types';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<User | NoAuthorization>) {
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
        const doc = await db.collection('scheduler').doc(userId).get();
        if (!doc.exists) {
            res.status(200).json({no_authorization: 1});
            return;
        } 

        const user = {id: userId, ...doc.data()} as UserData;
        delete user.password;
        res.status(200).json({ ...user, token });
    } catch (e) {
        console.log(e);
        res.status(400).end();
    }
}                
