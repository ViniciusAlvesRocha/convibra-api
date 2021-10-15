let VerificationRequest = require('../model/verification-request.model');
let Certificate         = require('../model/certificate.model');
let CertificateShare    = require('../model/certificate-share.model');
let MailerUtil          = require("../util/mailer.util");
var EmailTemplateService = require("./email-template.service");
async function sendVerificationRequest(_data, _currentUser){

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        let requestMessage = _data.requestMessage;
        let certificateId  = _data.certificateId;
        let _verifierId    = _currentUser._id;

        /* Check whether that certificate has shared or not. i.e. Recipient has shared his certificate or not if not then throw the error */

        let certificateShareData = await CertificateShare.findOne({verifierId: _verifierId, certificateId: certificateId });

        if(certificateShareData == null){
            _response['status']  = 'failure';
            _response['message'] = 'Please ask recipient to share the certificate';
            return _response;
        }

        let certificateInfo = await Certificate.findOne({_id:certificateId});
        
        if(certificateInfo == null){
            _response['status']  = 'failure';
            _response['message'] = 'Certificate not found';
            return _response;
        }
        
        let issuerEmail = certificateInfo.rawCertificate.issuer.email;
        let issuerName = certificateInfo.rawCertificate.issuer.name;

        let verificationRequestInput = new VerificationRequest({
            verifierId: _verifierId,
            certificateId: certificateId,
            issuerId:certificateInfo.issuedBy._id,
            requestMessage: requestMessage
        });

        let savedRequest = await verificationRequestInput.save();

        let mailData = {
            issuerName:issuerName,
            firstName:_currentUser.firstName,
            lastName:_currentUser.lastName,
            _id:savedRequest._id,
            requestMessage:requestMessage
        }

        MailerUtil.sendMail('verification-request', issuerEmail, mailData);

        // MailerUtil.sendMail("verification-request.ejs", mailData, issuerEmail ,"Certificate Verification Request");

        _response['status']  = 'success';
        _response['message'] = 'Verification request has been sent to issuer';
        _response['data']    = savedRequest;

    }catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function getVerificationRequestListing(pageNumber, limit, condition, currentUserRole){

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        pageNumber = pageNumber - 1;
        let skip   = pageNumber * limit;

        let verificationRequestData = {};
        if(currentUserRole == 'ROLE_ISSUER'){
            verificationRequestData = await VerificationRequest.find(condition)
                                                .sort({ 'date': -1 })
                                                .skip(parseInt(skip))
                                                .limit(parseInt(limit))
                                                .lean()
                                                .populate('certificateId')
                                                .populate('verifierId',['firstName','lastName']);
        }

        if(currentUserRole == 'ROLE_VERIFIER'){
            verificationRequestData = await VerificationRequest.find(condition)
                                                .sort({ 'date': -1 })
                                                .skip(parseInt(skip))
                                                .limit(parseInt(limit))
                                                .lean();
        }     

        let count = await VerificationRequest.countDocuments(condition);

        if(verificationRequestData.length <= 0)
        {
            let response = {
                'data': [],
                'count': count
            }

            _response["status"]  = "failure";
            _response["message"] = "No verification requests found";
            _response["data"]    = response;
        }
        else
        {
            let response = {
                'data': verificationRequestData,
                'count': count
            }

            _response["status"]  = "success";
            _response["message"] = "Verification requests found";
            _response["data"]    = response;
        }
       
    }catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function sendReplyToVerifier(_data, _currentUser){

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        let condition = {_id: _data.verificationRequestId};

        let verificationRequestData = await VerificationRequest.findOne(condition).populate('verifierId');

        if(verificationRequestData == null){
            _response['status']  = 'failure';
            _response['message'] = 'Verification request not found';
            return _response;
        }

        let updateInput = { responseMessage : _data.responseMessage };

        await VerificationRequest.updateOne(condition, updateInput);

        let mailData = {
            firstName:verificationRequestData['verifierId']['firstName'],
            lastName:verificationRequestData['verifierId']['lastName'],
            certificateId:verificationRequestData.certificateId,
            message:_data.responseMessage,
            ifirstName:_currentUser.firstName,
            ilastName:_currentUser.lastName
        }

        // MailerUtil.sendMail("reply-to-verifier.ejs", mailData, verificationRequestData['verifierId']['email'] ,`Reply from ${_currentUser.firstName}`);
        MailerUtil.sendMail("reply-to-verifier", verificationRequestData['verifierId']['email'], mailData);

        _response["status"] = "success";
        _response["message"] = "Reply sent successfully to verifier";

    }catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

module.exports = {
    sendVerificationRequest:sendVerificationRequest,
    getVerificationRequestListing:getVerificationRequestListing,
    sendReplyToVerifier:sendReplyToVerifier
}