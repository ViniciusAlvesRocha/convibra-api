var Schema = global.mongoose.Schema;
var ObjectId = Schema.ObjectId;

var InstanceSettingSchema = new Schema({
    accountAdminId:{
        type: ObjectId,
        required: true
    },
    general : {
        
        logo: {
            type:String,
            default:null
        },
        favicon : {
            type:String,
            default:null
        },
        organizationName : {
            type:String,
            default:null
        },
        domainName : {
            type:String,
            default:null
        }, 
        address : {
            type:String,
            default:null
        },
        city : {
            type:String,
            default:null
        },
        state : {
            type:String,
            default:null
        },
        country : {
            type:String,
            default:null
        },
        zipCode : {
            type:String,
            default:null
        },
        phone : {
            type:String,
            default:null
        },
        registrationNumber : {
            type:String,
            default:null
        },
        organizationPicture : {
            type:String,
            default:null
        }, 
        coinName : {
            type:String,
            default:null
        },
        homePageLeafletText : {
            type:String,
            default:null
        },
    },
    localization:{
        dateFormat : {
            type:String,
            default:null
        },
        timeFormat: {
            type:String,
            default:null
        },
        timeZone: {
            type:String,
            default:null
        },
        defaultLanguage: {
            type:String,
            default:null
        }
    },
    emailSettings:{
        host: {
            type:String,
            default:null
        },
        userName: {
            type:String,
            default:null
        },
        password: {
            type:String,
            default:null
        },
        port: {
            type:String,
            default:null
        }
    },
    googleApiSettings:{
        apiKey: {
            type:String,
            default:null
        },
        clientId: {
            type:String,
            default:null
        }
    },
    paymentGatewayConfig:{
        paymentGatewayType:{
            type: String,
            enum: ['PAYPAL','STRIPE'],
            default:"PAYPAL"
        }
    },
    apiFieldConfig:{
        fields:{
            type:Array,
            default:[
                "nationalId",
                "firstName",
                "lastName",
                "studentId",
                "address",
                "email",
                "mobileNumber",
                "programLang1",
                "programLang2",
                "convocationDateLang1",
                "convocationDateLang2",
                "result"
            ]
        },
        criteria:{
            systemUniqueness : {
                type:[Number],
                default:[0]
            },
            blockchain : {
                type:[Number],
                default:[0,1,2,3,4]
            },
            listing: {
                type:[Number],
                default:[0,1,2,3,4,5,6]
            },
            details : {
                type:[Number],
                default:[0,1,2,3,4,5,6,7,8,9,10,11]
            },
            comparativeUniqueness: {
                type:[Number],
                default:[0]
            }
        }
    },
    certificateAccessTrigger: {
        accessType:{
            type: Number,
            enum: [0, 1, 2],
            default: null /* 0 - accountAccessOnConvocationDate (Recipient account access email on convocation date 
                             1 - certificateAccessOnConvocationDate (Recipient certificate access email on convocation date
                             2 - certificateAccessOnStatusChange (Recipient certificate access email on status change*/
        },
        accessCondition:{
            type:String,
            default:null
        }
    },
    
});
InstanceSettingSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
    const one = await this.findOne(condition);
    
    return one || this.create(doc);
});

var InstanceSetting = global.mongoose.model('instance_settings', InstanceSettingSchema);


module.exports = InstanceSetting;
