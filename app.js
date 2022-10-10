// solution
const express = require("express");

const cors = require("cors");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");


const UserModel = require("./Models/userModel");
const coinAndPriceModel = require("./Models/coinAndPriceModel")
// const coinAmountModel = require("./Models/coinAmountModel")


const app = express();

//สร้างตัวแปรเก็บ token
let token;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoUrl =
  "mongodb+srv://test:test1234@testbymin.gc9kyey.mongodb.net/?retryWrites=true&w=majority";
app.use(async (req, res, next) => {
  try {
    await mongoose.connect(mongoUrl);
    next();
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//Declaring Custom Middleware
const ifNotLoggedIn = (req, res, next) => {
    if (!token) {
        return res.render('login')
    }
    next();
}

/// เช็ค role
app.get("/", ifNotLoggedIn ,(req, res, next) => {
    // UserModel.findOne({ user_name: req.body.user_name})
    if (token.role === 'admin') {
        return res.render('admin')
        // res.redirect('/') 
        // console.log(token)
      }else if (token.role === 'user') {
        return res.render('user')
        // res.redirect('/') 
        // console.log(token)
      }
});

/// user ใส่ login ไปเช็คกับ sever
app.post("/login",async (req, res) => {
  const userResult = await UserModel.findOne(
      { user_name: req.body.user_name }
  );
    //เช็ค username password และ set token
  if (!userResult) {
      res.status(400);
      return res.send("Username or password is not correct");
    }
  if (req.body.password != userResult.password) {
      res.status(400);
      res.send("Username or password is not correct");
    }
  if (req.body.password === userResult.password) {
      token = { user_name: userResult.user_name, role: userResult.role }
      res.redirect('/')
  }
});

// ดึงราคาปัจจุบัน
app.get("/coinPrice",(req,res)=>{
  coinAndPriceModel.find({},{"_id" : 0}).exec((err,data)=>{
    console.log(data)
    res.send(data)
  })
})


// // เพิ่มสกุลเงินใหม่ๆ ให้ user
// app.post("/addNewCoin",(req,res , next) => {

//   let newCoinData = new UserModel ({
//     user_name : req.body.user_name,
   
//   })

//   console.log(newCoinData)

//   // let checkData = UserModel.find({"user.coin" : "BTC"})
//   // console.log(checkData)
    

//   // if (checkData >= 1) {
//   //   console.log("มีข้อมูลอยู่ไม่สามารถเพิ่มได้")
//   // }
// })





// แก้ไขราคา coin
app.post("/editprice", async (req, res ,next) => {

    let data = new coinAndPriceModel({
        price: req.body.coinPrice,
        coinName: req.body.coinName
    })

    coinAndPriceModel.findOneAndUpdate({coinName: req.body.coinName},data).exec()
    console.log(data)

})


const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Start server at Port: ${PORT}`);
});
