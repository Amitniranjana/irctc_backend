
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import type { Request, Response } from 'express';
import sendOtp from '../utilis/email.ts';
import { generateOtp } from '../utilis/generateOtp.ts';
import {NotificationProducer} from '../kafka/producer/notification.producer.ts'
const notificationProducer=new NotificationProducer()
export async function Signup(req: Request, res: Response) {
  try {
    const { firstname, lastname, email, password, confirmpassword } = req.body;
    if (!email || !firstname || !lastname || !password || !confirmpassword) {
      return res.status(400).json({ message: 'all fields required' });
    }
    if (password !== confirmpassword) {
      return res.status(400).json({ message: 'passwords do not match' });
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    })
    if (existingUser) {
      return res.status(409).json({
        message: "email already exist"
      })
    }
    const username = `${firstname} ${lastname}`
    const otp=generateOtp().toString();
    const result = await notificationProducer.sendOtpEmail(email ,otp,10);


    if (!result) {
      return res.status(404).json({
        message: "problem in genrating otp"
      })
    }
    const hashedOtp = await bcrypt.hash(otp.toString(), 12);
    // const expiryTime=new Date(Date.Now() + 5*60*1000);
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 5);
    const newOtp = await prisma.otp.upsert({
      where: {
        email: email
      },
      update: {
        otp: hashedOtp,
        expiryTime: expiryTime
      },
      create: {
        email: email,
        otp: hashedOtp,
        expiryTime: expiryTime
      }
    })
    return  res.status(201).json({ message: 'otp sent successfully' })

  } catch (err) {
  console.error("Signup Error: ", err);
    return res.status(500).json({ message: 'Something went wrong' })
  }
}