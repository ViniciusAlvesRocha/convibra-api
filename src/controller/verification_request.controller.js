let ResponseHandler            = require("../util/response-handler");
var VerificationRequestService = require("../service/verification-request.service");

/* Verifier will send the verification request to issuer */
async function sendVerificationRequest(req, res){

    const validationSchema = joi.object().keys({
        requestMessage: joi.string().trim().required(),
        certificateId: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await VerificationRequestService.sendVerificationRequest(req.body, req.currentUser);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

/* This api will use for issuer - issuer will get verification request listing*/
async function getVerificationRequestListing(req, res){

    let pageNumber = req.query.pageNumber;
    let limit      = req.query.limit;

    let _currentUser     = req.currentUser;
    let _currentUserRole = req.currentUser.role;

    let condition = {};
    if(_currentUserRole == 'ROLE_VERIFIER'){
        if(req.params.id != undefined){
            condition['certificateId'] = req.params.id;
            condition['verifierId']    = _currentUser.id;
        }
    }

    if(_currentUserRole == 'ROLE_ISSUER'){
        condition['issuerId'] = _currentUser._id;
    }

    let response = await VerificationRequestService.getVerificationRequestListing(pageNumber, limit, condition, _currentUserRole);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function sendReplyToVerifier(req,res){

    const validationSchema = joi.object().keys({
        verificationRequestId: joi.string().trim().required(),
        responseMessage: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await VerificationRequestService.sendReplyToVerifier(req.body, req.currentUser);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

module.exports = {
   sendVerificationRequest:sendVerificationRequest,
   getVerificationRequestListing:getVerificationRequestListing,
   sendReplyToVerifier:sendReplyToVerifier
}