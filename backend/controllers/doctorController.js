import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
const changeAvailability = async(req,res) => {
    try{

        const {docId} = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available:!docData.available})
        res.json({success:true, message:'Availablity Changed'})

    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
} 

const doctorList = async (req,res) => {
    try{
        const doctors = await doctorModel.find({}).select(['-password','-email'])
        res.json({success:true,doctors})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// API for doctor Login
// const loginDoctor = async(req,res) => {
//     try{
//         const {email, password} = req.body;
//         const doctor = await doctorModel.findOne({email})
        
//         if(!doctor){
//             return res.json({success:false, message:'Invalid Credentials'})
//         }

//         const isMatch = await bcrypt.compare(password, doctor.password)

//         if(isMatch){
//             const token = jwt.sign({id:doctor._id},process.env.JWT_SECRET)
//             res.json({success:true, token})
//         }else{
//             res.json({success:false, message:'Invalid Credentials'})
//         }
//     }catch(error){
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }


// const loginDoctor = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.json({ success: false, message: 'Email and password are required' });
//     }

//     const doctor = await doctorModel.findOne({ email }).select('+password');

//     if (!doctor) {
//       return res.json({ success: false, message: 'Invalid Credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, doctor.password);

//     if (isMatch) {
//       const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
//       res.json({ success: true, token });
//     } else {
//       res.json({ success: false, message: 'Invalid Credentials' });
//     }
//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// };


const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res.json({ success: false, message: 'Invalid Credentials' });
    }

    // console.log('Password from request:', password);
    // console.log('Password from DB:', doctor.password);

    // Ensure both are strings
    const isMatch = await bcrypt.compare(String(password), String(doctor.password));

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// API For Reset PAssword
// const resetDoctorPassword = async (req, res) => {
//     console.log("Body received:", req.body);
//   const { email, newPassword } = req.body;

//   // Input validation
//   if (!email || !newPassword) {
//     return res.json({ success: false, message: 'Email and new password are required' });
//   }

//   try {
//     const hash = await bcrypt.hash(String(newPassword), 10);
//     const result = await doctorModel.findOneAndUpdate(
//       { email },
//       { password: hash },
//       { new: true }
//     );

//     if (result) {
//       res.json({ success: true, message: 'Password updated successfully' });
//     } else {
//       res.json({ success: false, message: 'Doctor not found' });
//     }
//   } catch (err) {
//     res.json({ success: false, message: err.message });
//   }
// };


// API to get doctor appointments for doctor panel
// const appointmentsDoctor = async(req,res) => {
//     try{
//         const {docId} = req.body
//         const appointments = await appointmentModel.find({docId})
//         res.json({success:true, appointments})
//     }catch(error){
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }

const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.doctor._id; // ✅ correct way to get authenticated doctor’s ID
    const appointments = await appointmentModel.find({ docId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};




// API to mark appointment completed for doctor panel
// const appointmentComplete = async(req,res) => {
//   try{
//     const {docId, appointmentId} = req.body;

//     const appointmentData = await appointmentModel.findById(appointmentId)
//     console.log("Appointment Data:", appointmentData);
// console.log("Appointment docId:", appointmentData?.docId);
// console.log("Provided docId:", docId);


//     if(appointmentData && appointmentData.docId === docId){
//       await appointmentModel.findByIdAndUpdate(appointmentId, {isCompleted:true})
//       return res.json({success:true, message:'Appointment Completed'})
//     }else{
//       return res.json({success:false, message:'Mark Failed'})
//     }
//   }catch(error){
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// }


// chatgpt
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctor._id.toString(); // get doctor id from authenticated doctor

    const appointmentData = await appointmentModel.findById(appointmentId);
    console.log("Appointment Data:", appointmentData);
    console.log("Appointment docId:", appointmentData?.docId.toString());
    console.log("Provided docId:", docId);

    if (appointmentData && appointmentData.docId.toString() === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: "Appointment Completed" });
    } else {
      return res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// API to cancel appointment for doctor panel
// const appointmentCancel = async(req,res) => {
//   try{
//     const {docId, appointmentId} = req.body;

//     const appointmentData = await appointmentModel.findById(appointmentId)

//     if(appointmentData && appointmentData.docId === docId){
//       await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})
//       return res.json({success:true, message:'Appointment Cancelled'})
//     }else{
//       return res.json({success:false, message:'Cancellation Failed'})
//     }
//   }catch(error){
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// }


// chatgpt
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctor._id.toString();

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
      return res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// API to get dashboard data for doctor panel
const doctorDashboard = async(req,res) => {
  try{
    // const {docId} = req.body
    const docId = req.doctor._id;
    const appointments = await appointmentModel.find({docId})
    let earnings = 0

    appointments.map((item) => {
      if(item.isCompleted || item.payment){
        earnings += item.amount
      }
    })

    let patients = []

    appointments.map((item) => {
      if(!patients.includes(item.userId)){
        patients.push(item.userId)
      }
    })

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0,5)
    }

    res.json({success:true, dashData})
  }catch(error){
    console.log(error)
    res.json({success:false,message:error.message})
  }
}


// API to get doctor profile for doctor panel
const doctorProfile = async(req,res) => {
  try{
    // const {docId} = req.body
    const docId = req.doctor._id;
    const profileData = await doctorModel.findById(docId).select('-password')

    res.json({success: true, profileData})

  }catch(error){
    console.log(error)
    res.json({success:false, message:error.message})
  }
}

// API to update doctor profile data from doctor panel
const updateDoctorProfile = async(req,res) => {
  try{
    const {docId, fees, address, available} = req.body

    await doctorModel.findByIdAndUpdate(docId, {fees,address, available})

    res.json({success:true, message:'Profile Updated'})
  }catch(error){
    console.log(error)
    res.json({success:false, message:error.message})
  }
}


export {changeAvailability,doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel,doctorDashboard,doctorProfile, updateDoctorProfile }