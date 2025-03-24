const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const Listing = require("../models/listing");
const { isLoggedIn, isOwner } = require("../middleware");
const User = require("../models/user");
const mongoose = require("mongoose");

// ✅ Get All Listings
router.get("/", wrapAsync(async (req, res) => {
    const listings = await Listing.find({});
    res.render("listings/index", { listings });
}));

// ✅ Show New Listing Form
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

// ✅ Create New Listing (Includes all schema fields)
router.post("/", isLoggedIn, wrapAsync(async (req, res, next) => {
    console.log(req.body);

    let { title, description, image, price, country, location, category, quantity, licenceRequired } = req.body.listing;

    if (!title || !description || !image || !price || !location || !country || !category || quantity === undefined || licenceRequired === undefined) {
        throw new ExpressError(400, "All fields are required.");
    }

    const newListing = new Listing({
        title,
        description,
        image,  // ✅ Now it's a simple string
        price,
        location,
        country,
        category,
        quantity,
        licenceRequired: licenceRequired === "true",
        owner: req.user._id
    });

    await newListing.save();
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
}));

router.get("/filter", wrapAsync(async (req, res) => {
    let { category } = req.query; // Use req.query for GET requests

    if (!category || category === "") {
        req.flash("error", "Please select a category.");
        return res.redirect("/listings");
    }

    let listings = await Listing.find({ category });
    res.render("listings/index", { listings });
}));
router.get("/search", wrapAsync(async (req, res) => {
    let { name, location } = req.query;
    let query = {};

    if (name) {
        query.title = new RegExp(name, "i"); // Case-insensitive search
    }
    if (location) {
        query.location = new RegExp(location, "i"); // Case-insensitive search
    }

    let listings = await Listing.find(query);
    res.render("listings/index", { listings });
}));

// ✅ View Cart Page (Fixed duplicate route)
router.get("/cart", isLoggedIn, wrapAsync(async (req, res) => {
    let user = await User.findById(req.user._id).populate("cart");
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/listings");
    }
    res.render("listings/cart", { cartItems: user.cart });
}));

router.post("/cart/remove/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const itemId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/listings/cart");
    }

    // Remove the item from the user's cart
    user.cart = user.cart.filter(item => item.toString() !== itemId);
    await user.save();

    req.flash("success", "Item removed from cart.");
    res.redirect("/listings/cart");
}));

// ✅ Get Single Listing (Includes `owner` and `reviews`)
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid Listing ID");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id).populate("reviews").populate("owner");
    
    if (!listing) {
        req.flash("error", "Listing does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
}));

// ✅ Show Edit Form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid Listing ID");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
}));

// ✅ Update Listing
// ✅ Update Listing
router.put("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let { title, description, image, price, location, country, category, quantity, licenceRequired } = req.body.listing;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid Listing ID");
        return res.redirect("/listings");
    }

    await Listing.findByIdAndUpdate(id, {
        title,
        description,
        image, // ✅ Store as a simple string, just like in `POST /`
        price,
        location,
        country,
        category,
        quantity,
        licenceRequired: licenceRequired === "true"
    });

    req.flash("success", "Listing successfully updated");
    res.redirect(`/listings/${id}`);
}));


// ✅ Delete Listing
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid Listing ID");
        return res.redirect("/listings");
    }

    let list = await Listing.findByIdAndDelete(id);
    console.log(list);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
}));

// ✅ Add Listing to Cart (with Schema Validation)
// ✅ Add Listing to Cart
router.post("/:id/:userId/cart", isLoggedIn, wrapAsync(async (req, res) => {
    let { id, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
        req.flash("error", "Invalid Listing or User ID");
        return res.redirect("/listings");
    }

    let listing = await Listing.findById(id);
    let user = await User.findById(userId);

    if (!listing || !user) {
        req.flash("error", "Listing or User not found");
        return res.redirect("/listings");
    }

    // ✅ Optimized check using `.includes()` (since `cart` is an array of ObjectIds)
    if (!user.cart.includes(listing._id)) {
        user.cart.push(listing);
        await user.save();
        req.flash("success", "Item added to cart!");
    } else {
        req.flash("info", "Item already in cart.");
    }

    res.redirect("/listings/cart");
}));


module.exports = router;
