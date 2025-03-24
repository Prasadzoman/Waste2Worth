const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing');
const path = require('path')
const methodOveride = require("method-override")
const ejsMate = require('ejs-mate')
const wrapAsync=require('./utils/wrapAsync');
const ExpressError=require('./utils/ExpressError')
const Review=require('./models/review')
const listings=require("./routes/listings")
const review=require("./routes/review")
const session=require("express-session")
const flash=require("connect-flash")
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user");
const user=require("./routes/user")


const sessionOptions={
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
}

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/trade');

    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})
app.use(express.urlencoded({ extended: true }));
app.use(methodOveride("_method"));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")))
app.get('/', (req, res) => {
    res.send('server working');
})


app.use("/listings",listings);
//reviews
app.use("/listings/:id/reviews",review)
//users
app.use("/",user);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found"));
})
app.use((err, req, res, next) => {
    let {statusCode=500, message="something went wrong"}=err;
    res.render("error.ejs",{message});
})
app.listen(8080, () => {
    console.log("server running on port 8080")
})