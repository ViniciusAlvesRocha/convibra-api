var ResponseHandler = require("../util/response-handler");
var UserService = require("../service/user-service");
var EncryptionUtil = require("../util/encryption-utility");

/* function signup(req, res) {
    let baseSchema = {
        accountType: joi.string().required().valid("ROLE_ISSUER", "ROLE_RECIPIENT", "ROLE_VERIFIER"),
        firstName: joi.string().required(),
        lastName: joi.string().required(),
        email: joi.string().required().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
        password: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/),
        confirmPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/).valid(joi.ref('password')),
        personalAddress: joi.string().required(),
        mobileNumber: joi.string().required(),
        accountID: joi.string().required(),
        checked: joi.boolean()
    };
    if (req.body && (req.body.accountType == 'ROLE_ISSUER' || req.body.accountType == 'ROLE_VERIFIER')) {
        Object.assign(baseSchema, {
            officeMobileNumber: joi.string().required(),
            companyName: joi.string().required(),
            companyAddress: joi.string().required(),
            designation: joi.string().required()
        });
    }
    const validationSchema = joi.object().keys(baseSchema);
    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }
    return UserService.signup(res, req.body);
} */

async function signup(req,res){

    const validationSchema = joi.object().keys({
        firstName: joi.string().trim().required(),
        lastName: joi.string().trim().required(),
        email: joi.string().trim().required().email(),
        password: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/),
        confirmPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/).valid(joi.ref('password')),
        mobileNumber: joi.string().trim().required(),
        personalAddress: joi.string().trim().required(),
        role: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await UserService.signup(req.body);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

function verifyEmail(req, res) {
    const token = req.params.token;
    return UserService.verifyEmail(res, token);
}

function loginUser(req, res) {
    const validationSchema = joi.object().keys({
        email: joi.string().required().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
        password: joi.string().required()
    });
    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }
    return UserService.login(res, req.body);
}

async function loginUserByID(req, res) {
    let userId = req.params.id;
    
    if(userId == undefined || userId == 'undefined' || 
      userId == false || userId == 'false'){
        return ResponseHandler.generateError(res, 'Please select user', null);
    }

    let response = await UserService.getDetails(userId);

    if (response.status == "success") {
        return UserService.generateAuthToken(res,response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

function getLoggedInUserInfo(req, res) {
    var currentUser = req.currentUser;
    var accountID = currentUser.accountID;
    accountID = { $in: accountID };

    var base = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email
    };
    var superAdminResponse = { ...base, ...{ email: currentUser.email } };
    var recipientResponse = {
        ...base, ...{
            mobileNumber: currentUser.mobileNumber,
            personalAddress: currentUser.personalAddress,
            status: currentUser.extraDetails.status,
        }
    };
    var issuerResponse = {
        ...recipientResponse, ...{
            officeMobileNumber: currentUser.officeMobileNumber,
            companyName: currentUser.companyName,
            companyAddress: currentUser.companyAddress,
            designation: currentUser.designation
        }
    };
    var response = {};
    if (currentUser.role == 'ROLE_SUPER_ADMIN') {
        response = superAdminResponse;
    } else if (currentUser.role == 'ROLE_DELEGATE_ADMIN') {
        response = base;
    } else if (currentUser.role == 'ROLE_RECIPIENT') {
        response = recipientResponse;
    } else {
        response = issuerResponse;
    }
    if (req.query.verifyIssuer) {
        return ResponseHandler.generateSuccess(res, "Loggedin user", {
            issuerVerified: currentUser.issuerVerified,
            accountID: accountID
        });
    } else {
        return ResponseHandler.generateSuccess(res, "Loggedin user", response);
    }
}


function logoutUser(req, res) {
    return UserService.logout(res, req.headers.authorization)
}

function forgotPassword(req, res) {
    const validationSchema = joi.object().keys({
       email: joi.string().trim().required().email()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }
    return UserService.forgotPassword(res, req.body.email);
}

function resetPassword(req, res) {
    const validationSchema = joi.object().keys({
        token: joi.string().required(),
        newPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/),
        confirmPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/).valid(joi.ref('newPassword'))
    });
    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }
    return UserService.resetPassword(res, req.body.token, req.body.newPassword);
}

function getPrivateKey(req, res) {
    var currentUser = req.currentUser;
    var accountID = currentUser.accountID;
    accountID = { $in: accountID };
    return ResponseHandler.generateSuccess(res, "Private keys", EncryptionUtil.decryptEncryptedText(currentUser.encKey, currentUser.privateKey, accountID));
}

async function updatePassword(req, res) {
    const validationSchema = joi.object().keys({
        currentPassword: joi.string().required(),
        newPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/),
        confirmPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/).valid(joi.ref('newPassword'))
    });
    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await UserService.updatePassword(req.body, req.currentUser);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateAccountSettings(req, res) {

    const validationSchema = joi.object().keys({
        firstName: joi.string().required(),
        lastName: joi.string().required(),
        email: joi.string().required().email(),
        mobileNumber: joi.string(),
        personalAddress: joi.string()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await UserService.updateAccountSettings(req.body, req.currentUser._id);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getAccountSettings(req, res) {

    let response = await UserService.getDetails(req.currentUser._id);
    
    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

module.exports = {
    signup: signup,
    verifyEmail: verifyEmail,
    login: loginUser,
    loginUserByID:loginUserByID,
    logout: logoutUser,
    getLoggedInUserInfo: getLoggedInUserInfo,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    getPrivateKey: getPrivateKey,
    updatePassword: updatePassword,
    updateAccountSettings: updateAccountSettings,
    getAccountSettings:getAccountSettings

}