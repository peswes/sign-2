import connectDB from "../lib/db.js";
import User from "../models/User.js";
import StudyGroup from "../models/StudyGroup.js";
import jwt from "jsonwebtoken";

export default async function handler(req,res){

    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Authorization");

    if(req.method==="OPTIONS"){
        return res.status(200).end();
    }

    try{

        await connectDB();

        const auth=req.headers.authorization;

        if(!auth){

            return res.status(401).json({
                message:"No token"
            });

        }

        const token=auth.split(" ")[1];

        const decoded=jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user=await User.findById(decoded.id);

        if(!user){

            return res.status(404).json({
                message:"User not found"
            });

        }

        const group=await StudyGroup.findOne({
            course:user.course
        });

        if(!group){

            return res.status(404).json({
                message:"Study group not found"
            });

        }

        return res.status(200).json({

            user:{
                name:user.name,
                course:user.course
            },

            group

        });

    }catch(err){

        console.log(err);

        return res.status(500).json({
            message:"Server Error"
        });

    }

}