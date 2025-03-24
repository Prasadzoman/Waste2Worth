const express=require("express");
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync")
const ExpressError=require("../utils/ExpressError")
const reviewSchema=require("../models/review");
const Listing = require("../models/listing");
const Review=require("../models/review")

router.post("/",wrapAsync(async(req,res)=>{
    const { rating, comment } = req.body.review;
    if (!rating || rating < 1 || rating > 5) {
        throw new ExpressError(400, "Rating must be between 1 and 5");
    }
    if (!comment || comment.trim().length === 0) {
        throw new ExpressError(400, "Comment cannot be empty");
    }
    if (comment.length > 500) {  // You can change 500 to any max length you prefer
        throw new ExpressError(400, "Comment is too long. Maximum length is 500 characters");
    }
    let listing=await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(400, "Listing not found.");
    }
    let newReview=new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    console.log("new review saved")
    req.flash("success","New Review Created");
    res.redirect(`/listings/${req.params.id}`);
}))

//delete review route

router.delete("/:reviewId",wrapAsync(async(req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted");
    res.redirect(`/listings/${id}`)
}))

module.exports=router