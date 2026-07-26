const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/userbase")
const userSchema= mongoose.Schema({
     name:String,
     username:String,
     email:String,
     password:String,
     posts:[
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'post'
        }
     ],
     profilepic:{
      type:String,
      default:"default.jpeg"
     }
}
)
module.exports=mongoose.model('user',userSchema)