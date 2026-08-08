export function generateOtp(){
const otp=Math.floor(Math.random()*9000 + 1000);
return otp;
}