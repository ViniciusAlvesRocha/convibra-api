let ResponseHandler = require("../util/response-handler");
var EmailTemplateService = require("../service/email-template.service");
var decode = require('unescape');

async function getList(req,res){

    let response = await EmailTemplateService.getList();
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function storeData(req,res){

    req.body.templateHtml = decode(req.body.templateHtml);
    

    const validationSchema = joi.object().keys({
        templateName:joi.string().required(),
        templateSubject:joi.string().required(),
        templateFrom:joi.string().required(),
        templateFromEmail:joi.string().required(),
        templateHtml:joi.string().required(),
        templateVariables:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body);
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await EmailTemplateService.storeData(req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getDetail(req,res){
    let _id = req.params.id;
    let _isOnlyView = req.params.isOnlyView;
    let response = await EmailTemplateService.getDetail(_id,_isOnlyView);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }

}

async function updateData(req,res){

    let _templateId = req.params.id;

    req.body.templateHtml = decode(req.body.templateHtml);
    
    const validationSchema = joi.object().keys({
        // templateName:joi.string().required(),
        templateSubject:joi.string().required(),
        templateFrom:joi.string().required(),
        templateFromEmail:joi.string().required(),
        templateHtml:joi.string().required()
    });
    
    const result = validationSchema.validate(req.body);
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await EmailTemplateService.updateData(_templateId,req.body);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getDetailFromName(req,res){
    let _name = req.query.name;

    let response = await EmailTemplateService.getDetailFromName(_name);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }

}

module.exports = {
    getList:getList,
    storeData:storeData,
    getDetail:getDetail,
    updateData:updateData,
    getDetailFromName:getDetailFromName
}