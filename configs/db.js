const mongoose = require("mongoose")

const connectToDB = async ()=>{
  try {
    const connect = await mongoose.connect(process.env.DBURI,{
      useUnifiedTopology: true,
      useNewUrlParser: true,
      // useFindAndModify: false,
      // useCreateIndex: true,
    });
    console.log(`MONGODB CONNECTED:${connect.connection.host}`);
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}



module.exports = connectToDB