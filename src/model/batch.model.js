var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var uuid = (require('uuid')).v4;

var BatchSchema = new Schema({
    subAccountID:{
        type:ObjectId,
        required:false
    },
    tag:{
        type:String,
        required:true,
        default:() => {
            return uuid();
        }
    },
    merkleRoot:{
        type:String,
        default: null
    },
    totalRecords:{
        type:Number,
        default:0
    },
    createdAt: {
        type:Date,
        required:false,
        default: Date.now
    }   
});

var Batch = mongoose.model('batch', BatchSchema);

module.exports = Batch;