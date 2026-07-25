import express, { type Express, type Request, type Response } from 'express';
import {errorhandler} from './middleware/ErrorHandler.ts'
import { Auth } from './middleware/auth.middleware.ts';
import cors from 'cors'

const app: Express = express();
app.use(Auth)
app.use(cors)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');

});
app.use(errorhandler)
app.listen(3000,()=>{
    console.log("server is running on port 3000");
});