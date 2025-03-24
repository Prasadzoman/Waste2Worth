const express = require("express");
const router = express.Router();
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware");
const { isLoggedIn } = require("../middleware");
const Listing = require("../models/listing");

router.get("/signup", (req, res) => {
    res.render("users/signup");
});

router.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const reguser = await User.register(newUser, password);
        console.log(reguser);
        req.login(reguser, (err) => {
            if (err) {
                return next(err); // ✅ Ensure error is handled properly
            }
            req.flash("success", "Welcome");
            return res.redirect("/listings");
        });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/signup");
    }
}));

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.post("/login", saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome");

    let redirectUrl = req.session.redirectURL || "/listings"; // ✅ Ensure correct URL is used
    delete req.session.redirectURL; // ✅ Clear session variable after use

    res.redirect(redirectUrl);
});

router.get("/profile", isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("cart");
        res.render("users/profile", { user });
    } catch (err) {
        req.flash("error", "Could not load profile.");
        res.redirect("/listings");
    }
});

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out");
        res.redirect("/listings");
    });
});

router.get("/your-listings", isLoggedIn, async (req, res) => {
    try {
        const listings = await Listing.find({ owner: req.user._id });
        res.render("users/yourListings", { listings });
    } catch (err) {
        req.flash("error", "Could not load your listings.");
        res.redirect("/listings");
    }
});

module.exports = router;