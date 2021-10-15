var Transaction = require("../model/transaction.model");
var ResponseHandler = require("../util/response-handler");
var AppConstant = require("../constant/app-constant");
var User = require("../model/user.model");
var EncryptionUtil = require("../util/encryption-utility");
var MailerUtil = require("../util/mailer.util");

var getAccountBalance = function (res, user) {
    var wallet = new ethers.Wallet(EncryptionUtil.decryptEncryptedText(user.encKey, user.privateKey), ethProvider);
    wallet.getBalance().then(function (balance) {
        ethProvider.getBlockNumber().then(function(blockNumber){
            return ResponseHandler.generateSuccess(res,"Wallet info",{
                balance:ethers.utils.formatEther(balance),
                address:user.ethAddress,
                height:blockNumber
            });
        },function(error){
            return ResponseHandler.generateError(res, "Unable to get block height", null);
        })
    }, function (error) {
        return ResponseHandler.generateError(res, "Unable to get balance", null);
    })
}

var makeTransaction = async function (res, currentUser, data) {
    var wallet = new ethers.Wallet(EncryptionUtil.decryptEncryptedText(currentUser.encKey, currentUser.privateKey), ethProvider);
    var amountInWei = ethers.utils.parseEther(data.amount.toString());
    var options = await getTransactionOptions(wallet.address);
    options.to = data.address;
    options.value = amountInWei;
    wallet.sendTransaction(options).then(function (success) {
        return ResponseHandler.generateSuccess(res, "Transaction successful", success.hash);
    }, function (error) {
        return ResponseHandler.generateError(res, "Transaction failed", error);
    });
}

var checkAndMaintainAccountBalance = function(userId,accountID){
    try{
        User.findOne({
                    _id: userId,
                    accountID: accountID
                }, function (err, userData) {
            if(err || !userData){
                console.log("checkAndMaintainAccountBalance","User not found");
                return;
            }
            var wallet = new ethers.Wallet(EncryptionUtil.decryptEncryptedText(userData.encKey,userData.privateKey), ethProvider);
            wallet.getBalance().then(function(balance){
                console.log(userData.ethAddress,"current Balance",balance.toString());
                var minAccountThresold = ethers.utils.parseEther(AppConstant.RECIPIENT_MINIMUM_ACCOUNT_THRESHOLD);
                var incrementSupplyInWei = AppConstant.RECIPIENT_INCREMENT_SUPPLY;
                if(userData.role=='ROLE_ISSUER'){
                    minAccountThresold = ethers.utils.parseEther(AppConstant.ISSUER_MINIMUM_ACCOUNT_THRESHOLD);
                    incrementSupplyInWei = AppConstant.ISSUER_INCREMENT_SUPPLY;
                }
                if(balance.lte(minAccountThresold)){
                    console.log(userData.ethAddress," has amount lower than thresold");
                    doTransaction(userData.ethAddress,incrementSupplyInWei,false);
                }
            },function(error){
                console.log("checkAndMaintainAccountBalance",error);
            })
        })
    }catch(e){
        console.log('checkAndMaintainAccountBalance: ',e);
    }
}

var creditInitialSupply = function(address,role){
    var initialSupply = AppConstant.RECIPIENT_INITIAL_SUPPLY;
    if(role=='ROLE_ISSUER'){
        initialSupply = AppConstant.ISSUER_INITIAL_SUPPLY;
    }
    try{
        doTransaction(address,initialSupply,true);
    }catch(e){
        console.log('initialzeAccounts via catch: ',e);
    }
}

var doTransaction = function (address, amount,isInitialSupply) {
    User.findOne({ role: 'ROLE_SUPER_ADMIN' }, async function (err, adminUser) {
        if (err || !adminUser) {
            console.log('doTransaction error: ', "Admin not found");
            return;
        }
        var wallet = new ethers.Wallet(EncryptionUtil.decryptEncryptedText(adminUser.encKey, adminUser.privateKey), ethProvider);
        var amountInWei = ethers.utils.parseEther(amount);
        var options = await getTransactionOptions(wallet.address);
        options.to = address;
        options.value = amountInWei;
        wallet.sendTransaction(options).then(function (success) {
            console.log('doTransaction success: ', address, success);
        }, function (error) {
            // send mail if this case happens authorize admin to do transaction
            sendTransactionFailureMail(address, amount,isInitialSupply);
            console.log('doTransaction tx error: ', error);
        });
    })
}

var sendTransactionFailureMail = function(address,amount,isInitialSupply){
    var data = {
        address:address,
        amount:amount,
        reason:(isInitialSupply)?"initail amount crediting on signup/verification":"incrementing amount thresold"
    }
    // MailerUtil.sendMail("transaction-failure.ejs",data,configs.adminUser,"Transaction Fallback Alert").then().catch(console.error);  
    MailerUtil.sendMail("transaction-failure",configs.adminUser, data).then().catch(console.error);
}

var getTransactionOptions = async function(senderAddress){
    var nonceResponse = await getNoncePromise(senderAddress);
    console.log(`Nonce for ${senderAddress} is ${ethers.utils.bigNumberify(nonceResponse.result).toString()}`)
    return {
        nonce:nonceResponse.result
    }
}

function getNoncePromise(senderAddress) {
    return new Promise(function (resolve, reject) {
        request.post({
                url: configs.gethUrl,
                json: true,
                body: {
                    "method": "parity_nextNonce",
                    "params": [senderAddress],
                    "id": 1,
                    "jsonrpc": "2.0"
                }
            },
            function (err, res, body) {
                if (!err && res.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(err);
                }
            });
    });
}
  


module.exports = {
    creditInitialSupply:creditInitialSupply,
    checkAndMaintainAccountBalance:checkAndMaintainAccountBalance,
    getAccountBalance:getAccountBalance,
    makeTransaction:makeTransaction,
    getTransactionOptions:getTransactionOptions
}