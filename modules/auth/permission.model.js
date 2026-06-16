const mongoose=require('mongoose')

const permissionSchema=new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    module:{
        type:String,
        required:true
    }
    
},{
    timestamps:true
})   

const Permission=mongoose.model('Permission',permissionSchema)
module.exports=Permission