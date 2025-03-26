const mongoose=require('mongoose');
const { title } = require('process');
const review = require('./review');
const schema=mongoose.Schema;
const Review=require("./review");
const { type } = require('os');
const { ref } = require('joi');
const { url } = require('inspector');
const listingSchema=new schema({
    title:{ type:String, required:true},
    description:String,
    image: {
      url: String,
      filename: String,
    },
    price: { type: Number, required: true },
    location:String,
    country:String,
    quantity:{ type: Number, required: true },
    category:{ type: String, required: true },
    licenceRequired:{ type: Boolean, required: true },
    reviews:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Review",
      }
    ],
    owner:{
      type:schema.Types.ObjectId,
      ref:"User",
    }
});

listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({ _id: { $in: listing.reviews } })
  }
});
const Listing=mongoose.model("Listing",listingSchema)
module.exports=Listing;