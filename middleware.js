const Listing=require("./models/listing");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectURL = req.originalUrl; // ✅ Store correct URL before redirecting
        req.flash("error", "You must be logged in");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectURL) {
        res.locals.redirectURL = req.session.redirectURL; // ✅ Corrected session reference
    }
    next(); // ✅ Ensure request moves forward
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate("owner"); // ✅ Populate owner field

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    if (!listing.owner || !req.user || !listing.owner._id.equals(req.user._id)) {  // ✅ Use req.user instead of res.locals.currUser
        req.flash("error", "You don't have permission to edit this listing.");
        return res.redirect(`/listings/${id}`);
    }
    
    next(); // ✅ Proceed if user is the owner
};
