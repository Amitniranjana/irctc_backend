
import bcrypt from 'bcrypt'
import PrismaClient from '@prisma/client'
const prisma = new PrismaClient()
export async function get(req) {

   try{
 const { firstname, lastname, email, password, confirmpassword } = req.body();
    if (!email || !firstname || !lastname || !password || !confirmpassword) {
        return Response.json({
            message: "all fields required"
        }).status(401)
    }
    if (password != confirmpassword) {
        return Response.json({
            message: "password does not match with confirm passwors"
        }).status(401)
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
        firstname,
        lastname,
        email,
        password: hashedPassword
    })
    console.log(newUser);

   }catch(err){
  return Response.json({
    message:"something went wrong"
  }).status(401)
   }
}