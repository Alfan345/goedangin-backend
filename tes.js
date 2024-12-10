require("dotenv").config();

console.log("Environment Variables:");
console.log({
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  INSTANCE_CONNECTION_NAME: process.env.INSTANCE_CONNECTION_NAME,
});
