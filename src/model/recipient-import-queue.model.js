var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var RecipientImportQueueSchema = new Schema({
    subAccountAdminID:{
        type:ObjectId,
        required:false
    },
    //This will be use for recipientImportType = CSV
    tag:{
        type:String,
        required:false
    },
    //This will be use for recipientImportType = CSV
    fileName:{
        type:String,
        required:false
    },
    jobProcessStatus:{
        type:String,
        enum:['PENDING','PROCESSING','SUCCEEDED',"FAILED"]
    },
    recipientImportType:{
        type:String,
        enum:['CSV','API']
    },
    stats:{
        startedAt:String,
        completedAt:String,
        totalRecords:String,
        validForImport:String,
        log:[String]
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

var RecipientImportQueue = mongoose.model('recipient_import_queue', RecipientImportQueueSchema);

module.exports = RecipientImportQueue;


