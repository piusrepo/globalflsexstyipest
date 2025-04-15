
const jwt = require('jsonwebtoken')
const Deposit = require("../Model/depositSchema");
const User = require("../Model/User");
const Widthdraw = require("../Model/widthdrawSchema");
const Verify = require("../Model/verifySchema");
const Upgrade = require("../Model/upgradeSchema");
const Trade = require("../Model/livetradingSchema");
const nodemailer = require('nodemailer');


const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '', };

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }
  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }


  return errors;
}


const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'piuscandothis', {
    expiresIn: maxAge
  });
};


module.exports.loginAdmin_post = async(req, res) =>{
  try {
    const { email, password } = req.body;

    const user = await User.findOne({email: email});

    if(user){
    const passwordMatch = await (password, user.password);

    if (passwordMatch) {
      
      if(!user.role == "admin"){
        res.render('login', handleErrors('Email and password is incorrect') )
      }else{
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
      }
      
    } else {
      res.render('login', handleErrors() )
    }
    } else{
      res.render('login',handleErrors() )
    }
    
  } catch (error) {
    console.log(error)
  }
    
}

module.exports.adminNavbarPage = (req, res)=>{
  res.render("adminnavbarPage")
}


// *******************ADMIN DASHBOARD CONTROLLERS *************************//

// Email function for suspension notification
const sendSuspensionEmail = async (fullname, email, isSuspended) => {
  try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: 'piuspolocha1231@gmail.com', // Replace with your Gmail address
            pass: 'nrdjzywfmarvykez'     // Replace with your Gmail App Password
        }
      });
      const status = isSuspended ? 'suspended' : 'reactivated';
      const mailOptions = {
          from: 'piuspolocha1231@gmail.com',
          to: email,
          subject: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          html: `<p>Hello ${fullname},<br>Your account has been ${status}.<br>${
              isSuspended
                  ? 'If you believe this is a mistake, please contact support at support@vitacoininvestments.com.'
                  : 'You can now log in and access all features.'
          }<br>You can login here: https://vitacoininvestments.com/login.<br>Thank you.</p>`
      };
      await transporter.sendMail(mailOptions);
      console.log('Suspension email sent');
  } catch (error) {
      console.error('Error sending suspension email:', error.message);
  }
};


module.exports.adminPage = async(req, res) =>{
       let perPage = 100;
  let page = req.query.page || 1;
  
  try {
    const user = await User.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
    
    const count = await User.countDocuments({});
  
    res.render("adminDashboard", {
      user,
      current: page,
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
  }
    } 


    // New suspendUser function
module.exports.suspendUser = async (req, res) => {
  try {
      const user = await User.findById(req.params.id);
      if (!user) {
          req.flash('error', 'User not found');
          return res.redirect('/adminRoute');
      }

      // Toggle suspension status
      user.isSuspended = !user.isSuspended;
      await user.save();

      // Send email notification
      await sendSuspensionEmail(user.fullname, user.email, user.isSuspended);

      req.flash('success', `User ${user.isSuspended ? 'suspended' : 'reactivated'} successfully`);
      res.redirect('/adminRoute');
  } catch (error) {
      console.error('Error in suspendUser:', error);
      req.flash('error', 'Error updating user suspension status');
      res.redirect('/adminRoute');
  }
};


module.exports.viewUser = async(req, res) =>{
    try {
        const user = await User.findOne({ _id: req.params.id })
        res.render("viewUser",{
          user
        })
    
      } catch (error) {
        console.log(error);
      }
    
    }
  


    module.exports.editUser = async(req, res) =>{
      try {
          const user = await User.findOne({ _id: req.params.id })
      
          res.render('editUser', {
            user
          })
      
        } catch (error) {
          console.log(error);
        }
  }
const sendEmail = async ( fullname,email, available,  balance, bonus, widthdrawBalance,profit,totalDeposit,totalWidthdraw,verifiedStatus,account, session ) =>{
    
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
      subject: 'Dashboard Update',
      html: `<p>Greetings ${fullname},<br>Here are your availabe balances and your trading account status.<br>
      login to see your dashboard:<br>Email:${email}<br>Available balance: ${available}<br>Deposit Balance: ${balance}<br>Bonus:${bonus}<br>Widthdrawal Balance: ${widthdrawBalance}<br>Account Profit:${profit}<br>Total Deposit:${totalDeposit}<br>Total Widthdraw: ${totalWidthdraw}<br> Verification status: ${verifiedStatus}<br>Account Level: ${account}<br>trading sessions: ${session}<br><br>You can login here: https://globalflextyipests.com/loginAdmin<br>.<br>Thank you.</p>`
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
}catch (error) {
  console.log(error.message);
}

}



module.exports.editUser_post = async(req, res) =>{
    try {
        await User.findByIdAndUpdate(req.params.id,{
          fullname: req.body.fullname,
          tel: req.body.tel,
          email: req.body.email,
          country: req.body.country,
          gender: req.body.gender,
          account: req.body.account,
          session: req.body.session,
          balance: req.body.balance,
          available: req.body.available,
          bonus: req.body.bonus,
          widthdrawBalance: req.body.widthdrawBalance,
          profit: req.body.profit,
          totalDeposit: req.body.totalDeposit,
          totalWidthdraw: req.body.totalWidthdraw,
          btc_add: req.body.btc_add,
          eth_add: req.body.eth_add,
          usdt_add: req.body.usdt_add,
          verifiedStatus:req.body.verifiedStatus,
          
          updatedAt: Date.now()
        });

      
          //  if(User){
          // sendEmail(req.body.fullname,req.body.email, req.body.available, req.body.balance, req.body.bonus,req.body.widthdrawBalance, req.body.profit, req.body.totalDeposit,req.body.totalWidthdraw,req.body.signal, req.body.verifiedStatus,req.body.account, req.body.session )
          // }else{
          //   console.log(error);
          // }
          await res.redirect(`/editUser/${req.params.id}`);
          
          console.log('redirected');
        
      // } catch (error) {
      //   console.log(error);
      // }

        await res.redirect(`/editUser/${req.params.id}`);
        
        console.log('redirected');
      } catch (error) {
        console.log(error);
      }
    
}

module.exports.generateOTP = async (req, res) => {
  try {
      const user = await User.findById(req.params.id);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      
      // Set OTP and expiration (24 hours)
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Changed to 24 hours
      await user.save();

      res.json({ otp: otp, message: "OTP generated successfully" });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error generating OTP" });
  }
};


module.exports.deletePage = async(req, res) =>{
  try {
    await User.deleteOne({ _id: req.params.id });
      res.redirect("/adminRoute")
    } catch (error) {
      console.log(error);
    }
}

// *******************ALL DEPOSITS CONTROLLERS *************************//

module.exports.allDeposit = async(req, res) =>{
    let perPage = 100;
    let page = req.query.page || 1;

    try {
      const deposit = await Deposit.aggregate([ { $sort: { createdAt: -1 } } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec(); 
     

      res.render('allFunding',{
        deposit
      });

    } catch (error) {
      console.log(error);
    } 
}

module.exports.viewDeposit = async(req, res) =>{

  try {
    const deposit = await Deposit.findOne({ _id: req.params.id }).populate('owner');
    res.render('viewDeposits', { deposit });
} catch (error) {
    console.log(error);
    req.flash('error', 'Error loading deposit');
    res.redirect('/allFunding');
}
  

}

module.exports.editDeposit = async(req, res) =>{
    try {
        const deposit = await Deposit.findOne({ _id: req.params.id })
    
        res.render('editDeposit',{
          deposit
        })
    
      } catch (error) {
        console.log(error);
      }
  
}

module.exports.editDeposit_post  = async(req, res) =>{
    try {
        await Deposit.findByIdAndUpdate(req.params.id,{
          type: req.body.type,
          amount: req.body.amount,
          status: req.body.status,
          narration: req.body.narration,
          updatedAt: Date.now()
        });
        await res.redirect(`/editDeposit/${req.params.id}`);
        
        console.log('redirected');
      } catch (error) {
        console.log(error);
      }
    
}

module.exports.deleteDeposit = async(req, res) =>{
    try {
        await Deposit.deleteOne({ _id: req.params.id });
        res.redirect("/adminRoute")
      
    } catch (error) {
        console.log(error)
    }
    
}

// // *******************ALL WIDTHDRAWALS  CONTROLLERS *************************//

module.exports.allWidthdrawal = async(req, res) =>{
    let perPage = 100;
    let page = req.query.page || 1;

    try {
      const widthdraw = await Widthdraw.aggregate([ { $sort: { createdAt: -1 } } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec(); 
      // const count = await Widthdraw.count();

      res.render('allWidthdrawals',{
        widthdraw
      });

    } catch (error) {
      console.log(error);
    } 
}


module.exports.viewWidthdrawal = async (req, res) => {
  try {
      const widthdraw = await Widthdraw.findOne({ _id: req.params.id }).populate('owner');
      res.render('viewWidthdrawals', { widthdraw });
  } catch (error) {
      console.log(error);
      req.flash('error', 'Error loading withdrawal');
      res.redirect('/allWidthdrawals');
  }
};


module.exports.editWidthdrawal = async(req, res) =>{
    try {
        const widthdraw = await Widthdraw.findOne({ _id: req.params.id })
    
        res.render('editWidthdrawals',{
          widthdraw
        })
    
      } catch (error) {
        console.log(error);
      }
}

module.exports.editWidthdrawal_post = async(req, res) =>{
    try {
        await Widthdraw.findByIdAndUpdate(req.params.id,{
          amount: req.body.amount,
          type: req.body.type,
          status: req.body.status,
          narration: req.body.narration,
          updatedAt: Date.now()
        });
        await res.redirect(`/editWidthdrawals/${req.params.id}`);
        
        console.log('redirected');
      } catch (error) {
        console.log(error);
      }
    
}

module.exports.deleteWidthdraw = async(req, res) =>{
    try {
        await Widthdraw.deleteOne({ _id: req.params.id });
        res.redirect("/adminRoute")
      
    } catch (error) {
        console.log(error)
    }
}


// // *******************ALL VERIFICATION CONTROLLERS *************************//

module.exports.allVerification = async(req, res)=>{
    let perPage = 100;
    let page = req.query.page || 1;

    try {
      const verify = await Verify.aggregate([ { $sort: { createdAt: -1 } } ])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec(); 
      res.render('allVerification',{
        verify
      });

    } catch (error) {
      console.log(error);
    } 
}

module.exports.viewVerify = async(req, res)=>{
   try {
        const verify = await Verify.findOne({ _id: req.params.id })
    
    res.render("viewVerification",{verify})
    
    } catch (error) {
      console.log(error);
    }

}

module.exports.editVerify = async(req, res)=>{
  try {
        const verify = await Verify.findOne({ _id: req.params.id })
    
    res.render('editVerification',{verify})
    
          } catch (error) {
            console.log(error);
          }
}

module.exports.editVerify_post = async(req, res)=>{
  try {
    await Verify.findByIdAndUpdate(req.params.id,{
     email: req.body.email,
     username: req.body.username,
     fullname: req.body.fullname,
     city: req.body.city,
     gender: req.body.gender,
     dateofBirth: req.body.dateofBirth,
     marital: req.body.marital,
     age: req.body.age,
     address: req.body.address,
      updatedAt: Date.now()
    });
    await res.redirect(`/editVerification/${req.params.id}`);
    
    console.log('redirected');
  } catch (error) {
    console.log(error);
  }
}

module.exports.deleteVerification = async(req, res)=>{
  try {
    await Verify.deleteOne({ _id: req.params.id });
    res.redirect("/adminRoute")
  
} catch (error) {
    console.log(error)
}
}

// // *******************LIVETRADES CONTROLLERS *************************//

module.exports.alllivetradePage = async(req, res)=>{
  let perPage = 100;
  let page = req.query.page || 1;

  try {
    const livetrade = await Trade.aggregate([ { $sort: { createdAt: -1 } } ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec(); 
    // const count = await Widthdraw.count();

    res.render('allliveTrades',{
      livetrade
    });

  } catch (error) {
    console.log(error);
  } 
}

module.exports.viewlivetradePage= async(req, res)=>{
  try {
    const livetrade = await Trade.findOne({ _id: req.params.id })

res.render('viewallliveTrades',{
  livetrade
})
      } catch (error) {
        console.log(error);
      }
}


module.exports.editlivetradePage= async(req, res)=>{
  try {
    const livetrade = await Trade.findOne({ _id: req.params.id })

res.render('editallliveTrades',{
  livetrade
})
      } catch (error) {
        console.log(error);
      }
}

module.exports.editLivetrade_post = async(req, res)=>{
  try {
    await Trade.findByIdAndUpdate(req.params.id,{
      type: req.body.amount,
      currencypair: req.body.currencypair,
      lotsize: req.body.lotsize,
      entryPrice: req.body.entryPrice,
      stopLoss: req.body.stopLoss,
      takeProfit: req.body.takeProfit,
      action: req.body.action,
      updatedAt: Date.now()
    });
    await res.redirect(`/editVerification/${req.params.id}`);
    
    console.log('redirected');
  } catch (error) {
    console.log(error);
  }
}

module.exports.deleteLivetrade = async(req, res)=>{
  try {
    await Trade.deleteOne({ _id: req.params.id });
    res.redirect("/adminRoute")
  
} catch (error) {
    console.log(error)
}
}



// // *******************ACCOUNT UPGRADES CONTROLLERS *************************//

module.exports.allupgradesPage = async(req, res)=>{
  let perPage = 100;
  let page = req.query.page || 1;

  try {
    const upgrade = await Upgrade.aggregate([ { $sort: { createdAt: -1 } } ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec(); 
    // const count = await Widthdraw.count();

    res.render('allAccountsUpgrade',{
      upgrade
    });

  } catch (error) {
    console.log(error);
  } 
}


module.exports.viewUprgadesPage = async (req, res) => {
  try {
      const upgrade = await Upgrade.findOne({ _id: req.params.id }).populate('owner');
      res.render('viewallAccountsUpgrade', { upgrade });
  } catch (error) {
      console.log(error);
      req.flash('error', 'Error loading upgrade');
      res.redirect('/all-accountUpgrade');
  }
};

module.exports.editUpgradesPage = async(req, res)=>{
  try {
    const upgrade = await Upgrade.findOne({ _id: req.params.id })

res.render('editallAccountsUpgrade',{
  upgrade
})
      } catch (error) {
        console.log(error);
      }
}

module.exports.editUpgrade_post  = async(req, res)=>{
  try {
    await Upgrade.findByIdAndUpdate(req.params.id,{
      Plan: req.body.Plan,
      method: req.body.method,
      status: req.body.status,
      updatedAt: Date.now()
    });
    await res.redirect(`/editUpgrade/${req.params.id}`);
    
    console.log('redirected');
  } catch (error) {
    console.log(error);
  }
}

module.exports.deleteUpgrade = async(req, res)=>{
  try {
    await Upgrade.deleteOne({ _id: req.params.id });
    res.redirect("/adminRoute")
  
} catch (error) {
    console.log(error)
}
}
