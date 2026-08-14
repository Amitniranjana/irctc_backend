import type { Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { tokenParser } from '../utilis/tokenParser.ts';
import { redisClient } from '../config/redis.ts';

dotenv.config();

const prisma = new PrismaClient();

export async function getProfile(req: Request, res: Response) {
  try {
    const accessKey = process.env.GENERATE_ACCESS_KEY;
    if (!accessKey) {
      return res.status(500).json({ error: "Server configuration error: Access key missing" });
    }

    const rawString = req.headers.cookie;
    if (!rawString) {
      return res.status(401).json({ error: "Unauthorized: Cookies missing" });
    }

    const tokenObj = await tokenParser(rawString);
    const { accessToken } = tokenObj;

    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized: Access token missing" });
    }

    // JWT Verification
    const decodedToken = jwt.verify(accessToken, accessKey) as JwtPayload;
    if (!decodedToken?.id) {
      return res.status(401).json({ error: "Unauthorized: Invalid token payload" });
    }

    const id = decodedToken.id;

    // 1. Check Redis Cache
    const redisStoredUser = await redisClient.get(`user:${id}`);
    if (redisStoredUser) {
      return res.status(200).json({
        message: "Profile retrieved successfully",
        data: JSON.parse(redisStoredUser),
      });
    }

    // 2. Fetch from Database using Primary Key (id)
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...savedUser } = user;

    // 3. Set Redis Cache with 1-Hour Expiration (TTL)
    const data = JSON.stringify(savedUser);
    await redisClient.set(`user:${id}`, data, {
      EX: 3600, // 3600 seconds = 1 hour
    });

    return res.status(200).json({
      message: "Profile retrieved successfully",
      data: savedUser,
    });

  } catch (error: any) {
    console.error("Problem in retrieving user profile:", error);

    // Handle JWT Verification errors specifically
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}