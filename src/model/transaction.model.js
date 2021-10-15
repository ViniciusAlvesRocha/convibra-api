var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TransactionSchema = new Schema({
    userId:{
        type: Schema.ObjectId,
        ref: 'user',
    },
    accountID:{
        type:ObjectId,
        required:false
    },
    type:{
        type:String,
        enum:['BUY','SELL'],
        required:true
    },
    buyingCurrency:{
        type:String,
        required:true
    },
    sellingCurrency:{
        type:String,
        required:true
    },
    buyingAmount:{
        type:Number,
        required:true
    },
    sellingAmount:{
        type:Number,
        required:true
    },
    transactionHash:{
        type:String
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

var Transaction = mongoose.model('transaction', TransactionSchema);

module.exports = Transaction;