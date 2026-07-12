import mongoose from "mongoose";

const StudyGroupSchema = new mongoose.Schema({

    course:{
        type:String,
        required:true,
        unique:true
    },

    title:{
        type:String,
        required:true
    },

    icon:String,

    description:String,

    mentor:String,

    meeting:String,

    project:String,

    members:{
        type:Number,
        default:0
    },

    online:{
        type:Number,
        default:0
    },

    roomId:String,

    announcement:String,

    banner:String

},{
    timestamps:true
});

export default mongoose.models.StudyGroup ||
mongoose.model("StudyGroup", StudyGroupSchema);