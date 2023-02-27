require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
require("./db/conn");
const Register = require("./models/registers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("../src/middleware/auth");
const port = process.env.PORT || 3002;

const templatePath = path.join(__dirname, "../", "templates/views");
const partialsPath = path.join(__dirname, "../", "templates/partials");

app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());
app.use(cookieParser());

app.use(express.static(templatePath));
app.set("view engine", "hbs");
app.set("views", templatePath);
hbs.registerPartials(partialsPath);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;
    if (password === confirmpassword) {
      const registerEmployee = new Register({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        city: req.body.city,
        country: req.body.country,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword,
      });

      const token = await registerEmployee.generateAuthToken();
      console.log("token ===>", token);
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000),
        httpOnly: true,
      });
      const registered = await registerEmployee.save();
      res.status(201).render("login");
    } else {
      res.send("Passwords are not matching!");
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const useremail = await Register.findOne({ email });
    const isMatch = bcrypt.compare(password, useremail.password);

    const token = await useremail.generateAuthToken();
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 60000),
      httpOnly: true,
    });
    if (isMatch) {
      res.render("dashboard");
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (e) {
    res.status(400).send("Invalid Credentials");
  }
});

app.get("/secret", auth, (req, res) => {
  console.log("cookie", req.cookies.jwt);
  res.render("secret");
});

app.get("/dashboard", auth, (req, res) => {
  res.render("dashboard");
});

app.get("/logout", auth, async (req, res) => {
  try {
    res.clearCookie("jwt");
    console.log("logout successful");
    await req.user.save();
    res.render("index");
  } catch (e) {
    res.status(400).send(e);
  }
});

// const generateToken = async () => {
//   const token = await jwt.sign(
//     { _id: "63f6f2e6227e2984f8be7506" },
//     "sbdyuyuaeyucxyusyurehiyzhshiuehdiuhxiuzhsiuehiuhzxiuhiuchids"
//   );
//   console.log("token-", token);
// };

// generateToken();

app.listen(port, () => {
  console.log(`listening at port no - ${port}`);
});
