const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aren';
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`[DATABASE] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DATABASE_ERROR] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
