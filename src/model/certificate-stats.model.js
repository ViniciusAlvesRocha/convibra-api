var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CertificateStatsSchema = new Schema({
    certificateId:{
        type:ObjectId,
        required:true
    },
    fingerPrint:{
        type:String,
        required:true
    },
    attr:{
        type:String,
        default:'overview'
    },
    date:{
        type: Date, 
        default: Date.now 
    }
});

var CertificateStats = mongoose.model('certificate_stats', CertificateStatsSchema);

module.exports = CertificateStats;