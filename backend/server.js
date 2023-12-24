const app = require("./app");
const dotenv = require("dotenv");
const connectDB = require("./config/databse");
const cloudinary = require("cloudinary");
// Handling UnCaught Error
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shuting down the server due to Unhandle Promise Rejection`);

  process.exit(1);
});

//config
dotenv.config({ path: "backend/config/.env" });

//connecting to DB
connectDB();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is listeing on http://localhost:${process.env.PORT}`);
});

// Unhandle Promise Rejection -->
//  NOTE: before this unhandle promise rejection to uncomment please make sure in database
//        file the catch block is commented or not if not commented the error are handled with those catch block

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shuting down the server due to Unhandle Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
