const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aren';
    
    // Set connection timeout and disable command buffering to fail fast
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
      bufferCommands: false, // Don't buffer commands when no connection
    });
    
    console.log(`[DATABASE] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[DATABASE_WARNING] ${error.message}`);
    console.warn('[DATABASE] Continuing without database - using mock data mode');
    
    // Set bufferCommands to false globally to fail fast instead of waiting
    mongoose.connection.off('disconnected', () => {});
    return null;
  }
};

module.exports = connectDB;
