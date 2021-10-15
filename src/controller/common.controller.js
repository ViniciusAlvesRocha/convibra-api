let ResponseHandler = require("../util/response-handler");
var CommonService = require("../service/common.service");

async function getDashboardStatistic(req,res){
    let response = await CommonService.getDashboardStatistic(req.currentUser);   
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

module.exports = {
    getDashboardStatistic: getDashboardStatistic
}