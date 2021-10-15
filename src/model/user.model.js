var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    mobileNumber:{
        type:String,
        // required:true,
        trim:true
    },
    personalAddress:{
        type:String,
        // required:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    salt:{
        type:String,
        required:true
    },
    role:{
        type:String,
        // enum:['ROLE_ISSUER','ROLE_RECIPIENT','ROLE_VERIFIER','ROLE_DELEGATE_ADMIN','ROLE_SUPER_ADMIN','ROLE_SUB_ADMIN']
        enum:['ROLE_ISSUER','ROLE_RECIPIENT','ROLE_VERIFIER','ROLE_ACCOUNT_ADMIN','ROLE_SUB_ACCOUNT_ADMIN']
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    isEmailVerified:{
        type:Boolean,
        default:false
    },
    privateKey:{
        type:String,
        required:true
    },
    ethAddress:{
        type:String,
        required:true
    },
    encKey:{
        type:String,
        required:true
    },
    isAccountEnabled:{
        type:Boolean,
        default:true
    },
    issuerDetails:{
        subAccountID:{
            type:ObjectId,
            required:false
        }
    },
    recipientDetails:{
        additional:{
            type:Object,
            default:{}
        },
        courses:[{
            _id: {
                type:ObjectId,
                required:true,
            },
            nameLang1: {
                type:String,
                required:true,
            },
            nameLang2: {
                type:String,
                required:true,
            },
            convocationDateLang1: {
                type:Date,
                required:true,
            },
            convocationDateLang2: {
                type:String,
                required:true,
            },
            additional:{
                type:Object,
                default:{}
            }
        }]
    }

});

var User = mongoose.model('user', UserSchema);


module.exports = User;