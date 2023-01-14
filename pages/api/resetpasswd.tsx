import db from '@/lib/firestoreAdmin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import {UserJwtPayload, UserData, User, NoAuthorization, ErrorResponse} from '@/lib/types';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<User | NoAuthorization | ErrorResponse>) {
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
            const { userId } = jwt.verify(token, APP_SECRET) as UserJwtPayload;
            if (!userId) {
                res.status(200).json({no_authorization: 1});
                return;
            } 
            let {password} = req.body;
            password = await bcrypt.hash(password, 10);
            await db.collection('scheduler').doc(userId).update({password: password});
            const doc = await db.collection('scheduler').doc(userId).get();
            const user = {id: userId, ...doc.data(), token} as UserData;
            delete user.password;
            delete user.created;
            res.status(200).json(user);
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}
