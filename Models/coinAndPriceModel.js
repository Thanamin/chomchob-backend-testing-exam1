// ใช้งาน mongoose
const mongoose = require("mongoose");

let coinAndPriceSchema = new mongoose.Schema({

    coinName: { 
        type: String, 
        min: 6, 
        max: 30, 
        require: true 
    },  
    price: { 
        type: Number, 
        min: 0, 
        max: 10000000, 
        require: true 
    }, 

    // amount: { 
    //     type: Number, 
    //     min: 0, 
    //     // max: 30, 
    //     require: true 
    // }, 

    _id: {
        require: false
    }


})


// สร้าง Model
let coinAndPriceModel = mongoose.model("coins",coinAndPriceSchema)


//ส่งออก Model
module.exports = coinAndPriceModel

module.exports.saveProduct = (coinAndPriceModel,data) => {
    coinAndPriceModel.save(data)
} 