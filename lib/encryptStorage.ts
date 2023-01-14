import { EncryptStorage } from 'encrypt-storage';

export const encryptStorage = new EncryptStorage(process.env.NEXT_PUBLIC_ENCRYPTION_SECRET as string);