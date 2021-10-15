let ResponseHandler = require("../util/response-handler");
var CourseService = require("../service/course.service");

async function getListing(req,res){

    let pageNumber = req.query.pageNumber;
    let limit      = req.query.limit;

    let _subAccountAdminID = false;

    if(req.currentUser.role == 'ROLE_SUB_ACCOUNT_ADMIN'){
        _subAccountAdminID  = req.currentUser._id;
    }else if(req.currentUser.role == 'ROLE_ISSUER'){
        _subAccountAdminID = req.currentUser.issuerDetails.subAccountID;
    }

    let condition = {subAccountAdminID:_subAccountAdminID};

    let queryCondition = {
        pagination: {
            pageNumber: pageNumber,
            limit: limit
        },
        query: {
            filter: condition
        }
    };

    let response = await CourseService.getListing(queryCondition);
    
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getDetails(req,res){

    let _courseId          = req.params.id;
    let _subAccountAdminID = req.currentUser._id;

    let response = await CourseService.getDetails(_subAccountAdminID,_courseId);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function create(req,res){
    
    let _currentUserId = req.currentUser._id;

    const validationSchema = joi.object().keys({
        nameLang1: joi.string().trim().required(),
        nameLang2: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await CourseService.storeCourse(req.body,_currentUserId);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function update(req,res){
    
    let _courseId      = req.params.id;
    let _currentUserId = req.currentUser._id;

    const validationSchema = joi.object().keys({
        nameLang1: joi.string().trim().required(),
        nameLang2: joi.string().trim().required()
    });

    const result = validationSchema.validate(req.body);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await CourseService.updateCourse(req.body, _currentUserId, _courseId);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function deleteCourse(req,res){

    let _courseId   = req.params.id;

    let response = await CourseService.deleteCourse(_courseId);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }

}

module.exports = {
    getListing:getListing,
    getDetails:getDetails,
    create:create,
    update:update,
    deleteCourse:deleteCourse
}