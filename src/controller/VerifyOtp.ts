import type { Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
export async function VerifyOtp(req: Request, res: Response) {
  try {
    const { firstname, lastname, email, password, confirmpassword, otp } = req.body;
    if (!otp) {
      return res.status(404).json({
        message: "pls provide otp"
      })
    }
    const otpModel = await prisma.otp.findUnique({
      where: {
        email: email
      }
    })
    if (!otpModel) {
      return res.status(404).json({
        message: "problem in finding otp model in verify token"
      })
    }
    const expiry=otpModel.expiryTime;

    const currentTime=new Date();

    if(expiry<currentTime){
       return res.status(404).json({
      message:"otp is expired"
    })
    }
    const hashedOtp = otpModel.otp;
    const decodedOtp = await bcrypt.compare(otp, hashedOtp);
    if (!decodedOtp) {
      return res.status(404).json({
        message: "otp is incorrect"
      })
    }
const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        isVerified:true
      },
    });
    await prisma.otp.delete({
      where:{
        email:email
      }
    })
    return res.status(201).json({ message: 'signup successfully', user: newUser });

  } catch (err) {
    console.log("verify otp Error : ", err);
    return res.status(404).json({
      message: "problem in verify otp"
    })
  }
}