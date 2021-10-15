let ResponseHandler = require("../util/response-handler");
var RecipientImportService = require("../service/recipient-import-service");

async function createRecipientCSVImportQueue(req,res){

    const validationSchema = joi.object().keys({
        tag:joi.string().required()
    });
    
    //Check validation for tag
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Please enter tag", result.error);
    }

    //Check validation for CSV file
    if((!req.file) || (!req.file.originalname)){
        return ResponseHandler.generateError(res, "Please upload CSV file",null);
    }

    let response = await RecipientImportService.createRecipientCSVImportQueue(req.body, req.file, req.currentUser);

    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getRecipientImportQueueList(req, res){

    let pageNumber        = req.query.pageNumber;
    let limit             = req.query.limit;
    let subAccountAdminID = req.currentUser._id;
    let filter            = req.query.filter;
    
    let response = await RecipientImportService.getRecipientImportQueueList(pageNumber, limit, subAccountAdminID, filter);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function cronRecipientImport(req, res){

    let _subAccountAdminId = req.currentUser._id;

    let response = await RecipientImportService.cronRecipientImport(_subAccountAdminId);

    if (response.status == "success") {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    } else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

module.exports = {
    createRecipientCSVImportQueue:createRecipientCSVImportQueue,
    getRecipientImportQueueList:getRecipientImportQueueList,
    cronRecipientImport:cronRecipientImport
}