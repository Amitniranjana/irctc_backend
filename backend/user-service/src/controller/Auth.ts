
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import type { Request, Response } from 'express';
import sendOtp from '../../../notification-service/src/utilis/email.ts';
import { generateOtp } from '../utilis/generateOtp.ts';
import { NotificationProducer } from '../kafka/producer/notification.producer.ts'
import { generateAccessToken, generateRefreshToken } from '../utilis/generateTokens.ts';

const notificationProducer = new NotificationProducer()
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
    const otp = generateOtp().toString();
    const result = await notificationProducer.sendOtpEmail(email, otp, 10);


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
    return res.status(201).json({ message: 'otp sent successfully' })

  } catch (err) {
    console.error("Signup Error: ", err);
    return res.status(500).json({ message: 'Something went wrong' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const userData = await req.body();
    if (!userData) {
      return res.status(404).json({
        message: 'gmail and password must required'
      })
    }
    const user = await prisma.user.findUnique({
      where: { email: userData.data.email }
    })
    if (!user) {
      return res.status(404).json({
        message: 'pls check the gmail or pls signup first , user is not found in database'
      })
    }

    const isPasswordCorrect = await bcrypt.compare(userData.password, user.password as string);

    if (!isPasswordCorrect) {
      return res.status(404).json({
        message: 'pls check the password '
      })
    }
    return res.status(404).json({
      message: 'email and password is correct redirect to verify otp'
    })


  } catch (error) {
    console.log("error in sign-in")
    throw error
  }
}



export async function verifyOtp(req: Request, res: Response) {
  try {
    // 1. Fix: req.body is an object, not a function
    const { otp, email } = req.body;

    if (!otp || !email) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    // 2. Fetch OTP record from DB
    const otpRecord = await prisma.otp.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // 3. Security: Check if OTP has expired
    if (otpRecord.expiryTime && new Date() > new Date(otpRecord.expiryTime)) {
      await prisma.otp.delete({ where: { email } }); // Clean up expired OTP
      return res.status(400).json({
        message: "OTP has expired. Please request a new one.",
      });
    }

    // 4. Fix: Compare user plaintext OTP with hashed OTP from DB
    const isOtpCorrect = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOtpCorrect) {
      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
      });
    }

    // 5. Fetch associated user ID to pass complete payload
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const payload = {
      id: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 6. Security: Delete OTP record after successful verification
    await prisma.otp.delete({
      where: { email },
    });

    // 7. Set HTTP-Only Secure Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh", // Adjust to your actual refresh endpoint path
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      message: "Internal server error during OTP verification",
    });
  }
}