// solution
const express = require("express");

const cors = require("cors");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const UserModel = require("./Models/userModel");
const coinAndPriceModel = require("./Models/coinAndPriceModel");
const WalletsModel = require("./Models/walletsModel");

const app = express();

//สร้างตัวแปรเก็บ token
let token;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoUrl = "ใส่ URL MongoDB Database ตรงนี้";
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
    return res.render("login");
  }
  next();
};

/////////////////////////////////////////////
/// เช็ค role
app.get("/", ifNotLoggedIn, (req, res, next) => {
  // UserModel.findOne({ user_name: req.body.user_name})
  if (token.role === "admin") {
    return res.render("admin",{token:token});
  } else if (token.role === "user") {
    return res.render("user",{token:token});
  }
});
/////////////////////////////////////////////

/////////////////////////////////////////////
/// user ใส่ login ไปเช็คกับ sever
app.post("/login", async (req, res) => {
  const userResult = await UserModel.findOne({ user_name: req.body.user_name });
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
    token = { user_name: userResult.user_name, role: userResult.role };
    res.redirect("/");
  }
});
/////////////////////////////////////////////

/////////////////////////////////////////////
// ดึงราคาปัจจุบัน
app.get("/coinPrice", async (req, res) => {
  const coinsPrice = await coinAndPriceModel.find({}, { _id: 0 });
  res.send(coinsPrice);
  // console.log(coinsPrice);
});
/////////////////////////////////////////////

/////////////////////////////////////////////
// แก้ไขราคา coin
app.post("/editprice", async (req, res, next) => {
  let data = new coinAndPriceModel({
    price: req.body.coinPrice,
    coinName: req.body.coinName,
  });

  let findPriceCoin = await coinAndPriceModel.findOne({
    coinName: req.body.coinName,
  });

  try {
    data._id = findPriceCoin._id;
    await coinAndPriceModel
      .findOneAndUpdate({ coinName: req.body.coinName }, data)
      .exec();
    // console.log(data);
    res.send("edit success");
  } catch (error) {
    res.status(400).send(error);
    console.log("error");
  }
});
/////////////////////////////////////////////

/////////////////////////////////////////////
//เพิ่มเหรียญใหม่พร้อมราคาเข้าระบบ
app.post("/addNewCoin", async (req, res, next) => {
  let newCoinData = new coinAndPriceModel({
    price: req.body.coinPrice,
    coinName: req.body.coinName,
  });
  let findNewCoin = await coinAndPriceModel.findOne({
    coinName: req.body.coinName,
  });

  if (!findNewCoin) {
    try {
      await newCoinData.save();
      res.send("add coin success");
      // console.log(newCoinData);
    } catch (error) {
      res.status(400).send(error);
      console.log("error");
    }
  } else {
    res.send("Coins are already in the system.");
  }
});
/////////////////////////////////////////////

/////////////////////////////////////////////
//เพิ่มจำนวนเหรียญใน wallet ให้user
app.post("/addCoinWallet", async (req, res, next) => {
  let newCoinInWalletData = new WalletsModel({
    user_name: req.body.user_name,
    BTC: req.body.BTC,
    ETH: req.body.ETH,
    XRP: req.body.XRP,
    LINK: req.body.LINK,
  });

  let findNewInWalletCoin = await WalletsModel.findOne({
    user_name: req.body.user_name,
  });

  // ถ้า user ไม่มี wallet ในระบบให้ create
  if (!findNewInWalletCoin) {
    try {
      await newCoinInWalletData.save();
      res.send("add coin in wallet success");
    } catch (error) {
      res.status(400).send(error);
      console.log("error");
    }

    ///ถ้า user มี wallet ในระบบให้ update แทน
  } else if (findNewInWalletCoin) {
    newCoinInWalletData._id = findNewInWalletCoin._id;
    try {
      // console.log(newCoinInWalletData);
      await WalletsModel.findOneAndUpdate(
        { user_name: req.body.user_name },
        newCoinInWalletData
      ).exec();
      res.send("update amount success");
    } catch (error) {
      res.status(400).send(error);
      console.log("error");
    }
  }
});
/////////////////////////////////////////////

/////////////////////////////////////////////
//ดึงจำนวนเหรียญที่มีอยู่ในระบบทั้งหมดมาแสดง
app.post("/summaryToken", async (req, res) => {
  let checkCoin = "$" + req.body.selectCoin;
  try {
    let sumCoin = await WalletsModel.aggregate([
      { $group: { _id: req.body.selectCoin, total: { $sum: checkCoin } } },
    ]);

    // console.log(sumCoin[0])
    res.send(sumCoin[0]);
  } catch (error) {
    res.status(400).send(error);
    console.log("error");
  }
});
/////////////////////////////////////////////

/////////////////////////////////////////////
// โอนเงินจาก Wallet1 -> Wallet2

// {
//   userOut: 'userA',
//   userIn: 'userB',
//   selectCoinOut: 'BTC',
//   selectCoinIn: 'BTC',
//   amount: '50'
// }

app.post("/transfer", async (req, res) => {
  let findWalletCoinOut = await WalletsModel.findOne({
    user_name: req.body.userOut,
  });
  let findWalletCoinIn = await WalletsModel.findOne({
    user_name: req.body.userIn,
  });

  let coinCheckUserCoinOut = req.body.selectCoinOut;
  let sendAmountCoinUserCoinOut = req.body.amount;

  //Tranfer BTC
  if (coinCheckUserCoinOut === "BTC") {
    if (sendAmountCoinUserCoinOut < findWalletCoinOut.BTC) {
      let sumUserCoinOut = findWalletCoinOut.BTC - +sendAmountCoinUserCoinOut;
      let sumUserCoinIn = findWalletCoinIn.BTC + +sendAmountCoinUserCoinOut;

      findWalletCoinOut.BTC = sumUserCoinOut;
      findWalletCoinOut._id = findWalletCoinOut._id;
      try {
        // console.log(findWalletCoinOut);
        await findWalletCoinOut.save();

        findWalletCoinIn.BTC = sumUserCoinIn;
        findWalletCoinIn._id = findWalletCoinIn._id;
        try {
          await findWalletCoinIn.save();
          res.send("send success");
        } catch (error) {
          res.status(400).send(error);
          console.log("wallet CoinIn can't receive");
        }
      } catch (error) {
        res.status(400).send(error);
        console.log("wallet CoinOut can't send");
      }
    } else {
      res.send("not enough token");
    }

    // Tranfer ETH
  } else if (coinCheckUserCoinOut === "ETH") {
    if (sendAmountCoinUserCoinOut < findWalletCoinOut.ETH) {
      let sumUserCoinOut = findWalletCoinOut.ETH - +sendAmountCoinUserCoinOut;
      let sumUserCoinIn = findWalletCoinIn.ETH + +sendAmountCoinUserCoinOut;

      findWalletCoinOut.ETH = sumUserCoinOut;
      findWalletCoinOut._id = findWalletCoinOut._id;
      try {
        // console.log(findWalletCoinOut);
        await findWalletCoinOut.save();

        findWalletCoinIn.ETH = sumUserCoinIn;
        findWalletCoinIn._id = findWalletCoinIn._id;
        try {
          await findWalletCoinIn.save();
          res.send("send success");
        } catch (error) {
          res.status(400).send(error);
          console.log("wallet CoinIn can't receive");
        }
      } catch (error) {
        res.status(400).send(error);
        console.log("wallet CoinOut can't send");
      }
    } else {
      res.send("not enough token");
    }

    // Tranfer XRP
  } else if (coinCheckUserCoinOut === "XRP") {
    if (sendAmountCoinUserCoinOut < findWalletCoinOut.XRP) {
      let sumUserCoinOut = findWalletCoinOut.XRP - +sendAmountCoinUserCoinOut;
      let sumUserCoinIn = findWalletCoinIn.XRP + +sendAmountCoinUserCoinOut;

      findWalletCoinOut.XRP = sumUserCoinOut;
      findWalletCoinOut._id = findWalletCoinOut._id;
      try {
        // console.log(findWalletCoinOut);
        await findWalletCoinOut.save();

        findWalletCoinIn.XRP = sumUserCoinIn;
        findWalletCoinIn._id = findWalletCoinIn._id;
        try {
          await findWalletCoinIn.save();
          res.send("send success");
        } catch (error) {
          res.status(400).send(error);
          console.log("wallet CoinIn can't receive");
        }
      } catch (error) {
        res.status(400).send(error);
        console.log("wallet CoinOut can't send");
      }
    } else {
      res.send("not enough token");
    }
  }
});
/////////////////////////////////////////////
// โอนเงิน userA to userB
app.post("/usersend", async (req, res) => {
  // console.log(token)

  let findWalletCoinOut = await WalletsModel.findOne({
    user_name: token.user_name,
  });

  // console.log(findWalletCoinOut)

  let findWalletCoinIn = await WalletsModel.findOne({
    user_name: req.body.userIn,
  });

  let coinCheckUserCoinOut = req.body.selectCoinOut;
  let sendAmountCoinUserCoinOut = req.body.amount;

  if (coinCheckUserCoinOut === "BTC") {
    if (sendAmountCoinUserCoinOut < findWalletCoinOut.BTC) {
      let sumUserCoinOut = findWalletCoinOut.BTC - +sendAmountCoinUserCoinOut;
      let sumUserCoinIn = findWalletCoinIn.BTC + +sendAmountCoinUserCoinOut;

      findWalletCoinOut.BTC = sumUserCoinOut;
      findWalletCoinOut._id = findWalletCoinOut._id;
      try {
        // console.log(findWalletCoinOut);
        await findWalletCoinOut.save();

        findWalletCoinIn.BTC = sumUserCoinIn;
        findWalletCoinIn._id = findWalletCoinIn._id;
        try {
          await findWalletCoinIn.save();
          res.send("send success");
        } catch (error) {
          res.status(400).send(error);
          console.log("wallet CoinIn can't receive");
        }
      } catch (error) {
        res.status(400).send(error);
        console.log("wallet CoinOut can't send");
      }
    } else {
      res.send("not enough token");
    }
  } else if (coinCheckUserCoinOut === "ETH") {
    if (sendAmountCoinUserCoinOut < findWalletCoinOut.ETH) {
      let sumUserCoinOut = findWalletCoinOut.ETH - +sendAmountCoinUserCoinOut;
      let sumUserCoinIn = findWalletCoinIn.ETH + +sendAmountCoinUserCoinOut;

      findWalletCoinOut.ETH = sumUserCoinOut;
      findWalletCoinOut._id = findWalletCoinOut._id;
      try {
        // console.log(findWalletCoinOut);
        await findWalletCoinOut.save();

        findWalletCoinIn.ETH = sumUserCoinIn;
        findWalletCoinIn._id = findWalletCoinIn._id;
        try {
          await findWalletCoinIn.save();
          res.send("send success");
        } catch (error) {
          res.status(400).send(error);
          console.log("wallet CoinIn can't receive");
        }
      } catch (error) {
        res.status(400).send(error);
        console.log("wallet CoinOut can't send");
      }
    } else {
      res.send("not enough token");
    }
  } else if (coinCheckUserCoinOut === "XRP") {
    if (sendAmountCoinUserCoinOut < findWalletCoinOut.XRP) {
      let sumUserCoinOut = findWalletCoinOut.XRP - +sendAmountCoinUserCoinOut;
      let sumUserCoinIn = findWalletCoinIn.XRP + +sendAmountCoinUserCoinOut;

      findWalletCoinOut.XRP = sumUserCoinOut;
      findWalletCoinOut._id = findWalletCoinOut._id;
      try {
        // console.log(findWalletCoinOut);
        await findWalletCoinOut.save();

        findWalletCoinIn.XRP = sumUserCoinIn;
        findWalletCoinIn._id = findWalletCoinIn._id;
        try {
          await findWalletCoinIn.save();
          res.send("send success");
        } catch (error) {
          res.status(400).send(error);
          console.log("wallet CoinIn can't receive");
        }
      } catch (error) {
        res.status(400).send(error);
        console.log("wallet CoinOut can't send");
      }
    } else {
      res.send("not enough token");
    }
  }


})




/////////////////////////////////////////////
//Logout Website
app.post('/logout',(req,res,next)=>{
  token = null
  console.log(token)
  res.redirect('/')
})
/////////////////////////////////////////////


const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Start server at Port: ${PORT}`);
});
