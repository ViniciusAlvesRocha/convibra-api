var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var ShareSchema = new Schema({
    //Certificate Id
    certificateId:{
        type: Schema.ObjectId,
        ref: 'certificates',
    },
    //Recipient ID
    recipientId:{
        type: Schema.ObjectId,
        ref: 'user',
    },
    //Verifier Id
    verifierId:{
        type: Schema.ObjectId,
        ref: 'user',
    },
    //Verifier Email
    verifierEmail:{
        type:String,
        required:true
    },
    //Issuer Id
    issuerId:{
        type: Schema.ObjectId,
        ref: 'user',
    },
    //Current Date
    date: {
        type: Date, 
        default: Date.now 
    }
});

var Share = mongoose.model('certificate_shares', ShareSchema);

module.exports = Share;