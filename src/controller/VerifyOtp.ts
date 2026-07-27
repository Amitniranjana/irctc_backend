import type { Response , Request } from "express";
export async function VerifyOtp(req:Request, res:Response){
try{
const { firstname, lastname, email, password, confirmpassword } = req.body();
   const otp
}catch(err){
console.log("verify otp Error : ",err);
return res.status(404).json({
  message:"problem in verify otp"
})
}
}