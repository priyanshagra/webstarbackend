const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'Priyanshisagoodb$oy';
const fetchuser=require("../middleware/fetchuser");
const nodemailer=require('nodemailer');
const crypto = require('crypto');

function generateOTP() {
  const otp = crypto.randomInt(1000000);
  return otp.toString().padStart(6, '0');
}
let otp;
let email1;





//second route for login
router.post('/login',[
    body('email','Enter a valid email').isEmail(),
    body('password','Password cannot be blank').exists(),
],async(req, res) => {
   let success= false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {email, password}=req.body;
    try{
        let user = await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({success,error:"Please try to login with corect credentials"});
        }

        const passwordcompare = await bcrypt.compare(password,user.password)
        if(!passwordcompare){
            return res.status(400).json({success,error:"Please try to login with corect credentials"});
        }

        const data ={
            user:{
                id:user.id
            }
          }
          const id=user.id;
          const name=user.name;
          const pic=user.pic;
          const maxexpense=user.maxexpense;
          const minexpense=user.minexpense;
          const maxsalary=user.maxsalary;
          const authtoken = jwt.sign(data, JWT_SECRET);
          success=true;
       res.json({success,authtoken,id,name,pic,maxexpense,minexpense,maxsalary});
    } catch (error){
        console.error(error);
        res.status(500).send("some error occured");
    }

})

//third route for user details

router.get('/getuser'
,fetchuser,async(req, res) => {
try{
    userId=req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
} catch (error){
    console.error(error.message);
    res.status(500).send("some error occured");
}

})

//fourth route for sending otp
router.post('/sendotp',[
    body('email','Enter a valid email').isEmail()
],(req,res)=>{
    otp=generateOTP();
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth: {
            user: 'trendtonee@gmail.com',
            pass: 'mznoxvotojeqgqyt'
        }
    });
    email1=req.body.email;
      const mailOptions ={
        from: '"Trendy Tone" trendtonee@gmail.com',
        to:req.body.email,
        subject: "OTP verification",
        text: `Your 6 digit OTP is ${otp}. It is one time otp only `,
      };
      let success;
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          success=false;
          res.status(500).send(error);
        } else {
          success=true;
          res.status(200).json({success});
        }
      });
    });


    router.post('/sendemailforgot',[
        body('email','Enter a valid email').isEmail()
    ],(req,res)=>{
        const transporter = nodemailer.createTransport({
            service:"gmail",
            auth: {
                user: 'trendtonee@gmail.com',
                pass: 'mznoxvotojeqgqyt'
            }
        });
          const mailOptions ={
            from: '"BudgetBuddy" trendtonee@gmail.com',
            to:req.body.email,
            subject: "Forgot Password",
            text: "Please send your new password with given email at only this email" 
          };
          let success;
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              success=false;
              res.status(500).json({success});
            } else {
              success=true;
              res.status(200).json({success});
            }
          });
        });

    router.post('/getotp',[
        body("otp","enter a valid otp").isLength({ min: 6})
    ],(req,res)=>{
        let success;
        if(req.body.otp===otp)
        {
          success=true;
            res.json({success});
        }
        else
        {
          success=false;
            res.json({success});
        }
    })


    router.post('/createuser',[
      body('name','Enter a valid name').isLength({ min: 3 }),
      body('id','Enter a valid id'),
      body('password','Enter a valid password').isLength({ min: 5 }),
      body('pic','Enter a valid url'),
      body('maxexpense','Enter a valid maxexpense'),
      body('minexpense','Enter a valid minexpense'),
      body('maxsalary','Enter a valid maxsalary'),
      body('minsalary','Enter a valid minsalary')
  ],
  async(req, res) => {
      let success=false;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array() });
      }
      try{
        const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password,salt);
        await User.findByIdAndUpdate(req.body.id,{
        name: req.body.name,
        password: secPass,
        maxexpense:req.body.maxexpense,
        minexpense:req.body.minexpense,
        maxsalary:req.body.maxsalary,
        minsalary:req.body.minsalary
      });
    
         success=true;
         res.json({success});
      }
      catch (error){
        console.error(error.message);
        res.status(500).send("some error occured");
      }
  }
  )
  
  router.post(
    '/createusergoogle',
    [
      body('name', 'Enter a valid name').isLength({ min: 3 }),
      body('email', 'Enter a valid email').isEmail(),
    ],
    async (req, res) => {
      let success = false;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
      }
  
      try {
        const email = req.body.email; // Correct the variable name to 'email'
        let user = await User.findOne({ email });
  
        if (!user) {
          // User doesn't exist, create a new entry
          user = await User.create({
            name: req.body.name,
            email: req.body.email,
          });
        }
  
        const data = {
          user: {
            id: user.id,
          },
        };
  
        const id = user.id;
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken, id });
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Some error occurred');
      }
    }
  );


  router.post(
    '/createuser2',
    [
      body('email', 'Enter a valid email').isEmail()
    ],
    async (req, res) => {
      let success = false;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
      }
  
      try {
        const email = req.body.email; // Correct the variable name to 'email'

  
        
          // User doesn't exist, create a new entry
         let user = await User.create({
            email: req.body.email,
          })
        
  
        const data = {
          user: {
            id: user.id,
          },
        };
  
        const id = user.id;
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken, id });
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Some error occurred');
      }
    }
  );


  
module.exports = router