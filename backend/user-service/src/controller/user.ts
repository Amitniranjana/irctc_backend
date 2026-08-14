import type{ Request ,Response}from 'express';
import { tokenParser } from '../utilis/tokenParser.ts';
import jwt, { type JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import redis from 'redis'
dotenv.config()

const prisma=new PrismaClient();

export async function getProfile(req:Request,res:Response){
    const accessKey=process.env.GENERATE_ACCESS_KEY;
    if(!accessKey){
        throw new Error('we dont get the key from .env in user.ts')
    }
    try {
        const rawString=req.headers.cookie;
        if(!rawString){
            throw new Error
        }
const tokenObj=await tokenParser(rawString);
const {accessToken }=tokenObj;
const decodedToken=jwt.verify(accessToken!,accessKey) as JwtPayload ;
if(!decodedToken?.id){
throw new Error('payload does not found in token')
}
const id=decodedToken.id;
const {email}=decodedToken

const user = await prisma.user.findUnique({
    where:{email}
})
if (!user) {
    return res.status(404).json({ error: "User not found with this email" });

}
const {password ,...savedUser}=user

// check data in redis if present then return that data

const redisStoredUser=await redis.get(`user:${id}`)
return res.status(200).json({
    message :"profile retrived successfukly",
   data:savedUser
})

    } catch (error) {

    }
}