let APIConfigSetting = require('../model/api-config-setting.model');

async function updateAPIConfigSetting(_subAccountAdminId, _data) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let responseData = await APIConfigSetting.findOneAndUpdate({ subAccountAdminID: _subAccountAdminId },
                                                                    _data, 
                                                                    { upsert: true, new: true });

        _response["status"] = "success";
        _response["message"] = 'API configuration settings updated successfully.';
        _response["data"] = responseData;

    } catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }
    return _response;
}

async function getDetails(_subAccountAdminId){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        let apiConfigSettingData = await APIConfigSetting.findOne({subAccountAdminID:_subAccountAdminId});
 
        if(apiConfigSettingData != null){

            _response['data'] = apiConfigSettingData;
            _response['status'] = 'success';
            _response['message'] = 'API configuration setting details get successfully';

        }else{
            
            _response["status"] = "failure";
            _response["message"] = 'API configuration setting details not found';

        }

    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }
    return _response;

}

module.exports = {
    updateAPIConfigSetting: updateAPIConfigSetting,
    getDetails:getDetails
}