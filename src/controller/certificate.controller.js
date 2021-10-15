let ResponseHandler = require("../util/response-handler");
var CertificateService = require("../service/certificate.service");
var InstanceSettingService = require("../service/instance-setting-service");

async function getListing(req, res) {

   let pageNumber = req.query.pageNumber;
   let limit = req.query.limit;
   let filter = req.query.filter;

   let _currentUser = req.currentUser;
   let _currentUserRole = _currentUser.role;

   let condition = {};

   if(_currentUserRole == 'ROLE_SUB_ACCOUNT_ADMIN'){
      condition['subAccountID'] = _currentUser._id;
   }

   if(_currentUserRole == 'ROLE_ISSUER'){
      condition['issuedBy._id'] = _currentUser._id;
   }

   if (_currentUserRole == 'ROLE_RECIPIENT') {
      condition['issuedTo._id'] = _currentUser._id;
      condition['status']       = 'COMPLETED';
      

      /* Get Instance Setting Certificate Access Trigger Info */
      let searchParam = 'certificateAccessTrigger';
      let instanceSettingResponse =  await InstanceSettingService.getDetails(searchParam);

      if(instanceSettingResponse['status'] == 'success'){
         /* 
            accessType = 1 ->Access on Certificate Convocation
            accessType = 2 ->Access on Status Change
         */
         let accessType = instanceSettingResponse['data']['certificateAccessTrigger']['accessType'];

         if(accessType == 1){
            let currentDate = moment(new Date()).format("YYYY-MM-DD");
            condition['convocationDate.Lang1'] = { $lte: currentDate };
         }

         if(accessType == 2){
            let accessCondition = instanceSettingResponse['data']['certificateAccessTrigger']['accessCondition'];
            condition['extraData.status'] = accessCondition;
         }
                  
      }      
   }

   // console.log(condition);

   /* {{url}}/api/v1/certificate/list?pageNumber=1&limit=5&filter={"isRevoked":true} */
   if(filter!=undefined){
      filter = JSON.parse(filter);

      if(filter.isRevoked != undefined){
         condition['isRevoked'] = filter.isRevoked;
      }

      if(filter.status != undefined && filter.status!='ALL'){
         condition['status'] = filter.status;
      }

      if(filter.batchID != undefined && filter.batchID!='ALL'){
         condition['batchID'] = filter.batchID;
      }

      if(filter.recipientName != undefined && filter.recipientName!=''){
         condition['issuedTo.name'] = { '$regex': filter.recipientName, '$options': 'i' };
      }
   }

   let response = await CertificateService.getListing(pageNumber, limit, condition);

   if (response.status == "success") {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   } else {
      return ResponseHandler.generateError(res, response.message, null);
   }

}

async function getDetails(req, res) {

   let certificateId = req.params.id;

   let condition = {};
   if(req.currentUser.role != 'ROLE_RECIPIENT'){
      condition["isClaimed"] = true;
   }

   condition["_id"] = certificateId;

   let response = await CertificateService.getDetails(condition);

   if (response.status == "success") {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   } else {
      return ResponseHandler.generateError(res, response.message, null);
   }

}

async function getCertificatePublicDetails(req, res){

   let certificateId = req.params.id;
   let condition  = {};
   
   condition['_id'] = certificateId;

   let response = await CertificateService.getDetails(condition);

   if(response.status == 'failure'){
      let newCondition = {};

      newCondition['targetHash'] = certificateId;

      let response = await CertificateService.getDetails(newCondition);

      if (response.status == "success") {
         return ResponseHandler.generateSuccess(res, response.message, response.data);
      } else {
         return ResponseHandler.generateError(res, response.message, null);
      }
   }

   if (response.status == "success") {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   } else {
      return ResponseHandler.generateError(res, response.message, null);
   }
}

async function shareCertificateToVerifier(req, res) {

   const validationSchema = joi.object().keys({
      emails: joi.array().items(joi.string().required().email()),
      certificateId: joi.string().required(),
      issuerId: joi.required()
   });

   const result = validationSchema.validate(req.body);
   if (result.error) {
      return ResponseHandler.generateError(res, "Validation failed", result.error);
   }

   let response = await CertificateService.shareCertificateToVerifier(req.body, req.currentUser);

   if (response.status == "success") {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   } else {
      return ResponseHandler.generateError(res, response.message, null);
   }
}

async function issueCertificate(req, res) {
   const validationSchema = joi.object().keys({
      // recipientId: joi.array().items(joi.string().required()),
      recipientID: joi.array().required(),
      privateKey: joi.string().required(),
      templateID: joi.array().required(),
      certificationDate: joi.string().required(),
      courseID: joi.array().required()
   });

   const result = validationSchema.validate(req.body);
   if (result.error) {
      return ResponseHandler.generateError(res, "Validation failed", result.error);
   }

   let _issuer = req.currentUser;
   let _requestData = req.body;

   
   let _response = await CertificateService.issueCertificate(_issuer,_requestData);
   if(_response.status == 'failure')
   {
      return ResponseHandler.generateError(res, _response.message, _response.data);
   }

   return ResponseHandler.generateSuccess(res, _response.message, _response.data);
}


async function revokeCertificate(req,res){

   let validationSchema = joi.object().keys({
       certificateHash: joi.string().required(),
       reason: joi.string().required()
   });

   let result = validationSchema.validate(req.body);
   if (result.error) {
         return ResponseHandler.generateError(res, "Validation failed", result.error);
   }

   let response = await CertificateService.revokeCertificate(req.body,req.currentUser);
   if (response.status == 'success') {
       return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
       return ResponseHandler.generateError(res, response.message, null);
   }
}

async function getHistory(req, res){

   let _data = req.query;

   let response = await CertificateService.getHistory(_data);
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }
   
}

async function getBatchListing(req, res){

   let _currentUser     = req.currentUser;
   let _currentUserRole = req.currentUser.role;

   let condition = {};

   if(_currentUserRole == 'ROLE_SUB_ACCOUNT_ADMIN'){
      condition['subAccountID'] = _currentUser._id;
   }

   if(_currentUserRole == 'ROLE_ISSUER'){
      condition['subAccountID'] = _currentUser.issuerDetails.subAccountID;
   }

   let response = await CertificateService.getBatchListing(condition);
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }

}

async function getSharedCertificateListing(req, res){

   let _currentUser     = req.currentUser;
   let _currentUserId   = _currentUser._id;
   let _currentUserRole = _currentUser.role;

   let pageNumber = req.query.pageNumber;
   let limit      = req.query.limit;

   if(_currentUserRole != 'ROLE_VERIFIER'){
      return ResponseHandler.generateError(res, 'Unauthorized access', null);
   }

   let condition = { verifierId: _currentUserId };

   let response = await CertificateService.getSharedCertificateListing(pageNumber, limit, condition);
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }   
}

async function storeCertificateStats(req, res){

   let response = await CertificateService.storeCertificateStats(req.body);
   
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }   
   
}

async function claimCertificate(req, res){

   let certificateId = req.params.id; 
   let currentUser   = req.currentUser;

   let response = await CertificateService.claimCertificate(certificateId, currentUser);
   
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }   

}

async function generateCertificateZip(req,res){
   let batchId   = req.params.id; 

   let response = await CertificateService.generateCertificateZip(batchId);   
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }
}

async function getCertificateIdQrScan(req,res){
   
   let response = await CertificateService.getCertificateIdQrScan(req.query);   
   if (response.status == 'success') {
      return ResponseHandler.generateSuccess(res, response.message, response.data);
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   }
}

async function exportCSV(req, res){

   let _batchID = req.params.batchID;

   let _criteria = { batchID: _batchID };

   let response = await CertificateService.buildCSV(_criteria); 

   if (response.status == 'success' && response.data.rows.length > 0) {
      
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition',`attachment; filename=${_batchID}.csv`);

      try{
         
         let writer = csvWriter({ headers: response.data.headers});
         writer.pipe(res);
         response.data.rows.forEach((_row) => {
            writer.write(_row);
         });
         
         writer.end();

      }catch(e){
         return ResponseHandler.generateError(res, e.message, null);
      }
   }
   else {
      return ResponseHandler.generateError(res, response.message, null);
   } 

}

module.exports = {
   getListing: getListing,
   getDetails: getDetails,
   getCertificatePublicDetails:getCertificatePublicDetails,
   shareCertificateToVerifier: shareCertificateToVerifier,
   issueCertificate: issueCertificate,
   revokeCertificate:revokeCertificate,
   getHistory:getHistory,
   getBatchListing:getBatchListing,
   getSharedCertificateListing:getSharedCertificateListing,
   storeCertificateStats:storeCertificateStats,
   claimCertificate:claimCertificate,
   generateCertificateZip:generateCertificateZip,
   getCertificateIdQrScan:getCertificateIdQrScan,
   exportCSV:exportCSV
}
