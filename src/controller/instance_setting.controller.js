let ResponseHandler = require("../util/response-handler");
var InstanceSettingService = require("../service/instance-setting-service");
var UniblockGatewayService = require("../service/uniblock-gateway.service");

async function getGeneralInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('general');
    if (response.status == 'success') {

        if(response.data.general.logo != undefined){
            response.data.general.logo = '/api/v1/common/file/'+response.data.general.logo;
        }

        if(response.data.general.favicon != undefined){
            response.data.general.favicon = '/api/v1/common/file/'+response.data.general.favicon;
        }

        if(response.data.general.organizationPicture != undefined){
            response.data.general.organizationPicture = '/api/v1/common/file/'+response.data.general.organizationPicture;
        }

        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateGeneralInfo(req,res){

    const validationSchema = joi.object().keys({
        organizationName:joi.string().required(),
        domainName:joi.string().required(),
        address:joi.string().required(),
        city:joi.string().required(),
        state:joi.string().required(),
        country:joi.string().required(),
        zipCode: joi.string().required(),
        phone:joi.string().required(),
        registrationNumber:joi.string().required(),
        coinName:joi.string().required(),
        homePageLeafletText:joi.string().required(),
        /* mongodbConnectionUrl:joi.string().required(),
        certificateStoreAddressMainnet:joi.string().required(),
        certificateStoreAddressBackup:joi.string().required(),
        uniblockApiEndpoint:joi.string().required(),
        uniblockApiKey:joi.string().required() */
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    if(req.files['logo'] == undefined)
    {
        req.body['logo'] = null;
    }else{
        req.body['logo'] = req.files['logo'][0].filename;
    }

    if(req.files['favicon'] == undefined)
    {
        req.body['favicon'] = null;
    }else
    {
        req.body['favicon'] = req.files['favicon'][0].filename;
    }

    if(req.files['organizationPicture'] == undefined)
    {
        req.body['organizationPicture'] = null;
    }else{
        req.body['organizationPicture'] = req.files['organizationPicture'][0].filename;
    }

    let response = await InstanceSettingService.updateGeneralInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getLocalizationInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('localization');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateLocalizationInfo(req,res){

    const validationSchema = joi.object().keys({
        dateFormat:joi.string().required(),
        timeFormat:joi.string().required(),
        timeZone:joi.string().required(),
        defaultLanguage:joi.string().required()
    });
    
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateLocalizationInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getEmailSettingInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('emailSettings');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateEmailSettingInfo(req,res){
    const validationSchema = joi.object().keys({
        host:joi.string().required(),
        userName:joi.string().required(),
        password:joi.string().required(),
        port:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateEmailSettingInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getGoogleApiSettingInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('googleApiSettings');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateGoogleApiSettingInfo(req,res){
    const validationSchema = joi.object().keys({
        apiKey:joi.string().required(),
        clientId:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateGoogleApiSettingInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getPaymentGatewayConfigInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('paymentGatewayConfig');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updatePaymentGatewayConfigInfo(req,res){
    const validationSchema = joi.object().keys({
        paymentGatewayType:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updatePaymentGatewayConfigInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}


async function getApiFieldConfigInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('apiFieldConfig');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateApiFieldConfigInfo(req,res){
    
    if(req.body.fields == undefined){
        return ResponseHandler.generateError(res, "Fields data are missing", null);
    }

    if(req.body.criteria == undefined){
        return ResponseHandler.generateError(res, "Criteria data are missing", null);
    }

    if(req.body.criteria.systemUniqueness == undefined ||
       req.body.criteria.blockchain == undefined ||
       req.body.criteria.listing == undefined ||
       req.body.criteria.details == undefined ||
       req.body.criteria.comparativeUniqueness == undefined){
        return ResponseHandler.generateError(res, "Critera other fields are missing", null);
    }

    if(Object.keys(req.body.fields).length != 12){
        return ResponseHandler.generateError(res, "Fields should be exact 12", null);
    }

    let refObj = {
        "0": "nationalId",
        "1": "firstName",
        "2": "lastName",
        "3": "studentId",
        "4": "address",
        "5": "email",
        "6": "mobileNumber",
        "7": "programLang1",
        "8": "programLang2",
        "9": "convocationDateLang1",
        "10": "convocationDateLang2",
        "11": "result"
    };

    let arrRefObj = Object.values(refObj);
    let arrFieldObj = Object.values(req.body.fields);

    var arrMissingField = arrRefObj.filter(function(obj) { return arrFieldObj.indexOf(obj) == -1; });

    if(arrMissingField.length > 0){
        return ResponseHandler.generateError(res, "Some fields are missing, Missing Fields: "+JSON.stringify(arrMissingField), null);
    }

    /* check duplicates columns */
    let arrDuplicates = arrFieldObj.reduce(function(acc, el, i, arr) {
        if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el); return acc;
      }, []);
    
    if(arrDuplicates.length > 0){
        return ResponseHandler.generateError(res, "Some duplicate fields found, Duplicate Fields: "+JSON.stringify(arrDuplicates), null);
    }  

    /* Remove systemUniqueness and comparativeUniqueness 7 to 11 data if came from request data*/
    let reqData = req.body;

    for(let i = 7; i<=11; i ++){
       i = i.toString();

       if(reqData.criteria.systemUniqueness.includes(i)){
            let _indexSystemUniqueness = reqData.criteria.systemUniqueness.indexOf(i);
            
            if(_indexSystemUniqueness > -1){
                reqData.criteria.systemUniqueness.splice(_indexSystemUniqueness, 1);
            }
       } 

       if(reqData.criteria.comparativeUniqueness.includes(i)){
            let _indexComparativeUniqueness = reqData.criteria.comparativeUniqueness.indexOf(i);

            if(_indexComparativeUniqueness > -1){
                reqData.criteria.comparativeUniqueness.splice(_indexComparativeUniqueness, 1);
            }
        }
    }
    /* --------------------------------------------------------------------------------------- */


    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateApiFieldConfigInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getCertificateAccessTriggerInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('certificateAccessTrigger');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateCertificateAccessTriggerInfo(req,res){
    const validationSchema = joi.object().keys({
        accessType:joi.number().required(),
        accessCondition:joi.string()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateCertificateAccessTriggerInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getCertificateStoreInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('certificateStore');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateCertificateStoreInfo(req,res){
    const validationSchema = joi.object().keys({
        mainnet:joi.string().required(),
        uniblocknet:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateCertificateStoreInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getWalletInfo(req,res){

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.getDetails('walletAddress');
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateWalletInfo(req,res){
    const validationSchema = joi.object().keys({
        balanceInMainnet:joi.string().required(),
        balanceInUniblock:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _accountAdminId = req.currentUser._id;

    let response = await InstanceSettingService.updateWalletInfo(_accountAdminId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getBlockchainInfo(req,res){

    /* Perform Checks with Main Instance for Issuance Quota */
    let response = await UniblockGatewayService.getInstanceSettings();

    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }

   

}

async function getInfo(req,res){

    let queryData = req.query.searchTerm;
    if(queryData != undefined){
        queryData = JSON.parse(queryData)
    } 
    
    let response = await InstanceSettingService.getDetails(queryData);
    
    if (response.status == 'success') {

        
        /* Check if user role is present */
        if(req.currentUser != undefined && 
            req.currentUser.role != undefined && 
            req.currentUser.role != null &&
            req.currentUser.role == 'ROLE_ACCOUNT_ADMIN')
        {
            
            try
            {
                response['data'] = JSON.parse(JSON.stringify(response['data']))
                response['data']['credentials'] = {
                    uniblockUIGateway:preset.configs.uniblockGateway.uiEndpoint,
                    apiSecret:preset.configs.uniblockGateway.apiSecret,
                }
            }
            catch(e)
            {}
        }

        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
} 

module.exports = {
    getGeneralInfo:getGeneralInfo,
    updateGeneralInfo:updateGeneralInfo,
    getLocalizationInfo:getLocalizationInfo,
    updateLocalizationInfo:updateLocalizationInfo,
    getEmailSettingInfo:getEmailSettingInfo,
    updateEmailSettingInfo:updateEmailSettingInfo,
    getGoogleApiSettingInfo:getGoogleApiSettingInfo,
    updateGoogleApiSettingInfo:updateGoogleApiSettingInfo,
    getPaymentGatewayConfigInfo:getPaymentGatewayConfigInfo,
    updatePaymentGatewayConfigInfo:updatePaymentGatewayConfigInfo,
    getApiFieldConfigInfo:getApiFieldConfigInfo,
    updateApiFieldConfigInfo:updateApiFieldConfigInfo,
    getCertificateAccessTriggerInfo:getCertificateAccessTriggerInfo,
    updateCertificateAccessTriggerInfo:updateCertificateAccessTriggerInfo,
    getCertificateStoreInfo:getCertificateStoreInfo,
    updateCertificateStoreInfo:updateCertificateStoreInfo,
    getWalletInfo:getWalletInfo,
    updateWalletInfo:updateWalletInfo,
    getBlockchainInfo: getBlockchainInfo,
    getInfo:getInfo
}