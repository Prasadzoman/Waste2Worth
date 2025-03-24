const mongoose=require('mongoose');
const initdata=require('./data');
const Listing=require('../models/listing.js');



async function main() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
        console.log("Database connected");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

const initDB=async ()=>{
    await Listing.deleteMany({});
    initdata.data= initdata.data.map((obj) => ({...obj, owner:"67d6d3509c0ea42c56e6b1e5"}))
    await Listing.insertMany(initdata.data);
    console.log("data was initialized");
};

main().then(initDB);