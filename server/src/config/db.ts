import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // 1. Force a crash if the environment variable is missing
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing!");
    }

    // 2. Connect using ONLY the environment variable
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
