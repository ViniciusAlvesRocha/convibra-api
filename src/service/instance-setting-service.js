let InstanceSetting = require('../model/instance-setting.model');

async function getDetails(searchParam){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        
        let arrGetFields = ['accountAdminId','certificateIssuanceQuota'];

        if(typeof searchParam === 'object' && searchParam.length > 0){
            searchParam.forEach((data,index)=>{
                arrGetFields.push(data);
            });            
        }
        else{
            arrGetFields.push(searchParam);
        } 

        let data = await InstanceSetting.findOne({},arrGetFields);
        
        if(data == null || data == undefined){
            _response['status'] = 'failure';
            _response['message'] = "Instance Setting data not available";

            return _response;
        }    

        _response['status'] = 'success';
        _response['message'] = "Instance Setting data get successfully";
        _response['data'] = data;
    }
    catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function updateGeneralInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});

        let updateData = {'general':{}};

        updateData['general']['mongodbConnectionUrl'] = _data.mongodbConnectionUrl;

        if(_data.logo != null){
            updateData['general']['logo'] = _data.logo;
        }else{
            updateData['general']['logo'] = instanceSettingData.general.logo;
        }
        
        if(_data.favicon != null){
            updateData['general']['favicon'] = _data.favicon;
        }else{
            updateData['general']['favicon'] = instanceSettingData.general.favicon;    
        }

        if(_data.organizationPicture != null){
            updateData['general']['organizationPicture'] = _data.organizationPicture; 
        }else{
            updateData['general']['organizationPicture'] = instanceSettingData.general.organizationPicture; 
        }
        
        updateData['general']['organizationName'] = _data.organizationName;
        updateData['general']['domainName'] = _data.domainName;
        updateData['general']['address'] = _data.address;
        updateData['general']['city'] = _data.city;
        updateData['general']['state'] = _data.state;
        updateData['general']['country'] = _data.country;
        updateData['general']['zipCode'] = _data.zipCode;
        updateData['general']['phone'] = _data.phone;
        updateData['general']['registrationNumber'] = _data.registrationNumber;        
        updateData['general']['coinName'] = _data.coinName;
        updateData['general']['homePageLeafletText'] = _data.homePageLeafletText;
        updateData['general']['certificateStoreAddressMainnet'] = _data.certificateStoreAddressMainnet;
        updateData['general']['certificateStoreAddressBackup'] = _data.certificateStoreAddressBackup;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response['status'] = 'success';
        _response['message'] = "General information updated successfully";
    }
    catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function updateLocalizationInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});

        let updateData = {'localization':{}};

        updateData['localization']['dateFormat'] = _data.dateFormat;
        updateData['localization']['timeFormat'] = _data.timeFormat;
        updateData['localization']['timeZone'] = _data.timeZone;
        updateData['localization']['defaultLanguage'] = _data.defaultLanguage;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Localization information updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateEmailSettingInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});

        let updateData = {'emailSettings':{}};

        updateData['emailSettings']['host'] = _data.host;
        updateData['emailSettings']['userName'] = _data.userName;
        updateData['emailSettings']['password'] = _data.password;
        updateData['emailSettings']['port'] = _data.port;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Email settings updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateGoogleApiSettingInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});

        let updateData = {'googleApiSettings':{}};

        updateData['googleApiSettings']['apiKey'] = _data.apiKey;
        updateData['googleApiSettings']['clientId'] = _data.clientId;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Google API setting updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updatePaymentGatewayConfigInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});

        let updateData = {'paymentGatewayConfig':{}};

        updateData['paymentGatewayConfig']['paymentGatewayType'] = _data.paymentGatewayType;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Payment Gateway config updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}


async function updateApiFieldConfigInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let updateData = {'apiFieldConfig':{}};

        updateData['apiFieldConfig']['fields'] = _data.fields;
        updateData['apiFieldConfig']['criteria'] = _data.criteria;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "API field config updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateCertificateAccessTriggerInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});
        let updateData = {'certificateAccessTrigger':{}};

        updateData['certificateAccessTrigger']['accessType'] = _data.accessType;
        updateData['certificateAccessTrigger']['accessCondition'] = _data.accessCondition;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Certificate Access Trigger updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateCertificateStoreInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});
        let updateData = {'certificateStore':{}};

        updateData['certificateStore']['mainnet'] = _data.mainnet;
        updateData['certificateStore']['uniblocknet'] = _data.uniblocknet;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Certificate store updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateWalletInfo(_accountAdminId,_data){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let instanceSettingData = await InstanceSetting.findOneOrCreate({accountAdminId:_accountAdminId},{accountAdminId:_accountAdminId});
        let updateData = {'walletAddress':{}};

        updateData['walletAddress']['balanceInMainnet'] = _data.balanceInMainnet;
        updateData['walletAddress']['balanceInUniblock'] = _data.balanceInUniblock;

        await InstanceSetting.updateOne({accountAdminId:_accountAdminId},updateData);

        _response["status"] = "success";
        _response["message"] = "Wallet info updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

module.exports = {
    getDetails:getDetails,
    updateGeneralInfo:updateGeneralInfo,
    updateLocalizationInfo:updateLocalizationInfo,
    updateEmailSettingInfo:updateEmailSettingInfo,
    updateGoogleApiSettingInfo:updateGoogleApiSettingInfo,
    updatePaymentGatewayConfigInfo:updatePaymentGatewayConfigInfo,
    updateApiFieldConfigInfo:updateApiFieldConfigInfo,
    updateCertificateAccessTriggerInfo:updateCertificateAccessTriggerInfo,
    updateCertificateStoreInfo:updateCertificateStoreInfo,
    updateWalletInfo:updateWalletInfo
}