import electionmodel from "../models/electionmodel.js";
import candidatemodel from "../models/candidatemodel.js";
import votermodel from "../models/votermodel.js";
import { sendOTP, verifyOTP } from "../services/twilio.js";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();
import contractABI from "../contractABI/contractABI.js";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;
const electionContract = new ethers.Contract(contractAddress, contractABI, wallet);


export const sendotp= async(req,res)=>{
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is missing' });
        }
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }
        const phoneString = phone.toString();
        const cleanedPhone = phoneString.replace(/\D/g, '');
        if (cleanedPhone.length !== 10 && !(cleanedPhone.length === 12 && cleanedPhone.startsWith('91'))) {
            return res.status(400).json({ 
                message: 'Invalid Indian phone number format',
                expected: '10 digits or 12 digits starting with 91',
                received: phoneString
            });
        }

        const formattedPhone = cleanedPhone.length === 10 ? `+91${cleanedPhone}` : `+${cleanedPhone}`;
        await sendOTP(formattedPhone);
        
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            formattedPhone: formattedPhone
        });

    } catch (err) {
        console.error('OTP sending error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send OTP',
            error: err.message,
            receivedBody: req.body,
            timestamp: new Date().toISOString()
        });
    }
}

export const login = async(req,res)=>{

}

export const getallcandidates = async(req,res)=>{

}

export const vote = async(req,res)=>{

}

export const getvotespercandidate = async(req,res)=>{

}