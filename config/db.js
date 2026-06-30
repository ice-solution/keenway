const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 已連接');
  } catch (err) {
    console.error('MongoDB 連接失敗:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
