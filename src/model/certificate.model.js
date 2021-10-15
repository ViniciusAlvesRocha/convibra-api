var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CertificateSchema = new Schema({
    batchID:{
        type: ObjectId,
        required: false
    },
    targetHash: {
        type: String,
        default: null
    },
    subAccountID: {
        type: ObjectId,
        required: false
    },
    /* templateId = Those templates id which are selected while issuing certificate*/
    templateID: {
        type: [Schema.ObjectId],
        ref: 'templates'
    },
    /* printableTemplateId = Those templates id whose forPrinting = yes */
    printableTemplateID: {
        type: [Schema.ObjectId],
        ref: 'templates'
    },
    /* printableFileId =  If printableTemplateId insert then only it will use */
    printableGeneratedFiles: {
        type: [{
            templateID: ObjectId,
            file: String
        }],
        default: []
    },
    /* fileId = According to selected templates, certificate files are generated. If issuer selects 2 templates then it will create 2 file. and that certificate file id is nothing but fileId */
    generatedFiles: {
        type: [{
            templateID: ObjectId,
            file: String
        }],
        default: []
    },
    /* issuedTo -> _id = Recipient Id, name = Recipient First Name + Last Name, email = Recipient Email */
    issuedTo: {
        _id: {
            type: Schema.ObjectId,
            ref: 'user'
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
    },
    /* issuedById = Issuer Id, who will issue the certificate for recipients */
    issuedBy: {
        _id: {
            type: Schema.ObjectId,
            ref: 'user'
        },
        address: {
            type: String,
            required: true
        }
    },
    convocationDate: {
        Lang1: {
            type: Date,
            required: true,
        },
        Lang2: {
            type: Date,
            required: true,
        }
    },
    course: {
        _id: {
            type: Schema.ObjectId,
            ref: 'course'
        },
        Lang1: {
            type: String,
            required: true,
        },
        Lang2: {
            type: String,
            required: true,
        }
    },
    /* issuanceTxHash = Transaction hash of blockchain */
    issuanceTxHash: {
        type: String,
        default:null
    },

    /* issue on blockchain job - When job takes the record for processing then it will become true, otherwise false */
    processingStatus: {
        type: Boolean,
        default: false,
        index: true
    },
    
    /* isClaimed = When recipient claim the certificate, it will be true */
    isClaimed: {
        type: Boolean,
        default: false
    },
    /* isRevoked = When issuer revokes certificate */
    isRevoked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['UNDER_PROGRESS', 'COMPLETED', 'FAILED'],
        default: 'UNDER_PROGRESS'
    },
    /* uploadDate = Certificate creation date */
    uploadDate: {
        type: Date,
        default: Date.now
    },
    /* expiryDate = issueDate + validity date in months */
    expiryDate: {
        type: Date,
        required: false
    },
    extraData: {
        type: Object,
        required: false
    },
    rawCertificate: {
        type: Object,
        default: () => { return {} }
    },
    signedCertificate: {
        type: Object,
        default: () => { return {} }
    },
    claimDetails:{
        claimDate: {
            type:Date,
            default:null
        },
        txHash: {
            type:String,
            default:null
        },
    },
    revocationDetails:{
        revocationDate: {
            type:Date,
            default:null
        },
        reason: {
            type:String,
            default:null
        },
        txHash: {
            type:String,
            default:null
        },
    }

});

var Certificate = mongoose.model('certificates', CertificateSchema);

module.exports = Certificate;