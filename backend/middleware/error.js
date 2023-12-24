const ErrorHandler = require("../utils/errorHandler");

module.exports  = (err, req, res, next) => {
    // console.error(`Internal Server Error: ${err.stack}`);
    err.statusCode = err.statusCode || 404;
    err.message = err.message || "Internal Server Error ";


    // Wrong MongoDB Error like "CAST ERROR" id - http://localhost:4000/api/v1/product/656aea
    if(err.name === "CastError"){
        const message = `Resource Not Found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Duplicate Error:- "E11000 duplicate key error collection:
    if (err.code === 11000) { 
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
      }

    // Wrong JWT error
    if(err.name === "JsonWebTokenError"){
        const message = `JSON Web Token is invaild, Try again`;
        err = new ErrorHandler(message, 400);
    }

    // JWT Expire error
    if(err.name === "TokenExpiredError"){
        const message = `JSON Web Token is expired, Try again`;
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({ 
        success : false,
        message: err.message,
    });
  };