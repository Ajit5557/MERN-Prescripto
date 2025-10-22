import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'; 
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay';

// API ro register user
const registerUser = async(req,res) => {
    try {

        const {name,email,password} = req.body

        if(!name || !password || !email){
            return res.json({success:false,message:"Missing Details"})
        }
        // validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Enter a valid email"})
        }
        // validating strong password
        if(password.length < 8){
            return res.json({success:false,message:"Enter a strong password"})
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const userData = {
            name,
            email,
            password:hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)

        res.json({success:true, token})
        


        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API for user login
const loginUser = async(req,res) => {
    try {

        const {email,password} = req.body
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({success:false,message:'User does not exist'})
        }
        const isMatch = await bcrypt.compare(password,user.password)

        if(isMatch){
            const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)
            res.json({success:true,token})
        }else{
            res.json({success:false,message:"Invalid Credentials"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to get user profile data
// const getProfile = async(req,res) => {
//     try {

//         // const {userId} = req.body
//         const {userId} = req.user

//         const userData = await userModel.findById(userId).select('-password')

//         res.json({success:true,userData})

//     } catch (error) {
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }


// chatgpt
const getProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID missing" });
    }

    // Use a different variable name here to avoid shadowing
    const userData = await userModel.findById(userId).select("-password");

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, userData });
  } catch (error) {
    console.error("💥 getProfile error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// API to update user profile
const updateProfile = async(req,res) => {
    try {
        const {userId, name, phone, address, dob, gender} = req.body
        const imageFile = req.file

        if(!name || !phone || !dob || !gender){
            return res.json({success:false, message:"Data Missing"})
        }

        await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address), dob, gender})

        if(imageFile){
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, {image:imageURL})

        }

        res.json({success:true, message:"Profile Updated"})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to book appointment
// const bookAppointment = async (req,res) => {
//     try{
//         const {userId, docId, slotDate, slotTime, } = req.body

//         const docData = await doctorModel.findById(docId).select('-password')

//         if(!docData.available){
//             return res.json({success:false, message:'Doctor not available'})
//         }

//         let slots_booked = docData.slots_booked

//         // checking for slot availability
//         if(slots_booked[slotDate]){
//             if(slots_booked[slotDate].includes(slotTime)){
//                 return res.json({success:false, message:'Doctor not available'})
//             }else{
//                 slots_booked[slotDate].push(slotTime)
//             }
//         }else{
//             slots_booked[slotDate] = []
//             slots_booked[slotDate].push(slotTime)
//         }

//         const userData = await userModel.findById(userId).select('-password')
//         delete docData.slots_booked

//         const appointmentData = {
//             userId,
//             docId,
//             userData,
//             docData,
//             amount:docData.fees,
//             slotTime,
//             slotDate,
//             date:Date.now()
//         }

//         const newAppointment = new appointmentModel(appointmentData)
//         await newAppointment.save()

//         // save new slots data in docData
//         await doctorModel.findByIdAndUpdate(docId,{slots_booked})
//         res.json({success:true,message:'Appointment Booked'})


//     }catch(error){
//         console.log(error)
//         res.json({success:false, message:error.message})
//     }
// }


const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing user ID" });
    }

    const userData = await userModel.findById(userId).select('-password');
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const docData = await doctorModel.findById(docId).select('-password');
    if (!docData || !docData.available) {
      return res.json({ success: false, message: 'Doctor not available' });
    }

    let slots_booked = docData.slots_booked || {};

    // Check slot availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Doctor not available at this slot' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [slotTime];
    }

    delete docData.slots_booked; // remove slots from docData before saving appointment

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Update doctor's booked slots
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'Appointment Booked' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// API to get user appointments for frontend my-appointments page
// const listAppointment = async(req,res) => {
//     try{
//         const {userId} = req.body
//         const appointments = await appointmentModel.find({userId})

//         res.json({success:true, appointments})

//     }catch(error){
//         console.log(error)
//         res.json({success:false, message:error.message})
//     }
// }


const listAppointment = async(req,res) => {
    try{
        const { userId } = req.user; // ✅ from JWT

        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authorized" });
        }

        const appointments = await appointmentModel.find({ userId });

        res.json({ success: true, appointments });

    }catch(error){
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
}

// API to cancel appointments
// const cancelAppointment = async(req,res) => {
//     try{
//         // const {userId, appointmentId} = req.body;

//         // chatgpt
//         const { appointmentId } = req.body;
//         const { userId } = req.user; // 🔥 get from token
        
//         const appointmentData = await appointmentModel.findById(appointmentId)

//         // verify appointment user
//         // if(appointmentData.userId !== userId){
//         //     return res.json({success:false, message:'Unauthorized action'})
//         // }

//         // chatgpt
//         if (!appointmentData) {
//         return res.json({ success: false, message: 'Unauthorized action' });
// }
//         await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})

//         // releasing doctor slot
//         const {docId, slotDate, slotTime} = appointmentData

//         const doctorData = await doctorModel.findById(docId)

//         let slots_booked = doctorData.slots_booked

//         slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

//         await doctorModel.findByIdAndUpdate(docId, {slots_booked})

//         res.json({success:true, message:'Appointment Cancelled'})

//     }catch(error){
//         console.log(error)
//         res.status(500).json({success:false,message:error.message})
//     }
// }



const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { userId } = req.user;

    console.log('📦 Received appointmentId:', appointmentId);
    console.log('👤 User ID from token:', userId);

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      console.log('❌ Invalid appointment ID format');
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      console.log('❌ Appointment not found for ID:', appointmentId);
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log('✅ appointmentData:', appointmentData);

    if (!new mongoose.Types.ObjectId(appointmentData.userId).equals(userId)) {
  console.log('❌ Unauthorized user trying to cancel appointment');
  return res.status(403).json({ success: false, message: 'Unauthorized action' });
}

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    if (!doctorData) {
      console.log('❌ Doctor not found for ID:', docId);
      return res.status(500).json({ success: false, message: 'Doctor not found' });
    }

    let slots_booked = doctorData.slots_booked;

    if (!Array.isArray(slots_booked[slotDate])) {
      console.log('❌ No slots found for date:', slotDate);
      return res.status(500).json({ success: false, message: 'Invalid slot data for doctor' });
    }

    slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime);

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    console.log('✅ Appointment cancelled successfully');
    return res.json({ success: true, message: 'Appointment Cancelled' });

  } catch (error) {
    console.error('❌ Server error in cancelAppointment:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// API to make payment of appointment using razorpay
const razorpayInstance = new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})

const paymentRazorPay = async(req,res) => {

    try{

    const {appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)

    if(!appointmentData || appointmentData.cancelled){
        return res.json({success:false, message:"Appointment cancelled or not found"})
    }

    // Creating options for razorpay payment
    const options = {
        amount: appointmentData.amount * 100,
        currency: process.env.CURRENCY,
        receipt: appointmentId,
    }

    // creation of an order
    const order = await razorpayInstance.orders.create(options)

    res.json({success:true, order})

    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }

}


// API to verify payment of razorpay
const verifyRazorpay = async(req,res) => {
    try{
        const {razorpay_order_id} = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        console.log(orderInfo)
        if(orderInfo.status === 'paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            res.json({success:true, message:"Payment Successfull"})
        }else{
            res.json({success:false,message:"Payment failed"})
        }

    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment,paymentRazorPay, verifyRazorpay}