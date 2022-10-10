// ใช้งาน mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = new mongoose.Schema({
    
    user_name: { 
        type: String, 
        min: 6, 
        max: 30, 
        require: true 
    },  
    password: { 
        type: String, 
        min: 8, 
        max: 30, 
        require: true 
    },
    role: {
        type: String, 
        min: 8, 
        max: 30, 
        require: true 
    },

})

const UserModel = mongoose.model("users",userSchema)

module.exports = UserModel