// Creating Token and saving in cookies

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const expirationDate = new Date(
    Date.now() + process.env.COOKIES_EXPIRE * 24 * 60 * 60 * 1000
  );
  // options for cookies
  const options = {
    expires: expirationDate,
    httpOnly: true,
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;

