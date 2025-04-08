import mongoose from "mongoose";

const voterSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    constituency:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    electionId:{
        type:Number,
        required:true
    },
    voteraddress:{
        type:String,
        required:true
    },


})