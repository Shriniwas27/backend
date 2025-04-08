import mongoose from "mongoose";

const electionSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    startTime:{
        type:Number,
        required:true
    },
    endTime:{
        type:Number,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true
    },
    isEnded:{
        type:Boolean,
        required:true
    },
    candidateCount:{
        type:Number,
        required:true
    },
    voterCount:{
        type:Number,
        required:true
    },
    totalVotes:{
        type:Number,
        required:true
    },
    winningCandidateId:{
        type:Number,
        required:true
    }
})

export default mongoose.model("Election",electionSchema)