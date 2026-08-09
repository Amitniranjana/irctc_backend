import jwt from "jsonwebtoken";
import { error } from "node:console";

export interface payloads {
    email: string,
    id: string;
}
export async function generateAccessToken(payload: payloads) {
    const key = process.env.GENERATE_ACCESS_KEY;
    if (!key) {
        throw new Error('problem in access secret key')
    }
    try {
      return jwt.sign(payload, key,{
        expiresIn:'15m'
      });

    } catch (error) {
        throw error;
    }
}

export async function generateRefreshToken(payload: payloads) {
    const key = process.env.GENERATE_REFRESH_KEY
    if (!key) {
        throw new Error('problem in refresh token')
    }
    try {
        return jwt.sign(payload, key,{
            expiresIn:'7d'
        });

    } catch (error) {
        throw error;
    }
}