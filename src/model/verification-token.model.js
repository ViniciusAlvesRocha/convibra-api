var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var VerificationTokenSchema = new Schema({
    accountID:{
        type:ObjectId,
        required:false
    },
    token:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    type:{
        type:String,
        enum:['EMAIL_VERIFICATION','FORGOT_PASSWORD','RECIPIENT_CREATION']
    }
});

var VerificationToken = mongoose.model('verification_token', VerificationTokenSchema);

module.exports = VerificationToken;