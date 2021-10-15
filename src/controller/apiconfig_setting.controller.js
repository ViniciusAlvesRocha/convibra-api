let ResponseHandler = require("../util/response-handler");
var APIConfigSettingService = require("../service/apiconfig-setting-service");

async function update(req,res){
    
    const validationSchema = joi.object().keys({
        apiUrl:joi.string().required(),
        scheduleType:joi.string().required(),
        scheduleTime:joi.string().required(),
        headerValue:joi.string().required(),
        isEnabled:joi.required()
    });
    
    const result = validationSchema.validate(req.body)
    if (result.error) {
       	return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let _subAccountAdminId = req.currentUser._id;
    req.body['headerName'] = 'Authorization';

    req.body['isEnabled'] = (req.body['isEnabled'] == "true" || req.body['isEnabled'] == true) ? true : false;

    let response = await APIConfigSettingService.updateAPIConfigSetting(_subAccountAdminId, req.body);

    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getDetails(req, res){
    let _subAccountAdminId = req.currentUser._id;

    let response = await APIConfigSettingService.getDetails(_subAccountAdminId);

    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }

}

module.exports = {
    update:update,
    getDetails:getDetails
}