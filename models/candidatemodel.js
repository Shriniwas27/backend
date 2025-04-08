import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    party:{
        type:String,
        required:true
    },
    electionId:{
        type:Number,
        required:true
    }
    ,
    constituency:{
        type:String,
        required:true
    },
    votecount:{
        type:Number,
        default:0
    }    
})

export default mongoose.model("Candidate",candidateSchema)