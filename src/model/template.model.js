var Schema = global.mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TemplateSchema = new Schema({
    subAccountID:{
        type: ObjectId,
        required: false,
        ref: 'user'
    },
    parentID:{
        type: ObjectId,
        default: null,
        ref: 'templates'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    language: {
        type: String,
        enum:['Lang1','Lang2'],
        required: true
    },
    certificateType:{
        type: String,
        enum: ["WEB","PRINT"],
        required: true
    },
    document: {
        type: String
    },
    previewPdf: {
        type: String,
        default:null
    },
    status:{
        type:String,
        enum:['UNDER_PROGRESS','COMPLETED','FAILED'],
        default:'UNDER_PROGRESS'
    }
});

var Template = global.mongoose.model('templates', TemplateSchema);

module.exports = Template;