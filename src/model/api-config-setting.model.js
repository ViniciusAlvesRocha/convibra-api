var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var APIConfigSchema = new Schema({
    subAccountAdminID:{
        type:ObjectId,
        required:false
    },
    apiUrl:{
        type:String,
        required:true
    },
    scheduleType:{
        type:String,
        enum:['DAILY','WEEKLY','MONTHLY']
    },
    scheduleTime:{
        type:String,
        required:true
    },
    headerName:{
        type:String,
        required:true
    },
    headerValue:{
        type:String,
        required:true
    },
    isEnabled:{
        type:Boolean,
        required:true
    }
});

var ApiConfig = mongoose.model('api_config_setting', APIConfigSchema);

module.exports = ApiConfig;

