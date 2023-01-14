import db from '@/lib/firestoreAdmin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {UserJwtPayload, UserUpdate, NoAuthorization, ErrorResponse} from '@/lib/types';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<UserUpdate | NoAuthorization | ErrorResponse>) {
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
            let {password} = req.body;
            let updateObj;
            if (password){
                password = await bcrypt.hash(password, 10);
                updateObj = {...req.body, password};
            }else{
                updateObj = {...req.body};  
            }
            const result = await db.collection('scheduler').doc(userId).update(updateObj);
            res.status(200).json({user_update: 1});
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}
