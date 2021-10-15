var Schema = global.mongoose.Schema;
var ObjectId = Schema.ObjectId;

var EmailTemplateSchema = new Schema({
    templateName:{
        type: String,
        required: true
    },
    templateSubject:{
        type: String,
        required: true
    },
    templateFrom:{
        type: String,
        required: true
    },
    templateFromEmail:{
        type: String,
        required: true
    },
    templateHtml:{
        type: String,
        required: true
    },
    templateVariables:{
        type:String,
        required:true
    }
});

var EmailTemplate = global.mongoose.model('email_templates', EmailTemplateSchema);

module.exports = EmailTemplate;