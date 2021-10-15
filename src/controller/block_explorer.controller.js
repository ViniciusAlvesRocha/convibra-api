let ResponseHandler = require("../util/response-handler");
let BlockExploreService = require("../service/block-explorer.service");
let ChainService = require("../service/chain.service");

async function getSummary(req,res){
    let response = await BlockExploreService.getSummary();

    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getBlocks(req,res){

    const validationSchema = joi.object().keys({
        fromBlockNumber: joi.string().trim().required(),
        toBlockNumber: joi.string().trim().required(),
        fallbackPerPage: joi.string().trim().required(),
    });

    const result = validationSchema.validate(req.query);
    if (result.error) {
        return ResponseHandler.generateError(res, "Validation failed", result.error);
    }

    let response = await BlockExploreService.getBlocks(req.query);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getBlockDetails(req,res){
  
    let response = await BlockExploreService.getBlockDetails(req.params.blockHash);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getTxDetails(req,res){
    let response = await BlockExploreService.getTxDetails(req.params.txHash);
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function getAddressDetails(req,res){
    let response = {
        "message": "",
        "data": "",
        "status": "success",
    }  

    
    if (response.status == 'success') {
        return ResponseHandler.generateSuccess(res, response.message, response.data);
    }
    else {
        return ResponseHandler.generateError(res, response.message, null);
    }
}

async function guessEntity(req,res){

    let _response = {
        "message": "",
        "data": null,
        "status": "success",
    }

    let _term = req.query.term;

    _addressResponse = ChainService.isAddress(_term);
    if(_addressResponse['status'] == 'success')
    {
        _response['data'] = 'address';
        return ResponseHandler.generateSuccess(res, _response.message, _response.data);
    }    

    _response = await BlockExploreService.getBlockDetails(_term);
    if(_response['status'] == 'success')
    {
        _response['data'] = 'block';
        return ResponseHandler.generateSuccess(res, _response.message, _response.data);
    }  
    else
    {
        _response = await BlockExploreService.getTxDetails(_term);
        if(_response['status'] == 'success')
        {
            _response['data'] = 'transaction';
            return ResponseHandler.generateSuccess(res, _response.message, _response.data);
        }
    }

    _response['status'] = 'error';
    _response['message'] = "Invalid Tx Hash or Block #"
    return ResponseHandler.generateError(res, _response.message, null);
}

module.exports = {
    getSummary: getSummary,
    getBlocks: getBlocks,
    getBlockDetails: getBlockDetails,
    getTxDetails: getTxDetails,
    getAddressDetails: getAddressDetails,
    guessEntity:guessEntity
}