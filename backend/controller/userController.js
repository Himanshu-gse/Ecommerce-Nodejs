const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "This is a Sample id",
      url: "Profile_url",
    },
  });

  sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invaild Email & Password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  // console.log("Stored Hash:", user.password);
  // console.log("Result of Comparison:", isPasswordMatched);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invaild Email & Password", 401));
  }

  // const token = user.getJWTToken();

  // res.status(200).json({
  //   success: true,
  //   token,
  // });
  sendToken(user, 200, res);
});

//logOut User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out Successful",
  });
});

// Forget Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  //Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your Password Reset Token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this Email then, Please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

//resetPassword
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //creating Token Hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is Invaild or has been Expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password doesn't Match", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // console.log(user)
  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invaild Email & Password", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password doesn't Match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  // console.log(user)
  sendToken(user, 200, res);
});

// Update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,

    // we will update the Avatar soon
  };

  const user = await User.findOneAndUpdate({_id: req.user.id}, newUserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  // console.log(user)
  res.status(200).json({
    success: true,
  });
});

// get all Users(Admin)
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users =  await User.find();

  res.status(200).json({
    success: true,
    users,
  });

})

// get Single Users(Admin)

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {

  const user = await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`User Does not exist ${req.params.id}`))
  }


  res.status(200).json({
    success: true,
    user,
  });
})

// Update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    };

  const user = await User.findOneAndUpdate({_id: req.params.id}, newUserData, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });

  // console.log(user)
  res.status(200).json({
    success: true,
  });
});

// Delete User -- Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  await user.deleteOne();

  // console.log(user)
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
