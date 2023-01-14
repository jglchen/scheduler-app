import db from '@/lib/firestoreAdmin';
import {firestore} from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {User, DuplicateEmail, ErrorResponse} from '@/lib/types';
const APP_SECRET = process.env.NEXT_PUBLIC_JWT_APP_SECRET as string;
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<User | DuplicateEmail | ErrorResponse>) {
    try {
        if (req.method === 'POST'){
            const {email} = req.body;
            const entryQuery = await db.collection('scheduler').where('email', '==', email).get();
            if (!entryQuery.empty){
                res.status(200).json({duplicate_email: 1});
                return;
            }
            
            let {password} = req.body;
            password = await bcrypt.hash(password, 10);
            const user = {...req.body, password};
            const { id } = await db.collection('scheduler').add({...user, created: new Date().toISOString()});
            await db.collection('scheduler').doc('summary').update({users: firestore.FieldValue.increment(1)});
            const token = jwt.sign({ userId: id}, APP_SECRET);
            delete user.password;
            res.status(200).json({ id, ...user, token });
        }else{
            // Handle any other HTTP method
            res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
        }
    } catch (e) {
        res.status(400).end();
    }
}
