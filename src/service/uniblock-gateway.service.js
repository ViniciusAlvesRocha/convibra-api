let InstanceSetting = require('../model/instance-setting.model');

function getBaseConfig(){
    return {
        method: null,
        url: preset.configs.uniblockGateway.apiEndpoint + '/account-admin/private_instance',
        responseType: 'json',
        headers:{
            apiSecret:preset.configs.uniblockGateway.apiSecret
        },
        data:null,
        params:null
    }
}
async function getInstanceSettings(){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };    
    
    /* Feature Hide 25052020 */
    let data = await InstanceSetting.findOne({});
        
    if(data == null || data == undefined){
        _response['status'] = 'failure';
        _response['message'] = "Instance Setting data not available";

        return _response;
    }    

    _response['status'] = 'success';
    _response['message'] = "Instance Setting data get successfully";
    _response['data'] = data;

    return _response;
    

    let _endpointResponse = {};
    try
    {
        let _config = getBaseConfig();
        _config['method'] = 'GET';
        _config['url'] = _config['url'] + '/settings';

        _endpointResponse = await axios(_config);

        _response = _endpointResponse.data;
    }
    catch(e)
    {
        _response['status'] = 'failure';
        _response['data'] = e.stack;
        _response['message'] = e.message;
    }
     
    return _response;

}

async function revokeCertificate(certificates){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };    
    /* Feature Hide 25052020 */
    _response['status'] = 'success';
    return _response;

    let _endpointResponse = {};
    try
    {
        let _config = getBaseConfig();
        _config['method'] = 'POST';
        _config['url'] = _config['url'] + '/certificate/revoke';
        _config['data'] = certificates;

        _endpointResponse = await axios(_config);

        _response = _endpointResponse.data;
    }
    catch(e)
    {
        _response['status'] = 'failure';
        _response['data'] = e.stack;
        _response['message'] = e.message;
    }
     
    return _response;
}

async function getCertificateStatus(certificate){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };    
    
    /* Feature Hide 25052020 */
    _response['status'] = 'failure';
    return _response;

    let _endpointResponse = {};
    try
    {
        let _config = getBaseConfig();
        _config['method'] = 'GET';
        _config['url'] = _config['url'] + '/certificate/status';
        _config['params'] = certificate;

        _endpointResponse = await axios(_config);

        _response = _endpointResponse.data;
    }
    catch(e)
    {
        _response['status'] = 'failure';
        _response['data'] = e.stack;
        _response['message'] = e.message;
    }
     
    return _response;
}
async function issueCertificateBatch(_batch){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };    
    
    /* Feature Hide 25052020 */
    _response['status'] = 'success';
    return _response;

    let _endpointResponse = {};
    try
    {
        let _config = getBaseConfig();
        _config['method'] = 'POST';
        _config['url'] = _config['url'] + '/certificate/issue';
        _config['data'] = _batch;

        _endpointResponse = await axios(_config);

        _response = _endpointResponse.data;
    }
    catch(e)
    {
        _response['status'] = 'failure';
        _response['data'] = e.stack;
        _response['message'] = e.message;
    }
     
    return _response;
}

module.exports = {
    getInstanceSettings:getInstanceSettings,
    revokeCertificate:revokeCertificate,
    getCertificateStatus:getCertificateStatus,
    issueCertificateBatch:issueCertificateBatch
}