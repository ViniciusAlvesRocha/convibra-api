/**
 *  This service has functions related to user signup and authentication
 */
var User = require("../model/user.model");
var ResponseHandler = require("../util/response-handler");
var EncryptionUtil = require("../util/encryption-utility");
var MailerUtil = require("../util/mailer.util");
var VerificationToken = require("../model/verification-token.model");
var TransactionService = require("./transaction-service");
var FileService = require("./file.service");
var InstanceSettingService = require("./instance-setting-service");
var EmailTemplateService = require("./email-template.service");

var sendVerificationMail = async function (user) {

    var token = new VerificationToken({
        email: user.email,
        token: uuid(),
        type: 'EMAIL_VERIFICATION'
    })
    token.save(function (err, savedToken) {
        if (err) {
            console.log("unable to send verification email", err);
        }
        user.url = `${preset.configs.siteUrl}/email/verification/${savedToken.token}`;

        MailerUtil.sendMail("signup", user.email , user).then().catch(console.error);
    })
}

var sendUserInvitationMail = async function (user) {
    user.url = `${preset.configs.siteUrl}`;
    MailerUtil.sendMail('invite-user', user.email, user).then().catch(console.error);
}

var createUserWallet = function (user) {
    // create ethereum wallet
    let ethWallet = ethers.Wallet.createRandom();
    user.encKey = uuid();
    user.privateKey = EncryptionUtil.encryptText(user.encKey, ethWallet.privateKey);
    user.ethAddress = ethWallet.address;
}

async function signup(user){

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        let _user = await User.findOne({ 'email': user.email });

        if (_user != null) {
            _response['status']  = "failure";
            _response['message'] = 'User is already present with this email id';

            return _response;
        }

        user.salt = uuid();
        user.password = EncryptionUtil.encryptPassword(user.salt, user.password);
        createUserWallet(user);
        let signupUser = new User(user);

        let savedUser = await signupUser.save();

        sendVerificationMail(savedUser);

        if(user.role == 'ROLE_RECIPIENT'){
            
            /* Blockchain */
            
            let _provider            = await autoloaded.ChainService.getProviderInstance('uniblocknet');
            let _relayerPrivateKey   = await autoloaded.ChainService.getRelayerPrivateKey();
            let _wallet              = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
            let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_wallet);

            let options = {
                nonce: await autoloaded.ChainService.getNonce(_wallet.address, true)
            }

            let _txHash = await _certificateInstance.addRecipient(user.ethAddress, options);
            await _txHash.wait();

        }

        _response['status']  = 'success';
        _response['message'] = 'Signup sucessful, Please check your email to verify your account';
        _response['data']    = savedUser;

    }catch(e){
        _response['status']  = "failure";
        _response['message'] = e.message;
    }

    return _response;
}

var verifyEmail = function (res, token) {
    VerificationToken.findOne({ token: token, type: 'EMAIL_VERIFICATION' }, function (err, tokenData) {
        if (err || !tokenData) {
            return ResponseHandler.generateError(res, "Unable to process your request", err);
        }
        User.findOne({ email: tokenData.email }, function (err, userData) {
            if (err || !userData) {
                return ResponseHandler.generateError(res, "Unable to get your data", err);
            }
            return updateUserEmailVerification(res,userData,tokenData._id);
            /* if (userData.role == 'ROLE_RECIPIENT') {
                return addRecipientInBlockchain(res, userData, tokenData._id);
            }
            return updateUserEmailVerification(res, userData, tokenData._id); */
        });
    })
}

var updateUserEmailVerification = function (res, userData, tokenId) {
    User.updateOne({ email: userData.email }, { $set: { isEmailVerified: true } }, function (err, response) {
        if (err) {
            return ResponseHandler.generateError(res, "Error while updating your account status", err);
        }
        if (response.nModified > 0) {
            return VerificationToken.deleteOne({ _id: tokenId }, function (err, remove) {
                return ResponseHandler.generateSuccess(res, "Email verification has been completed successfully", null);
            })
        }
        return ResponseHandler.generateError(res, "Unable to verify your email", null);
    })
}

var login = function (res, user) {
    User.findOne({ email: user.email }, function (err, userData) {
        if (err || !userData) {
            return ResponseHandler.generateError(res, "User with this email does not exists", err);
        }

        if (!userData.isEmailVerified) {
            return ResponseHandler.generateError(res, "Please verify your email", null);
        }
        if (!EncryptionUtil.isPasswordMatch(userData.password, user.password, userData.salt)) {
            return ResponseHandler.generateError(res, "Incorrect password", null);
        }
        if (!userData.isAccountEnabled) {
            return ResponseHandler.generateError(res, "Your account has been disabled, please contact admin", null);
        }

        return generateAuthToken(res, userData);
    });
}

var logout = function (res, token) {
    AuthToken.deleteMany({ token: token }, function (err, response) {
        return ResponseHandler.generateSuccess(res, "Logout successful", null);
    })
}


var generateAuthToken = function (res, userData) {
    try {
        let _token = jwt.sign({ userId: userData._id }, preset.services.jwt.key, { expiresIn: '24h' });
        return ResponseHandler.generateSuccess(res, "Welcome Aboard", {
            token: _token,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role
        });
    }
    catch (error) {
        return ResponseHandler.generateError(res, "Unable to generate auth token", null);
    }
}

var forgotPassword = async function (res, email) {
    User.findOne({ email: email }, function (err, userData) {
        if (err || !userData) {
            return ResponseHandler.generateError(res, "User with this email does not exists", err);
        }
        var token = new VerificationToken({
            email: userData.email,
            token: uuid(),
            type: 'FORGOT_PASSWORD'
        })
        
        token.save(function (err, savedToken) {
            if (err) {
                return ResponseHandler.generateError(res, "unable to send forgot password email", err);
            }

            userData.url = `${preset.configs.siteUrl}/reset/password/${savedToken.token}`;

            MailerUtil.sendMail('reset-password', userData.email, userData).then().catch(console.error);
            return ResponseHandler.generateSuccess(res, "Reset password mail sent to your email successfully", null);
        })
    })
}

var resetPassword = function (res, token, newPassword) {
    VerificationToken.findOne({ token: token, type: 'FORGOT_PASSWORD' }, function (err, tokenData) {
        if (err || !tokenData) {
            return ResponseHandler.generateError(res, "Unable to process your request", err);
        }
        var salt = uuid();
        var encryptedPassword = EncryptionUtil.encryptPassword(salt, newPassword);
        User.updateOne({ email: tokenData.email }, { $set: { password: encryptedPassword, salt: salt } }, function (err, response) {
            if (err) {
                return ResponseHandler.generateError(res, "Error while updating your password", err);
            }
            if (response.nModified > 0) {
                return VerificationToken.deleteOne({ _id: tokenData._id }, function (err, remove) {
                    return ResponseHandler.generateSuccess(res, "Password has been reset successfully", null);
                })
            }
            return ResponseHandler.generateError(res, "Unable to update your password", null);
        })
    })
}

async function updateAccountSettings(profileData, userId) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {
        /* Check if Email already taken  */
        if (profileData.email != null && profileData.email != undefined) {
            let alreadyUser = await User.findOne({ email: profileData.email, _id: { $ne: userId } });

            if (alreadyUser != null) {
                _response['status'] = "failure";
                _response['message'] = 'Unable to update profile, email already taken';
                return _response;
            }
        }
        await User.findOneAndUpdate({ _id: userId }, profileData);

        _response['status'] = 'success';
        _response['message'] = 'Profile updated successfully';

    } catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}



async function updatePassword(passwordData, currentUser) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        if (!EncryptionUtil.isPasswordMatch(currentUser.password, passwordData.currentPassword, currentUser.salt)) {
            _response['status'] = "failure";
            _response['message'] = "Incorrect current password";
            return _response;
        }

        var salt = uuid();
        var encryptedPassword = EncryptionUtil.encryptPassword(salt, passwordData.newPassword);

        await User.updateOne({ _id: currentUser._id }, { $set: { password: encryptedPassword, salt: salt } });

        _response['status'] = "success";
        _response['message'] = "Password updated successfully";

    } catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;

}





var storeUser = async function (reqData) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let _user = await User.findOne({ 'email': reqData.email });

        if (_user != null) {
            _response['status'] = "failure";
            _response['message'] = 'User is already present with this email id';

            return _response;
        }

        let rawPassword = reqData.password;

        reqData.salt = uuid();
        reqData.password = EncryptionUtil.encryptPassword(reqData.salt, reqData.password);

        /* call to wallet creation */
        createUserWallet(reqData);

        /* Blockchain */
        let _provider            = await autoloaded.ChainService.getProviderInstance('uniblocknet');
        let _relayerPrivateKey   = await autoloaded.ChainService.getRelayerPrivateKey();
        let _wallet              = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
        let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_wallet);

        let options = {
            nonce: await autoloaded.ChainService.getNonce(_wallet.address, true)
        }

        try {
            let signupUser = new User(reqData);
            let savedUser = await signupUser.save();

            // sendVerificationMail(savedUser);

            if (reqData.role == 'ROLE_SUB_ACCOUNT_ADMIN') {
                savedUser.role = 'Sub Account Admin';
            }
            else if (reqData.role == 'ROLE_ISSUER') {
                savedUser.role = 'Issuer';

                let _txHash = await _certificateInstance.addIssuer(reqData.ethAddress, options);
                await _txHash.wait();
            }
            else if (reqData.role == 'ROLE_VERIFIER') {
                savedUser.role = 'Verifier';
            }
            else if (reqData.role == 'ROLE_RECIPIENT') {
                savedUser.role = 'Recipient';

                let _txHash = await _certificateInstance.addRecipient(reqData.ethAddress, options);
                await _txHash.wait();
            }

            savedUser.rawPassword = rawPassword;
            sendUserInvitationMail(savedUser);

            _response["status"] = "success";
            _response["message"] = "User data stored successfully";
            _response['data'] = savedUser;

        } catch (e) {
            _response['status'] = "failure";
            _response['message'] = e.message;
        }

    } catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}

var updateUser = async function (reqData, userId) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {
        let _user = await User.findOne({ '_id': userId });

        if (reqData.email != _user.email) {
            let existingUser = await User.findOne({ 'email': reqData.email });
            if (existingUser != null) {
                _response['status'] = "failure";
                _response['message'] = "User with this email already exists";
                return _response;
            }
        }

        let inputData = {
            'firstName': reqData.firstName,
            'lastName': reqData.lastName,
            'email': reqData.email,
            'isAccountEnabled': reqData.isAccountEnabled
        };

        if (reqData.password != '') {
            reqData.salt = uuid();
            inputData['salt']     = reqData.salt;
            inputData['password'] = EncryptionUtil.encryptPassword(reqData.salt, reqData.password);
        }

        await User.updateOne({ _id: userId }, inputData);
        _response["status"] = "success";
        _response["message"] = "User data updated successfully";
    }
    catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}

var getDetails = async function (userId) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {
        let _userData = await User.findOne({ '_id': userId }).exec();

        if (_userData != null) {
            let userData = {};

            userData['_id'] = _userData._id;
            userData['firstName'] = _userData.firstName;
            userData['lastName'] = _userData.lastName;
            userData['email'] = _userData.email;
            userData['mobileNumber'] = _userData.mobileNumber;
            userData['isAccountEnabled'] = _userData.isAccountEnabled;
            userData['isEmailVerified'] = _userData.isEmailVerified;
            userData['role'] = _userData.role;
            userData['personalAddress'] = _userData.personalAddress;

            _response["status"] = "success";
            _response["message"] = "User data get successfully";
            _response["data"] = userData;
        }
        else {
            _response['status'] = "failure";
            _response['message'] = "User data not available";
        }
    }
    catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}


var getListing = async function (condition) {

    /* pageNumber, limit, userRole, condition */
    let pageNumber = 1;
    let limit = null;
    let queryCondition = {}

    if(condition.pagination != undefined)
    {
        if(condition.pagination.limit != undefined)
        {
            limit = condition.pagination.limit;
        }

        if(condition.pagination.pageNumber != undefined)
        {
            pageNumber = condition.pagination.pageNumber;
        }
    }

   

    if(condition.query != undefined)
    {
        if(condition.query.filter != undefined){
            queryCondition = condition.query.filter;
        }
    }

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let _userData = {};

        pageNumber = pageNumber - 1;
        let skip = pageNumber * limit;
        
        if(limit == -1)
        {
            skip = null;
            limit = null;
        }

        if(Object.keys(queryCondition).length == 0) {
            let response = {
                'userData': [],
                'count': 0
            }

            _response["status"] = "failure";
            _response["message"] = "No users found";
            _response["data"] = response;

            return _response;
        }

        _userData = await User.find(queryCondition).sort({ 'date': -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit))
                .lean()
                .populate('issuerDetails.subAccountID', ['firstName', 'lastName']);
        
        let count = await User.countDocuments(queryCondition);

        if(_userData.length <= 0)
        {
            let response = {
                'userData': [],
                'count': count
            }

            _response["status"] = "failure";
            _response["message"] = "No users found";
            _response["data"] = response;
        }
        else
        {
            let response = {
                'userData': _userData,
                'count': count
            }

            _response["status"] = "success";
            _response["message"] = "Users found";
            _response["data"] = response;
        }
    }
    catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}

var updateUserStatus = async function (userId, status) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {
        let _user = await User.findOne({ '_id': userId });

        if (_user == null) {
            _response['status'] = "failure";
            _response['message'] = 'User does not exist';
            return _response;
        }

        let updateData = { 'isAccountEnabled': status };

        await User.updateOne({ _id: userId }, updateData);
        _response["status"] = "success";
        _response["message"] = "User status changed successfully";
    }
    catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}



async function getAllConvocationDates(_currentUser) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let condition = {};

        condition = { 'role': 'ROLE_RECIPIENT' };

        let usersData = await User.find(condition);

        if (usersData.length <= 0) {
            _response['status'] = "failure";
            _response['message'] = "Users does not exists.";
            return _response;
        }

        let arrConvocationDates = [];

        if (usersData.length > 0) {
            for (let user of usersData) {
                for (course of user.recipientDetails.courses) {
                    if (arrConvocationDates.indexOf(course.convocationDateLang1) == -1) {
                        arrConvocationDates.push(course.convocationDateLang1);
                    }
                }
            }
        }

        if (arrConvocationDates.length > 0) {
            _response['status'] = "success";
            _response['message'] = 'Array of convocation dates';
            _response['data'] = arrConvocationDates;

        } else {
            _response['status'] = "failure";
            _response['message'] = "Convocation dates are not available";
        }

    } catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}



async function verifyPrivateKeyFile(_data) {
    let _response = {
        "status": "",
        "message": "",
        "data": {}
    };

    try {

        let fileData = await FileService.getFileContent(_data.file.filename);

        if (fileData.status == "success" && fileData.data == "") {
            _response["status"] = "failure";
            _response["message"] = "Uploaded file is blank";
            return _response;
        }

        let _walletResponse = await verifyPrivateKey(fileData.data);
        if(_walletResponse['status'] == 'failure')
        {
            return _walletResponse;
        }

        let senderEthAddress = _data.currentUser.ethAddress;
        let walletAddress = _walletResponse['data'].address;

        if (senderEthAddress != walletAddress) {
            _response["status"] = "failure";
            _response["message"] = "Issuer Eth address not matching with provided private key address";
            return _response;
        }

        _response["status"] = "success";
        _response["data"] = { "privateKey": _walletResponse['data'].privateKey };
        _response["message"] = "Provided private key is valid";
    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function verifyPrivateKey(_data) {
    let _response = {
        "status": "",
        "message": "",
        "data": {}
    };

    try {

        let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
        let wallet = await autoloaded.ChainService.getWalletInstance(_data, _provider);

        _response["status"] = "success";
        _response["data"] = wallet;
        _response["message"] = "Provided private key is valid";
    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function getWalletDetails(_currentUser){
    let _response = {
        "status": "",
        "message": "",
        "data": {}
    };

    try{

        let userPrivateKey = await EncryptionUtil.decryptEncryptedText(_currentUser.encKey,_currentUser.privateKey);
        let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
        let _wallet = await autoloaded.ChainService.getWalletInstance(userPrivateKey, _provider);
        let blockNumber = await _provider.getBlockNumber();
        let balance = await _wallet.getBalance();

        let instanceSettingData = await InstanceSettingService.getDetails('general');

        
        let coinName = '';
        if(instanceSettingData.data.general != undefined){
            coinName = instanceSettingData.data.general.coinName;
        }

        let data = {};
        data['address'] = _wallet.address;
        data['balance'] = ethers.utils.formatEther(balance);
        data['height'] = blockNumber;
        data['privateKey'] = userPrivateKey;
        data['coinName'] = coinName;

        _response["status"] = "success";
        _response["data"] = data;
        _response["message"] = "Wallet data get successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }    

    return _response;
}

async function addRecipientOnChain(_certificateInstance, _ethAddress, _options) {
    return new Promise(async (_resolve, _reject) => {
        try {
            let _blockchainResponse = await _certificateInstance.addRecipient(_ethAddress, _options);
            let _tx = await _blockchainResponse.wait();

            console.log("Blockchain Tx Done: ",{ ethAddress: _ethAddress, txHash: _tx.transactionHash });
            _resolve({ ethAddress: _ethAddress, txHash: _tx.transactionHash });
        }
        catch (e) {
            console.log("Blockchain TX Failure for Data: ", _ethAddress, e.message);
            _resolve({ ethAddress: _ethAddress, txHash: null });
        }

    });
}

module.exports = {
    signup: signup,
    login: login,
    verifyEmail: verifyEmail,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
    updateAccountSettings: updateAccountSettings,
    storeUser: storeUser,
    updateUser: updateUser,
    getDetails: getDetails,
    getListing: getListing,
    updateUserStatus: updateUserStatus,
    getAllConvocationDates: getAllConvocationDates,
    verifyPrivateKeyFile: verifyPrivateKeyFile,
    verifyPrivateKey: verifyPrivateKey,
    getWalletDetails:getWalletDetails,
    generateAuthToken:generateAuthToken,
    addRecipientOnChain:addRecipientOnChain
    /* getAllRecipients:getAllRecipients, */
}
