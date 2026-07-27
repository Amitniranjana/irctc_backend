import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export function Auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header ? header.split(' ')[1] : undefined;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET as string);
        return next();
    } catch (erro) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}