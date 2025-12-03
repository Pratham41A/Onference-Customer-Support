import mongoose from "mongoose";    
export async function connectMongoDb() {    
  return  await mongoose.connect(process.env.MONGO_DB_URL, {
        dbName: process.env.MONGO_DB_NAME,
        appName: process.env.MONGO_APP_NAME,
    });
}