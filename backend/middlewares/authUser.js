// import jwt from 'jsonwebtoken'

// // user authentication middleware
// const authUser = async(req,res,next) => {
//     try{

//         const {token} = req.headers
//         if(!token){
//             return res.json({success:false, message:"Not Authorised Login Again"})
//         }
//         const token_decode = jwt.verify(token,process.env.JWT_SECRET)

//         // req.body.userId = token_decode.id

        

//         //  ✅ FIX: Attach to req directly, not req.body
//          req.userId = token_decode.id;

//         next()
        
//     }catch(error){
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }

// export default authUser


// chatgpt
import jwt from "jsonwebtoken";
// import userModel from '../models/userModel.js';

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.id }; // Must match how token was signed
    next();
  } catch (error) {
    console.error("authUser error:", error);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};

export default authUser;

