const mongoose = require("mongoose");

// we bring the url from env file.
mongoose.connect(process.env.MONGOURL).then(function(){
    console.log("connected to mongodb");
})

module.exports = mongoose.connection;