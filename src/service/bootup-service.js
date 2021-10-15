var User = require("../model/user.model");
var EncryptionUtil = require("../util/encryption-utility");

function configureSuperAdmin(){
    
    return new Promise((resolve,reject) => {
        User.countDocuments({ role: 'ROLE_ACCOUNT_ADMIN' }, function (err, count) {
            if (err) {
                reject(new Error("error in finding account admin", err));
                return;
            }
            if (count == 0) {
                if(!preset.configs.blockchain.relayerPrivateKey){
                    reject(new Error("Please provide wallet private key in env file"));
                    return;
                }
                var salt = uuid();
                var encryptedPassword = EncryptionUtil.encryptPassword(salt, 'Password@123');
                let ethWallet = new ethers.Wallet(preset.configs.blockchain.relayerPrivateKey);
                var encKey = uuid();
                var privateKey = EncryptionUtil.encryptText(encKey, preset.configs.blockchain.relayerPrivateKey);
                var address = ethWallet.address;
                var user = new User({
                    role: 'ROLE_ACCOUNT_ADMIN',
                    firstName: 'Admin',
                    lastName: 'Great',
                    email: 'superadmin@gmail.com',
                    isEmailVerified: true,
                    salt: salt,
                    password: encryptedPassword,
                    ethAddress: address,
                    privateKey: privateKey,
                    encKey: encKey,
                    mobileNumber:"+91919191919",
                    personalAddress:"Test House 123"
                });
                user.save(function (err, savedUser) {
                    if (err) {
                        reject(new Error("error in saving account admin", err));
                        return;
                    }
                    resolve("Account Admin saved successfully");
                })
            } else {
                resolve("Account admin already exists");
            }
        });
    })

    
}



module.exports = {
    configureSuperAdmin:configureSuperAdmin,
}