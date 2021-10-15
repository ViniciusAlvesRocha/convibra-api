var ResponseHandler = require("../util/response-handler");
var UserService = require("../service/user-service");
var EncryptionUtil = require("../util/encryption-utility");
let moment = require('moment');

async function create(req, res) {

    const validationSchema = joi.object().keys({
        firstName: joi.string().trim().required(),
        lastName: joi.string().trim().required(),
        email: joi.string().trim().required().email(),
        password: joi.string().required(),
        isAccountEnabled: joi.required(),
        role: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    _currentUserRole = req.currentUser.role;
    _currentUserId = req.currentUser._id;

    //If incoming role is sub account admin and current user is not account admin then throw the error
    if (req.body['role'] == 'ROLE_SUB_ACCOUNT_ADMIN' && _currentUserRole != 'ROLE_ACCOUNT_ADMIN') {
        return ResponseHandler.generateError(res, "You can not create account for sub account admin", result.error);
    }

    //If incomint role is issuer and current user is not sub account admin then throw the error
    if (req.body['role'] == 'ROLE_ISSUER' && _currentUserRole != 'ROLE_SUB_ACCOUNT_ADMIN') {
        return ResponseHandler.generateError(res, "You can not create account for issuer", result.error);
    }

    if (req.body['role'] == 'ROLE_ISSUER' && _currentUserRole == 'ROLE_SUB_ACCOUNT_ADMIN') {
        req.body['issuerDetails'] = { subAccountID: _currentUserId };
    }

    req.body['isAccountEnabled'] = (req.body['isAccountEnabled'] == "true" ||
        req.body['isAccountEnabled'] == true) ? true : false;

    req.body['isEmailVerified'] = true;

    let response = await UserService.storeUser(req.body);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function update(req, res) {

    let userId = req.params.id;

    const validationSchema = joi.object().keys({
        firstName: joi.string().trim().required(),
        lastName: joi.string().trim().required(),
        email: joi.string().trim().required().email(),
        isAccountEnabled: joi.required(),
        password: joi.string().allow(null, ''),
        role: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    _currentUserRole = req.currentUser.role;
    _currentUserId = req.currentUser._id;

    //If incoming role is sub account admin and current user is not account admin then throw the error
    if (req.body['role'] == 'ROLE_SUB_ACCOUNT_ADMIN' && _currentUserRole != 'ROLE_ACCOUNT_ADMIN') {
        return ResponseHandler.generateError(res, "You can not create account for sub account admin", result.error);
    }

    //If incoming role is issuer and current user is not sub account admin then throw the error
    if (req.body['role'] == 'ROLE_ISSUER' && _currentUserRole != 'ROLE_SUB_ACCOUNT_ADMIN') {
        return ResponseHandler.generateError(res, "You can not create account for issuer", result.error);
    }

    if (req.body['role'] == 'ROLE_ISSUER' && _currentUserRole == 'ROLE_SUB_ACCOUNT_ADMIN') {
        req.body['issuerDetails'] = { subAccountID: _currentUserId };
    }

    req.body['isAccountEnabled'] = (req.body['isAccountEnabled'] == "true" ||
        req.body['isAccountEnabled'] == true) ? true : false;

    let response = await UserService.updateUser(req.body, userId);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getDetails(req, res) {
    let userId = req.params.id;

    let response = await UserService.getDetails(userId);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getListing(req, res) {

    let pageNumber = req.query.pageNumber;
    let limit = req.query.limit;
    let userRole = req.query.role;
    let currentUser = req.currentUser;

    let _currentUserRole = currentUser.role;

    let condition = { role: userRole };

    if (userRole == 'ROLE_ISSUER' && _currentUserRole == 'ROLE_SUB_ACCOUNT_ADMIN') {
        condition['issuerDetails'] = { subAccountID: currentUser._id }
    }

    /* Filtering Logic (START) */
    let searchTerm = req.query.searchTerm;

    if (searchTerm != undefined) {

        try
        {
            searchTerm = JSON.parse(searchTerm);
        }
        catch(e)
        {
            return ResponseHandler.generateError(res, `Invalid searchTerm format, ex searchTerm: {"firstName":"","lastName":"","email":""} `, null);
        }
        

        let _and = [];
        // let _elemMatch = {};
        searchTerm.firstName = searchTerm.firstName || '';
        searchTerm.lastName = searchTerm.lastName || '';
        searchTerm.email = searchTerm.email || '';
        searchTerm.mobileNumber = searchTerm.mobileNumber || '';
        searchTerm.courseID = searchTerm.courseID || '';
        searchTerm.convocationDateLang = searchTerm.convocationDateLang || '';

        searchTerm.isCertificateCreatePage = searchTerm.isCertificateCreatePage || false;

        if (searchTerm.firstName != '') {
            _and.push({ firstName: { '$regex': searchTerm.firstName, '$options': 'i' } })
        }

        if (searchTerm.lastName != '') {
            _and.push({ lastName: { '$regex': searchTerm.lastName, '$options': 'i' } })
        }

        if (searchTerm.email != '') {
            _and.push({ email: { '$regex': searchTerm.email, '$options': 'i' } })
        }

        if (searchTerm.mobileNumber != '') {
            _and.push({ mobileNumber: { '$regex': searchTerm.mobileNumber, '$options': 'i' } })
        }

        if (searchTerm.courseID.length > 0) {
            _and.push({ 'recipientDetails.courses._id': { $in: searchTerm.courseID } });
        }

        if (searchTerm.convocationDateLang != '') {

            let convocationDateLang1 = moment(searchTerm.convocationDateLang).format("YYYY-MM-DDT00:00:00.000") + "Z";

            _and.push({ 'recipientDetails.courses.convocationDateLang1': convocationDateLang1 });
        }

        /* Here we have deleted condition.role because when issuer does not select any course then it should not show the recipient listing in certificate create page (Issuer panel - Create Certificate = Enter Recipient Details Tab) */
        if(searchTerm.isCertificateCreatePage == true && _currentUserRole == 'ROLE_ISSUER' && 
            userRole == 'ROLE_RECIPIENT' && searchTerm.courseID.length <= 0)
        {
            delete condition.role;
        }

        if (_and.length > 0) {
            condition['$and'] = _and;
        }
    }

    /* Filtering Logic (END) */
    let queryCondition = {
        pagination: {
            pageNumber: pageNumber,
            limit: limit
        },
        query: {
            filter: condition
        }
    }
    let response = await UserService.getListing(queryCondition);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }

}

async function updateStatus(req, res) {
    let userId = req.params.id;
    let status = req.params.status;

    let response = await UserService.updateUserStatus(userId, status);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function createRecipient(req, res) {

    const validationSchema = joi.object().keys({
        token: joi.string().required(),
        newPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/),
        confirmPassword: joi.string().required().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,64}$/).valid(joi.ref('newPassword'))
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await UserService.createRecipient(req.body);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getAllConvocationDates(req, res) {

    let response = await UserService.getAllConvocationDates(req.currentUser);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

/* async function getAllRecipients(req, res){
 
    let response = await UserService.getAllRecipients(req.query,req.currentUser);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
} */

async function verifyPrivateKey(req, res) {

    if (req.file == undefined) {
        return ResponseHandler.generateError(res, "Private Key file missing", null);
    }

    req.body['pivateKeyFile'] = req.file.filename;

    let response = await UserService.verifyPrivateKeyFile(req);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getWalletDetails(req, res) {

    let response = await UserService.getWalletDetails(req.currentUser);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}



module.exports = {
    create: create,
    update: update,
    getDetails: getDetails,
    getListing: getListing,
    updateStatus: updateStatus,
    createRecipient: createRecipient,
    getAllConvocationDates: getAllConvocationDates,
    verifyPrivateKey: verifyPrivateKey,
    getWalletDetails: getWalletDetails
    /*  getAllRecipients:getAllRecipients */
}