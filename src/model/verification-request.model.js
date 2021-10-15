var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var VerificationRequestSchema = new Schema({
    verifierId:{
        type: Schema.ObjectId,
        ref: 'user',
    },
    certificateId:{
        type: Schema.ObjectId,
        ref: 'certificates',
    },
    issuerId:{
        type: Schema.ObjectId,
        ref: 'user',
    },
    /* Verifier will send this message to Issuer */
    requestMessage:{
        type:String
    },
    /* Issuer will send this message to verifier */
    responseMessage:{
        type:String
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

var VerificationRequest = mongoose.model('verification_requests', VerificationRequestSchema);

module.exports = VerificationRequest;