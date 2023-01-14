import db from '@/lib/firestoreAdmin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User, UserData, NoAccount, PasswdErr, ErrorResponse} from '@/lib/types';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<User | NoAccount | PasswdErr | ErrorResponse>) {
    try {
        if (req.method === 'POST'){
            const {email, password} = req.body;
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
            const valid = await bcrypt.compare(password, user.password!)
            if (!valid) {
                res.status(200).json({password_error: 1});
                return;
            }
            const token = jwt.sign({ userId: user.id }, APP_SECRET);
            res.status(200).json({ id: user.id, name: user.name, email: user.email, token });
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}    