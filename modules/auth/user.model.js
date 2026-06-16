const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Role'
    },
    roles:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Role'
    }]
})

userSchema.pre('save', function() {
    if (this.roles && this.roles.length > 0) {
        if (!this.role) {
            this.role = this.roles[0];
        }
    } else if (this.role) {
        if (!this.roles || this.roles.length === 0) {
            this.roles = [this.role];
        }
    }
})

module.exports=mongoose.model('User',userSchema)