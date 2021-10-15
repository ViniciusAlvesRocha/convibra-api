let Certificate = require('../model/certificate.model')
let VerificationRequest = require('../model/verification-request.model')
let User = require('../model/user.model')

async function getDashboardStatistic(currentUser){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        let certificateData = await Certificate.countDocuments({status:'COMPLETED'});
        let verificationRequestData = await VerificationRequest.countDocuments({});
        
        let recipientData = await User.countDocuments({role:'ROLE_RECIPIENT'});
        let verifierData = await User.countDocuments({role:'ROLE_VERIFIER'});

        let issuerData = await User.countDocuments({role:'ROLE_ISSUER'});
    
        let data = {
                       "issuedCertificateCount": 0, 
                       "verificationRequestCount": 0, 
                       "recipientCount": 0, 
                       "issuerCount":0,
                       "verifierCount":0,
                       "userCount": 0
                    };

        data["issuedCertificateCount"]   =  certificateData;           
        data["verificationRequestCount"] =  verificationRequestData;           
        data["recipientCount"] =  recipientData;           
        data["issuerCount"] =  issuerData;           
        data["verifierCount"] =  verifierData;           
        
        _response["status"] = "success";
        _response["message"] = "Dashboard statistic data get successfully";
        _response["data"] = data;

    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }   
    
    return _response;
}

async function getChunkData(_records, _chunkSize) {

    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try {

        let _index = 0;
        let _arrayLength = _records.length;
        let _arrChunkedData = [];
        
        for (_index = 0; _index < _arrayLength; _index += _chunkSize) {
            _chunkedData = _records.slice(_index, _index+_chunkSize);
            _arrChunkedData.push(_chunkedData);
        }        

        _response["status"]   = "success";
        _response["message"]  = "Data divided into chunk successfully";
        _response["data"]     = _arrChunkedData;

    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }
    
    return _response;
}

module.exports = {
    getDashboardStatistic: getDashboardStatistic,
    getChunkData:getChunkData
}