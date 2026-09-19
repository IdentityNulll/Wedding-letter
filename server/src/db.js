import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy server/.env.example to server/.env.");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}
