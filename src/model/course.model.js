var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CourseSchema = new Schema({
    subAccountAdminID:{
        type:ObjectId,
        required:false
    },
    nameLang1:{
        type:String,
        required:true
    },
    nameLang2:{
        type:String,
        required:true
    },
    checksum:{
        type:String,
        required:false,
        default:'--'
    }   
});

var Course = mongoose.model('course', CourseSchema);

module.exports = Course;