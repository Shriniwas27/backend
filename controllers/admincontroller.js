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

//done
export const createElection = async(req,res)=>{
try {
    const {name, description}= req.body;
    if (!name || !description || !startTime || !endTime) {
        return res.status(400).json({ message: 'Request body is missing' });
    }

    const contractelection = await electionContract.createElection(name, description);
    console.log(contractelection);
    const election = new electionmodel({
        name,
        description,
    });
    await election.save();
    res.status(200).json({
        success: true,
        message: 'Election created successfully',
        election,
        electionId: election._id
    });
} catch (error) {
    return res.status(500).json({
        success: false,
        message: 'Failed to create election',
        error: error.message,
        receivedBody: req.body,
        timestamp: new Date().toISOString()
    });
}
}

//done 
export const registerCandidate= async(req,res)=>{
    try {
       const {name, party,  constituency} = req.body;

       const electionCount = await contract.electionCount();
  console.log(`Total elections: ${electionCount}`);

  let eligibleElectionId = null;

  for (let i = 1; i <= electionCount; i++) {
    const [isActive, isEnded] = await contract.getElectionStatus(i);
    
    if (!isActive && !isEnded) {
      const election = await contract.elections(i);
      console.log(`Found eligible election: ID ${i} - ${election.name}`);
      eligibleElectionId = i;
      break;
    }
  }

  const tx = await contract.registerCandidate(
   eligibleElectionId,
   name,
   party
  );

  const receipt = await tx.wait();
  console.log(`
    Candidate registered successfully!
    Transaction Hash: ${receipt.transactionHash}
    Election ID: ${eligibleElectionId}
    Candidate: ${name} (${party})
    Block: ${receipt.blockNumber}
  `);

  const candidate= new candidatemodel({
    name,
    party,
    electionId:eligibleElectionId,
    constituency,
  })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to register candidate',
            error: error.message,
            receivedBody: req.body,
            timestamp: new Date().toISOString()
        });
    }
}

//done and working
export const sendotpvoter= async(req,res)=>{
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

//done
export const registerVoter = async (req, res) => {
  try {
    const { name, constituency, phone, otp, voterAddress } = req.body;

    if (!name || !voterAddress || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Name, voter address and OTP are required'
      });
    }

 
    if (!ethers.utils.isAddress(voterAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address'
      });
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
    
  
    const isOtpValid = await verifyOTP(formattedPhone, otp); 
    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    const electionCount = await electionContract.electionCount();
    let eligibleElectionId = null;

    for (let i = 1; i <= electionCount; i++) {
      const [isActive, isEnded] = await electionContract.getElectionStatus(i);
      
      if (!isActive && !isEnded) {
        const election = await electionContract.elections(i);
        eligibleElectionId = i;
        break;
      }
    }

    if (!eligibleElectionId) {
      return res.status(404).json({
        success: false,
        message: 'No eligible elections available for voter registration'
      });
    }

    const isRegistered = await electionContract.isVoterRegistered(eligibleElectionId, voterAddress);
    if (isRegistered) {
      return res.status(409).json({
        success: false,
        message: 'Voter is already registered for this election'
      });
    }

    const tx = await electionContract.registerVoter(eligibleElectionId, voterAddress);
    const receipt = await tx.wait();

    const voter = new votermodel({
        name,
        constituency,
        phone,
        electionId:eligibleElectionId,
        voteraddress:voterAddress,
    })

    return res.status(201).json({
      success: true,
      message: 'Voter registered successfully',
      data: {
        electionId: eligibleElectionId,
        voterAddress,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Voter registration error:', error);

    let errorMessage = 'Voter registration failed';
    if (error.reason) {
      errorMessage += `: ${error.reason}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};



export const startElection = async (req, res) => {
    try {
        const DURATION_MINUTES = 720; 
        
        const electionCount = await contract.electionCount();
        let electionId = null;
        let eligibleElection = null;

    
        for (let i = 1; i <= electionCount; i++) {
            const [isActive, isEnded] = await contract.getElectionStatus(i);
            if (!isActive && !isEnded) {
                const election = await contract.elections(i);
               
                if (election.candidateCount > 0) {
                    electionId = i;
                    eligibleElection = election;
                    break;
                }
            }
        }

        if (!electionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'No eligible elections found (must have candidates and not be active/ended)' 
            });
        }


        const tx = await contract.startElection(electionId, DURATION_MINUTES);
        const receipt = await tx.wait();

        const updatedElection = await contract.elections(electionId);

        return res.status(200).json({
            success: true,
            message: 'Election started for 12 hours',
            data: {
                electionId,
                name: eligibleElection.name,
                duration: '12 hours',
                transactionHash: tx.hash,
                startTime: new Date(updatedElection.startTime * 1000).toISOString(),
                endTime: new Date(updatedElection.endTime * 1000).toISOString(),
                candidateCount: eligibleElection.candidateCount.toString()
            }
        });

    } catch (error) {
        console.error('Start election error:', error);
        
       
        let errorMessage = 'Failed to start election';
        if (error.reason) {
            errorMessage = error.reason;
        } else if (error.message.includes('caller is not the admin')) {
            errorMessage = 'Only admin can start elections';
        } else if (error.message.includes('Election does not exist')) {
            errorMessage = 'Election not found';
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const endElection = async (req, res) => {
    try {
        const { electionId } = req.body;

        // Validate input
        if (!electionId || isNaN(electionId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid election ID is required' 
            });
        }

        // Check election exists and get status
        const [isActive, isEnded] = await contract.getElectionStatus(electionId);
        const election = await contract.elections(electionId);

        // Validate election state
        if (!isActive) {
            return res.status(400).json({ 
                success: false, 
                message: 'Election is not active' 
            });
        }
        if (isEnded) {
            return res.status(400).json({ 
                success: false, 
                message: 'Election has already ended' 
            });
        }
        if (block.timestamp < election.endTime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Election end time has not been reached' 
            });
        }

        // End the election
        const tx = await contract.endElection(electionId);
        const receipt = await tx.wait();

        // Get winner details
        const winnerId = await contract.getWinner(electionId);
        let winnerInfo = null;
        
        if (winnerId > 0) {
            const [id, name, party, votes] = await contract.getCandidateInfo(electionId, winnerId);
            winnerInfo = { id, name, party, votes: votes.toString() };
        }

        return res.status(200).json({
            success: true,
            message: 'Election ended successfully',
            data: {
                electionId,
                winner: winnerInfo,
                transactionHash: tx.hash,
                endTime: new Date().toISOString(),
                totalVotes: election.totalVotes.toString()
            }
        });

    } catch (error) {
        console.error('End election error:', error);
        
        // Handle specific revert reasons
        let errorMessage = 'Failed to end election';
        if (error.reason) {
            errorMessage = error.reason;
        } else if (error.message.includes('caller is not the admin')) {
            errorMessage = 'Only admin can end elections';
        } else if (error.message.includes('Election does not exist')) {
            errorMessage = 'Election not found';
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
