import express, { type Express, type Request, type Response } from 'express';
import { errorhandler } from './middleware/ErrorHandler.js'; // .ts ki jagah .js ya extension hata dein (Node resolution ke liye better hai)
import { Auth } from './middleware/auth.middleware.js';
import cors from 'cors';
import sendotp from './utilis/email.ts';
import router from './routes/userRoutes.ts';

const app: Express = express();

// 1. CORS ko call karna zaroori hai
app.use(cors());

// 2. Body parser
app.use(express.json());

// Public Route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// Authentication routes (Signup/Login) - Yahan Auth middleware NAHI chahiye
app.use('/api/auth', router);

// Example: Agar aapko protected routes banane hain toh aap Auth aise use karenge
// app.use('/api/protected', Auth, protectedRouter);

// 3. Error Handler hamesha sabse last mein aana chahiye
app.use(errorhandler);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});