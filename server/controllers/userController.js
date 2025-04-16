const mongoose = require('mongoose'); // Add this import
const User = require('../Model/User');
const Deposit = require('../Model/depositSchema');
const Widthdraw = require('../Model/widthdrawSchema');
const Trade = require("../Model/livetradingSchema");
const Upgrade = require("../Model/upgradeSchema");
const Verify = require("../Model/verifySchema");
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const path = require("path")
const fs = require('fs').promises;

// Unified handleErrors function
const handleErrors = (err) => {
  let errors = { email: '', password: '', fullname: '', account: '', country: '', gender: '', tel: '', currency: '' };

  // Handle duplicate email (MongoDB error code 11000)
  if (err.code === 11000) {
      errors.email = 'That email is already registered';
      return errors;
  }

  // Handle Mongoose validation errors (e.g., during registration)
  if (err.message.includes('user validation failed')) {
      Object.values(err.errors).forEach(({ properties }) => {
          errors[properties.path] = properties.message;
      });
      return errors;
  }

  // Handle login-specific errors (not applicable here, but kept for completeness)
  if (err.message === 'incorrect email') {
      errors.email = 'Incorrect email';
  } else if (err.message === 'incorrect password') {
      errors.password = 'Incorrect password';
  } else if (err.message === 'Your account is not verified. Please verify it or create another account.') {
      errors.email = err.message;
  }

  // Handle custom errors (e.g., missing fields)
  if (err.message === 'All fields are required') {
      errors.fullname = 'All fields are required';
  }

  return errors;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'piuscandothis', { expiresIn: maxAge });
};







module.exports.homePage = (req, res)=>{
res.render("index")
}

module.exports.aboutPage = (req, res)=>{
    res.render("about")
    }
    


    module.exports.contactPage = (req, res)=>{
        res.render("contact")
   }
        
   module.exports.affliatePage = (req, res)=>{
    res.render("affiliate_program")
    }
    
    module.exports.startguidePage = (req, res)=>{
        res.render("start_guide")
    }

     module.exports.licensePage = (req, res)=>{
        res.render("license")
   }
        
   module.exports.faqPage = (req, res)=>{
    res.render("faqs")
    }
    
    module.exports.termsPage = (req, res)=>{
        res.render("terms")
    }

    module.exports.registerPage = (req, res)=>{
        res.render("register")
    }

    module.exports.loginAdmin = (req, res) =>{
        res.render('loginAdmin');
    }
    
    const sendVerificationEmail = async (email, code) => {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: 'piuspolocha1231@gmail.com', // Replace with your Gmail address
            pass: 'nrdjzywfmarvykez'     // Replace with your Gmail App Password
        }
      });
  
      const mailOptions = {
          from: 'piuspolocha1231@gmail.com',
          to: email,
          subject: 'Email Verification Code',
          html: `<p>Your verification code is: <strong>${code}</strong><br>Please enter this code to verify your account.</p>`
      };
  
      await transporter.sendMail(mailOptions);
  };
  
      
//   module.exports.register_post = async (req, res) => {
//     console.log('Register request received:', req.body);
//     const { fullname, email, account, country, gender, tel, currency, password } = req.body;
    
//     try {
//         console.log('Validating fields...');
//         if (!fullname || !email || !account || !country || !gender || !tel || !currency || !password) {
//             throw Error('All fields are required');
//         }

//         console.log('Checking existing user...');
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ errors: { email: 'Email already exists' } });
//         }

//         console.log('Generating verification code...');
//         const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
//         const user = new User({
//             fullname, email, account, country, gender, tel, currency, password,
//             verificationCode
//         });

//         console.log('Saving user to database...');
//         const savedUser = await user.save(); // Save user immediately
//         console.log('Sending verification email...');
//         await sendVerificationEmail(email, verificationCode);
//         console.log('Storing user ID in session...');
//         req.session.pendingUserId = savedUser._id; // Store only the ID in session
//         res.status(201).json({ redirect: '/verify-email' });
//     }  catch (err) {
//       const errors = handleErrors(err);
//       if (errors.email === 'That email is already registered') {
//           req.flash('error', errors.email);
//       } else if (err.message === 'All fields are required') {
//           req.flash('error', 'All fields are required.');
//       } else {
//           req.flash('error', 'An unexpected error occurred during registration.');
//       }
//       res.status(400).json({ errors });
//   }
// };


module.exports.register_post = async (req, res) => {
  const { fullname, email, account, country, gender, tel, currency, password } = req.body;

  try {
      console.log('Register request received:', req.body);

      // Check for missing fields
      if (!fullname || !email || !account || !country || !gender || !tel || !currency || !password) {
          throw Error('All fields are required');
      }

      console.log('Generating verification code...');
      const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
      const user = new User({
          fullname, email, account, country, gender, tel, currency, password,
          verificationCode
      });

      console.log('Saving user to database...');
      const savedUser = await user.save();
      console.log('Sending verification email...');
      await sendVerificationEmail(email, verificationCode);
      console.log('Storing user ID in session...');
      req.session.pendingUserId = savedUser._id;
      res.status(201).json({ redirect: '/verify-email' });
  } catch (err) {
      const errors = handleErrors(err);
      console.error('Registration error:', { message: err.message, errors }); // Log errors for debugging
      if (errors.email === 'That email is already registered') {
          req.flash('error', errors.email);
      } else if (errors.fullname === 'All fields are required') {
          req.flash('error', 'All fields are required.');
      } else {
          req.flash('error', 'An unexpected error occurred during registration.');
      }
      res.status(400).json({ errors });
  }
};

module.exports.verifyEmailPage = (req, res) => {
  res.render('verify-email', { messages: req.flash() });
};

module.exports.verifyEmail_post = async (req, res) => {
  console.log('Verify email request received:', req.body);
  const { code } = req.body;
  const pendingUserId = req.session.pendingUserId;

  console.log('Pending user ID:', pendingUserId);
  if (!pendingUserId) {
      console.log('No pending user ID found, redirecting to register');
      req.flash('error', 'Session expired. Please register again.');
      return res.status(400).json({ redirect: '/register' });
  }

  try {
      console.log('Fetching user from database...');
      const user = await User.findById(pendingUserId);
      if (!user) {
          console.log('User not found in database');
          req.flash('error', 'User not found. Please register again.');
          return res.status(400).json({ redirect: '/register' });
      }

      console.log('Comparing codes:', code, user.verificationCode);
      if (code === user.verificationCode) {
          console.log('Updating user as verified...');
          user.isVerified = true;
          user.verificationCode = null; // Clear the code after verification
          await user.save();
          const token = createToken(user._id);
          res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
          req.session.pendingUserId = null; // Clear session
          console.log('Verification successful, redirecting to dashboard');
          res.status(200).json({ redirect: '/dashboard' });
      } else {
          console.log('Invalid verification code');
          req.flash('error', 'Invalid verification code');
          res.status(400).json({ errors: { code: 'Invalid verification code' } });
      }
  } catch (error) {
      console.error('Error in verifyEmail_post:', error);
      res.status(500).json({ errors: { server: 'Internal server error' } });
  }
};



// module.exports.verifyEmail_post = async (req, res) => {
//   const { code } = req.body;
//   const pendingUser = req.session.pendingUser;

//   if (!pendingUser) {
//       req.flash('error', 'Session expired. Please register again.');
//       return res.redirect('/register');
//   }

//   if (code === pendingUser.verificationCode) {
//       pendingUser.isVerified = true;
//       const savedUser = await pendingUser.save();
//       const token = createToken(savedUser._id);
//       res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
//       req.session.pendingUser = null;
//       res.status(200).json({ redirect: '/dashboard' });
//   } else {
//       req.flash('error', 'Invalid verification code');
//       res.status(400).json({ errors: { code: 'Invalid verification code' } });
//   }
// };

module.exports.loginPage = (req, res)=>{
    res.render("login")
}
const loginEmail = async (  email ) =>{
    
    try {
      const transporter =  nodemailer.createTransport({
        host: 'mail.globalflextyipsts.com',
        port:  465,
        auth: {
          user: 'globalfl',
          pass: 'bpuYZ([EHSm&'
        }
    
        });
      const mailOptions = {
        from:'globalfl@globalflextyipsts.com',
        to:email,
        subject: 'Your account has recently been logged In',
        html: `<p>Greetings,${email}<br>your trading account has just been logged in by a device .<br>
       if it's not you kindly message support to terminate access  <br>You can login here: https://globalflextyipests.com/login.<br>Thank you.</p>`
    }
    transporter.sendMail(mailOptions, (error, info) =>{
      if(error){
          console.log(error);
          res.send('error');
      }else{
          console.log('email sent: ' + info.response);
          res.send('success')
      }
  })
  
  
    } catch (error) {
      console.log(error.message);
    }
  }
  

//   module.exports.login_post = async(req, res) =>{
//     const { email, password } = req.body;

//     try {
//       const user = await User.login(email, password);
//       const token = createToken(user._id);
//       res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
//       res.status(200).json({ user: user._id });

//         // if(user){
//         //   loginEmail(req.body.email)
//         // }else{
//         //   console.log(error);
//         // }
//     } 
//     catch (err) {
//       const errors = handleErrors(err);
//       if (errors.email === 'Incorrect email') {
//           req.flash('error', 'Invalid email address.');
//       } else if (errors.password === 'Incorrect password') {
//           req.flash('error', 'Invalid password.');
//       } else if (errors.email === 'Your account is not verified. Please verify it or create another account.') {
//           req.flash('error', errors.email);
//       } else if (errors.email === 'That email is already registered') {
//           req.flash('error', errors.email); // This won't typically happen in login, but included for completeness
//       } else {
//           req.flash('error', 'An unexpected error occurred.');
//       }
//       res.status(400).json({ errors, redirect: '/login' });
//   }
// }

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.login(email, password);
      const token = createToken(user._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.status(200).json({ user: user._id });
  } catch (err) {
      const errors = handleErrors(err);
      if (err.message === 'incorrect email') {
          req.flash('error', 'Invalid email address.');
      } else if (err.message === 'incorrect password') {
          req.flash('error', 'Invalid password.');
      } else if (err.message === 'Your account is not verified. Please verify it or create another account.') {
          req.flash('error', err.message);
      } else if (err.message === 'Your account is suspended. If you believe this is a mistake, please contact support at support@vitacoininvestments.com.') {
          req.flash('error', err.message);
      } else {
          req.flash('error', 'An unexpected error occurred.');
      }
      res.status(400).json({ errors, redirect: '/login' });
  }
};

module.exports.dashboardPage = async(req, res) =>{
  const user = res.locals.user;
  res.render('dashboard', { user, showKycModal: !user.kycVerified });
}

module.exports.navbarPage = async(req, res)=>{
    res.render("navbarPage")
    }

module.exports.verifyPage = async(req, res)=>{
    res.render("verify")
}
// const verifyEmail = async (email,fullname ) =>{
    
//     try {
//       const transporter =  nodemailer.createTransport({
//         host: 'mail.globalflextyipsts.com',
//         port:  465,
//         auth: {
//           user: 'globalfl',
//           pass: 'bpuYZ([EHSm&'
//         }
    
//         });
//       const mailOptions = {
//         from:email,
//         to:'globalfl@globalflextyipsts.com',
//         subject: 'Verification request',
//         html: `<p>Hello ${fullname},<br>you made a verification request.<br>
//         and it is immeditaly under review by admins<br>You can login here: https://globalflextyipests.com/loginAdmin<br> to check your verification status.<br>Thank you.</p>`
//     }
//     transporter.sendMail(mailOptions, (error, info) =>{
//       if(error){
//           console.log(error);
//           res.send('error');
//       }else{
//           console.log('email sent: ' + info.response);
//           res.send('success')
//       }
//   })
  
  
//     } catch (error) {
//       console.log(error.message);
//     }
//   }


module.exports.verifyPage_post = async (req, res) => {
  let uploadedImages = [];
  let uploadPath;

  // Check if files are uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
      req.flash('error', 'No files were uploaded.');
      return res.redirect(`/verify/${req.params.id}`);
  }

  try {
      // Handle multiple files from 'images' input
      const files = req.files.images ? (Array.isArray(req.files.images) ? req.files.images : [req.files.images]) : [];
      const backImageFile = req.files.backImage; // Single back image

      // Process multiple front images
      if (files.length > 0) {
          for (const file of files) {
              const newImageName = `${Date.now()}-${file.name}`; // Unique name to avoid overwriting
              uploadPath = path.resolve('./public/IMG_UPLOADS') + '/' + newImageName;

              await file.mv(uploadPath); // Move file to upload directory
              uploadedImages.push(newImageName);
          }
      } else {
          req.flash('error', 'Please upload at least one front image.');deposit
          return res.redirect(`/verify/${req.params.id}`);
      }

      // Process back image (if provided)
      let backImageName = null;
      if (backImageFile) {
          backImageName = `${Date.now()}-${backImageFile.name}`;
          uploadPath = path.resolve('./public/IMG_UPLOADS/') + '/' + backImageName;
          await backImageFile.mv(uploadPath);
      }

      // Create new verification document
      const verification = new Verify({
          email: req.body.email,
         username: req.body.username,
         fullname: req.body.fullname,
         city: req.body.city, 
         gender: req.body.gender,
         dateofBirth: req.body.dateofBirth,
         marital: req.body.marital,
         age: req.body.age, 
         address: req.body.address,
          images: uploadedImages, // Array of image filenames
          backImage: backImageName, // Single back image filename
          owner: req.params.id
      });

      await verification.save();

      // Update user with verification reference
      const user = await User.findById(req.params.id);
      if (!user) {
          throw new Error('User not found');
      }
      user.verified = user.verified || []; // Ensure verified is an array
      user.verified.push(verification);
      user.kycVerified = true;
      await user.save();

      // Flash success message and redirect
      req.flash('success', 'Verification submitted successfully!');
      res.redirect('/dashboard');
  } catch (error) {
      console.error('Error during verification:', error);
      req.flash('error', 'An error occurred while submitting verification.');
      res.redirect('/verify')
      // res.redirect(`/verify/${req.params.id}`);
  }
};

// module.exports.verifyPage_post = async (req, res) => {
//     let uploadedImages = [];
//     let uploadPath;

//     // Ensure upload directory exists
//     const uploadDir = path.join(__dirname, '..', 'public', 'IMG_UPLOADS');
//     try {
//         await fs.mkdir(uploadDir, { recursive: true });
//         console.log('Upload directory:', uploadDir);
//     } catch (err) {
//         console.error('Error creating upload directory:', err);
//         req.flash('error', 'Server error: Unable to create upload directory.');
//         return res.redirect(`/verify/${req.params.id}`);
//     }

//     // Check if files are uploaded
//     if (!req.files || Object.keys(req.files).length === 0) {
//         req.flash('error', 'No files were uploaded.');
//         return res.redirect(`/verify/${req.params.id}`);
//     }

//     try {
//         // Handle multiple files from 'images' input
//         const files = req.files.images ? (Array.isArray(req.files.images) ? req.files.images : [req.files.images]) : [];
//         const backImageFile = req.files.backImage;

//         // Process multiple front images
//         if (files.length > 0) {
//             for (const file of files) {
//                 // Sanitize filename
//                 const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with _
//                 const newImageName = `${Date.now()}-${sanitizedName}`;
//                 uploadPath = path.join(uploadDir, newImageName);

//                 console.log('Saving front image to:', uploadPath);
//                 await file.mv(uploadPath);
//                 uploadedImages.push(newImageName);
//             }
//         } else {
//             req.flash('error', 'Please upload at least one front image.');
//             return res.redirect(`/verify/${req.params.id}`);
//         }

//         // Process back image (if provided)
//         let backImageName = null;
//         if (backImageFile) {
//             // Sanitize back image filename
//             const sanitizedBackName = backImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
//             backImageName = `${Date.now()}-${sanitizedBackName}`;
//             uploadPath = path.join(uploadDir, backImageName);
//             console.log('Saving back image to:', uploadPath);
//             await backImageFile.mv(uploadPath);
//         }

//         console.log('Uploaded images:', uploadedImages);
//         console.log('Back image:', backImageName);

//         // Create new verification document
//         const verification = new Verify({
//             email: req.body.email,
//             username: req.body.username,
//             fullname: req.body.fullname,
//             city: req.body.city,
//             gender: req.body.gender,
//             dateofBirth: req.body.dateofBirth,
//             marital: req.body.marital,
//             age: req.body.age,
//             address: req.body.address,
//             images: uploadedImages,
//             backImage: backImageName,
//             owner: req.params.id
//         });

//         await verification.save();

//         // Update user with verification reference
//         const user = await User.findById(req.params.id);
//         if (!user) {
//             throw new Error('User not found');
//         }
//         user.verified = user.verified || [];
//         user.verified.push(verification);
//         user.kycVerified = true;
//         await user.save();

//         req.flash('success', 'Verification submitted successfully!');
//         res.redirect('/dashboard');
//     } catch (error) {
//         console.error('Error during verification:', error);
//         req.flash('error', 'An error occurred while submitting verification.');
//         res.redirect(`/verify/${req.params.id}`);
//     }
// };


module.exports.accountPage = async(req, res) =>{
//   const id = req.params.id
//   const user = await User.findById(id);
  res.render('account')
}

module.exports.editProfilePage = async(req, res)=>{
    res.render("editProfile")
}

module.exports.transactionPage = async(req, res)=>{
    res.render("transactions")
}


module.exports.livePage = async(req, res)=>{
  const user = res.locals.user;
    res.render("live",{ user, showKycModal: !user.kycVerified })
}
module.exports.livePage_post = async(req, res)=>{
    // const {type,currencypair, lotsize, entryPrice, stopLoss,  takeProfit, action} = req.body
    try {
        const liveTrade = new Trade({
            type: req.body.type,
            currencypair: req.body.currencypair, 
            lotsize: req.body.lotsize,
             entryPrice: req.body.entryPrice,
             stopLoss: req.body.stopLoss,
             takeProfit: req.body.takeProfit,
             action:req.body.action
        })
        liveTrade.save()
        const id = req.params.id;
        const user = await User.findById( id);
        user.livetrades.push(liveTrade)
        await user.save();

        res.render("liveHistory", {user})
       
    } catch (error) {
        console.log(error)
    }
}

module.exports.tradingHistory = async(req, res)=>{
    const id = req.params.id
    const user = await User.findById(id).populate("livetrades")
    res.render("liveHistory",{user})
  }
  

module.exports.upgradePage = async(req, res)=>{
  const user = res.locals.user;
    res.render("accountUpgrade",{user, showKycModal: !user.kycVerified })
}

// const upgradeEmail = async (  email, amount, method ) =>{
    
//     try {
//       const transporter =  nodemailer.createTransport({
//         host: 'mail.globalflextyipsts.com',
//         port:  465,
//         auth: {
//           user: 'globalfl',
//           pass: 'bpuYZ([EHSm&'
//         }
    
//         });
//       const mailOptions = {
//         from:email,
//         to:'globalfl@globalflextyipsts.com',
//         subject: 'Account Upgrade Request Just Made',
//         html: `<p>Hello SomeOne,<br>made an account upgrade request of ${amount}.<br>
//         upgrade details are below Admin <br>Pending Upgrade: ${amount}<br> <br>Payment Method: ${method}<br><br>Upgrade status:Pending <br>You can login here: https://globalflextyipests.com/loginAdmin<br> to approve the deposit.<br>Thank you.</p>`
//     }
//     transporter.sendMail(mailOptions, (error, info) =>{
//       if(error){
//           console.log(error);
//           res.send('error');
//       }else{
//           console.log('email sent: ' + info.response);
//           res.send('success')
//       }
//   })
  
  
  
//     } catch (error) {
//       console.log(error.message);
//     }
//   }
  


module.exports.upgradePage_post = async (req, res) => {
    let newImageName = null;
    let uploadPath;

    try {
     
        if (req.files && req.files.image) {
            const theImage = req.files.image;
            newImageName = `${Date.now()}-${theImage.name}`;
            uploadPath = path.resolve('./public/IMG_UPLOADS/') + '/' + newImageName;

            await theImage.mv(uploadPath);
        } else {
            req.flash('error', 'Please upload a proof of payment image');
            return res.redirect(`/deposit`);
        }


        // Validate required fields
        if (!req.body.Plan || !req.body.method) {
            req.flash('error', 'Plan and payment method are required.');
            return res.redirect('/dashboard');
        }

        // Get user from req.params.id
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/dashboard');
        }

        // Create new upgrade
        const upgrade = new Upgrade({
            Plan: req.body.Plan,
            method: req.body.method,
            image: newImageName,
            owner: user._id
        });

        // Save upgrade
        await upgrade.save();
        user.upgrades.push(upgrade._id); // Use _id explicitly
        await user.save();

        // Send success response
        req.flash('success', 'Your upgrade request is under review.');
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Error in upgradePage_post:', error);
        req.flash('error', 'An error occurred while processing your upgrade. Please try again.');
        res.redirect('/dashboard');
    }
};
  

module.exports.depositPage = async(req, res) =>{
  const user = res.locals.user;
    res.render('fundAccount',{ user, showKycModal: !user.kycVerified })
}

module.exports.widthdrawPage = async(req, res)=>{
  const user = res.locals.user;
    res.render("widthdrawFunds",{ user, showKycModal: !user.kycVerified })
}


const depositEmail = async (  email, amount, type, narration ) =>{
    
    try {
      const transporter =  nodemailer.createTransport({
        host: 'mail.globalflextyipsts.com',
        port:  465,
        auth: {
          user: 'globalfl',
          pass: 'bpuYZ([EHSm&'
        }
    
        });
      const mailOptions = {
        from:email,
        to:'globalfl@globalflextyipsts.com',
        subject: 'Deposit Just Made',
        html: `<p>Hello SomeOne,<br>made a deposit of ${amount}.<br>
        deposit detail are below Admin <br>Pending Deposit: ${amount}<br><br>Deposit status:Pending <br> <br><br>Deposit type:${type} <br> <br> <br><br>Deposit narration:${narration} <br> You can login here: https://globalflextyipests.com/loginAdmin<br> to approve the deposit.<br>Thank you.</p>`
    }
    transporter.sendMail(mailOptions, (error, info) =>{
      if(error){
          console.log(error);
          res.send('error');
      }else{
          console.log('email sent: ' + info.response);
          res.send('success')
      }
  })
  
  
  
    } catch (error) {
      console.log(error.message);
    }
  }
  

module.exports.depositPage_post = async (req, res) => {
    let newImageName = null;
    let uploadPath;

    // Validate user ID
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid user ID');
        return res.redirect('/dashboard');
    }

    // Validate amount
    const amount = Number(req.body.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
        req.flash('error', 'Please provide a valid deposit amount');
        return res.redirect(`/deposit`);
    }

    // Handle file upload
    try {
        if (req.files && req.files.image) {
            const theImage = req.files.image;
            newImageName = `${Date.now()}-${theImage.name}`;
            uploadPath = path.resolve('./public/IMG_UPLOADS/') + '/' + newImageName;

            await theImage.mv(uploadPath);
        } else {
            req.flash('error', 'Please upload a proof of payment image');
            return res.redirect(`/deposit`);
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/dashboard');
        }

        // Debug: Log user balance
        console.log('User before deposit:', {
            id: user._id,
            balance: user.balance,
            deposits: user.deposits
        });

        // Ensure balance is a valid number
        if (isNaN(user.balance)) {
            console.warn('Fixing invalid balance for user:', user._id);
            user.balance = 0; // Reset to default if corrupted
        }

        // Create deposit
        const deposit = new Deposit({
            type: req.body.type,
            amount: amount,
            status: 'pending',
            image: newImageName,
            narration: req.body.narration || 'Payment',
            owner: user._id
        });

        await deposit.save();

        // Update user's deposits
        user.deposits = user.deposits || [];
        user.deposits.push(deposit);

        // Do NOT update balance here (unless deposits are auto-approved)
        // If needed, uncomment and ensure it's safe:
        // user.balance = (user.balance || 0) + amount;

        await user.save();

        req.flash('success', 'Deposit request submitted successfully');
        res.redirect(`/depositHistory/${id}`);
    } catch (error) {
        console.error('Error in depositPage_post:', error);
        req.flash('error', 'An error occurred while submitting deposit');
        res.redirect(`/deposit`);
    }
};
  
 
  
  module.exports.depositHistory = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid user ID');
            return res.redirect('/dashboard');
        }

        const user = await User.findById(id).populate('deposits');
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/dashboard');
        }

        res.render('depositHistory', { user });
    } catch (error) {
        console.error('Error in depositHistory:', error);
        req.flash('error', 'An error occurred while loading deposit history');
        res.redirect('/dashboard');
    }
};
const widthdrawEmail = async (  email, amount, type, narration ) =>{
    
    try {
      const transporter =  nodemailer.createTransport({
        host: 'mail.globalflextyipsts.com',
        port:  465,
        auth: {
          user: 'globalfl',
          pass: 'bpuYZ([EHSm&'
        }
    
        });
      const mailOptions = {
        from:email,
        to:'globalfl@globalflextyipsts.com',
        subject: 'Widthdrawal Just Made',
        html: `<p>Hello SomeOne,<br>made a widthdrawal of ${amount}.<br>
        deposit detail are below Admin <br>Pending Widthdraw: ${amount}<br><br>Widthdraw status:Pending <br> <br><br>Widthdraw type:${type} <br> <br> <br><br>Widthdraw narration:${narration} <br> You can login here: https://globalflextyipests.com/loginAdmin<br> to approve the widthdrawal.<br>Thank you.</p>`
    }
    transporter.sendMail(mailOptions, (error, info) =>{
      if(error){
          console.log(error);
          res.send('error');
      }else{
          console.log('email sent: ' + info.response);
          res.send('success')
      }
  
  })
  } catch (error) {
      console.log(error.message);
    }
  }


module.exports.widthdrawPage_post = async (req, res) => {
  try {
      const id = req.params.id;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
          req.flash('error', 'Invalid user ID');
          return res.redirect('/widthdrawHistory/' + id);
      }

      const user = await User.findById(id);
      if (!user) {
          req.flash('error', 'User not found');
          return res.redirect('/widthdrawHistory/' + id);
      }

      const amount = Number(req.body.amount); // Extract and convert to number
      if (user.balance === 0 || user.balance < amount) {
          req.flash('error', 'Insufficient balance!');
          return res.redirect('/widthdrawHistory/' + id);
      }

      // Verify OTP
      if (!user.otp || user.otp !== Number(req.body.otp) || 
          (user.otpExpires && user.otpExpires < Date.now())) {
          req.flash('error', 'Invalid or expired OTP. Contact admin for OTP code.');
          return res.redirect('/widthdrawHistory/' + id);
      }

      const widthdraw = new Widthdraw({
          amount: amount,
          type: req.body.type,
          status: "pending",
          narration: req.body.narration || "Narration",
          owner: user._id
      });

      await widthdraw.save();
      user.balance -= amount; // Deduct amount from balance
      user.widthdraws.push(widthdraw);

      // Clear OTP after successful use
      user.otp = 0;
      user.otpExpires = null;
      await user.save();

      req.flash('success', 'Withdrawal request submitted successfully');
      res.redirect('/widthdrawHistory/' + id);
  } catch (error) {
      console.error('Error in widthdrawPage_post:', error);
      req.flash('error', 'An error occurred during withdrawal');
      res.redirect('/widthdrawHistory/' + req.params.id);
  }
};



module.exports.widthdrawHistory = async (req, res) => {
  const id = req.params.id;

  // Validate if id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid user ID');
      return res.redirect('/dashboard'); // Or another fallback page
  }

  try {
      const user = await User.findById(id).populate("widthdraws");
      if (!user) {
          req.flash('error', 'User not found');
          return res.redirect('/dashboard');
      }
      res.render('widthdrawHistory', { user });
  } catch (error) {
      console.error('Error in widthdrawHistory:', error);
      req.flash('error', 'An error occurred while loading withdrawal history');
      res.redirect('/dashboard');
  }
};
  

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
}




