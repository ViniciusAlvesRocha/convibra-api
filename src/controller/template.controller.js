let ResponseHandler = require("../util/response-handler");
var TemplateService = require("../service/template.service");

async function storeData(req,res){
    const validationSchema = joi.object().keys({
        name:joi.string().required(),
        description:joi.string().required(),
        startDate:joi.string().required(),
        endDate:joi.string().required(),
        language:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }
    
    let _subAccountID = null;

    if(req.currentUser.role == "ROLE_SUB_ACCOUNT_ADMIN")
    {
        _subAccountID = req.currentUser._id;
    }
    

    if(req.files['webDocument'] == undefined)
    {
        return ResponseHandler.generateError(res, "Web template file missing", null);
    }

    if(req.files['printDocument'] == undefined)
    {
        return ResponseHandler.generateError(res, "Print template file missing", null);
    }

    req.body['webDocument'] = req.files['webDocument'][0].filename;
    req.body['printDocument'] = req.files['printDocument'][0].filename;
    req.body['subAccountID'] = _subAccountID;

    console.log(_subAccountID,req.body,req.currentUser.role);

    let response = await TemplateService.storeData(_subAccountID,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
 
}

async function getDetail(req,res){
    
    let _subAccountID = null;
    let _templateId = req.params.id;

    if(req.currentUser.role == "ROLE_SUB_ACCOUNT_ADMIN")
    {
        _subAccountID = req.currentUser._id;
    }

    let response = await TemplateService.getData(_templateId);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getListing(req,res){

    let _subAccountID = null;

    if(req.currentUser.role == 'ROLE_SUB_ACCOUNT_ADMIN'){
        _subAccountID  = req.currentUser._id;
    }else if(req.currentUser.role == 'ROLE_ISSUER'){
        _subAccountID = req.currentUser.issuerDetails.subAccountID;
    }

    /* Initiate Condition  */
    
    let _condition = {
        filter:{},
        hasJSON:true,
        isRemoveParentID:false
    }

    if(req.currentUser.role == 'ROLE_ISSUER'){
        _condition['isRemoveParentID'] = true;
    }

    try
    {
        _condition.filter = JSON.parse(req.query.filter);
    }
    catch(_error)
    {}
    
    _condition.filter['subAccountID'] = [_subAccountID,null];

    let response = await TemplateService.getListing(_condition);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function deleteData(req,res){
    let _subAccountID = null;
    let _templateId = req.params.id;

    if(req.currentUser.role == "ROLE_SUB_ACCOUNT_ADMIN")
    {
        _subAccountID = req.currentUser._id;
    }

    let response = await TemplateService.deleteData(_subAccountID,_templateId);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function updateVersion(req,res){
    const validationSchema = joi.object().keys({
        parentID:joi.string().required(),
        startDate:joi.string().required(),
        endDate:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }
    
    let _subAccountID = null;

    if(req.currentUser.role == "ROLE_SUB_ACCOUNT_ADMIN")
    {
        _subAccountID = req.currentUser._id;
    }


    if(req.file == undefined || req.file == null){
        return ResponseHandler.generateError(res, "Template document file must be needed", null);
    }

    req.body['subAccountID'] = _subAccountID;

    let response = await TemplateService.updateVersion(req.body,req.file.filename);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getVersionHistory(req,res){
    
    let _subAccountID = null;
    if(req.currentUser.role == "ROLE_SUB_ACCOUNT_ADMIN")
    {
        _subAccountID = req.currentUser._id;
    }

    let _parentID = req.params.id;

    /* Initiate Condition  */
    
    let _condition = {
        filter:{},
        hasJSON:true,
        isRemoveParentID:false
    }

    _condition.filter['subAccountID'] = [_subAccountID,null];
    _condition.filter['parentID'] = _parentID;

    let parentResponse = await TemplateService.getData(_parentID);
    let response = await TemplateService.getListing(_condition);

    let _finalData = {
        'listing': response['data'],
        'parent': parentResponse['data'],
    };

    
    if (parentResponse.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, _finalData);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

module.exports = {
    storeData:storeData,
    getDetail:getDetail,
    getListing:getListing,
    deleteData:deleteData,
    updateVersion:updateVersion,
    getVersionHistory:getVersionHistory
}