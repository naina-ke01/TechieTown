import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

test();
