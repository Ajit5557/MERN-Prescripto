// import jwt from 'jsonwebtoken'

// // doctor authentication middleware
// const authDoctor = async(req,res,next) => {
//     try{

//         const {dtoken} = req.headers
//         if(!dtoken){
//             return res.json({success:false, message:"Not Authorised Login Again"})
//         }
//         const token_decode = jwt.verify(dtoken,process.env.JWT_SECRET)

//         req.body.docId = token_decode.id

//         next()
        
//     }catch(error){
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }
// export default authDoctor;


import jwt from "jsonwebtoken";
import doctorModel from "../models/doctorModel.js";

const authDoctor = async (req, res, next) => {
  try {
    // console.log("AUTH HEADER:", req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    // console.log("Extracted Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded Token:", decoded);

    const doctor = await doctorModel.findById(decoded.id);
    if (!doctor) {
      return res.status(401).json({ success: false, message: "Unauthorized: Doctor not found" });
    }

    req.doctor = doctor;
    next();
  } catch (error) {
    console.error("authDoctor Error:", error.message);
    return res.status(401).json({ success: false, message: "Not Authorised Login Again" });
  }
};

export default authDoctor;
