const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');
require('colors');

const connectDb = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
        console.log(`Mongodb Connected`.brightCyan.inverse);
    } catch (err) {
        console.log(err.message);
        //Exit
        process.exit(1);
    }
};

module.exports = connectDb;
