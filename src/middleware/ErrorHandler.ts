import { type Request, type Response, type NextFunction } from 'express';


export function errorhandler(err:any,req: Request, res: Response, next: NextFunction) {
const statusCode=res.statusCode ? res.statusCode : 500;
res.status(statusCode).json({
        success: false,
        message: err.message,
        // Development mein stack trace dikhayein, production mein nahi (security ke liye)
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  next();
}