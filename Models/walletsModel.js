// ใช้งาน mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


let walletSchema = new mongoose.Schema({

    user_name: {
        type: String, 
        min: 6, 
        max: 30, 
        // require: true 
    },
    BTC: {
        type: Number,
        min:0,
        // require: true
    },
    ETH: {
        type: Number,
        min:0,
        // max:1000
        // require: true
    },
    XRP: {
        type: Number,
        min:0,
        // require: true
    },
    LINK: {
        type: Number,
        min:0,
        // require: true
    },

    // _id: {
    //     require: false
    // }


})




// สร้าง Model
const WalletsModel = mongoose.model("wallets",walletSchema)


//ส่งออก Model
module.exports = WalletsModel

// module.exports.saveProduct = (WalletsModel,data) => {
//     WalletsModel.save(data)
// } 