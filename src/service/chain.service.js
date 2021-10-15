const axios = require('axios');
let cache = require('memory-cache');

async function getContractInstance(_contractAddress, _contractAbi, _relayerWallet) {
    return new ethers.Contract(_contractAddress, _contractAbi, _relayerWallet);
}

async function getCertificateInstance(_relayerWallet) {
    // let _contractJSON = (require(".././../../smart_contract/build/contracts/DocumentStore.json"));
    let _contractJSON = (require("../../smart_contract/build/contracts/Certificate.json"));
    let _contractAbi = _contractJSON.abi;
    let _contractAddress = _contractJSON.networks[preset.configs.blockchain.uniblocknet.networkId].address;

    return getContractInstance(_contractAddress, _contractAbi, _relayerWallet);
}

async function getWalletInstance(_signerPrivateKey, _ethProvider) {

    /* Add Condition to Autoload Ether (Except Relayer Wallet) */
    let _relayerWallet = new ethers.Wallet(getRelayerPrivateKey(), _ethProvider);
    let _signerWallet = new ethers.Wallet(_signerPrivateKey, _ethProvider);

    if(_relayerWallet.address != _signerWallet.address)
    {
        let minThresholdBalanceInWei = preset.configs.blockchain.minThresholdBalanceInWei || 0;
        let topUpBalanceInWei = preset.configs.blockchain.topUpBalanceInWei || 0; 

        let _currentBalanceBn = await _ethProvider.getBalance(_signerWallet.address);
        let _minThresholdBalanceBn = ethers.utils.bigNumberify(minThresholdBalanceInWei);
        let _topUpBalanceInWei = ethers.utils.bigNumberify(topUpBalanceInWei);


        /* If Less Than Threshold Transfer Topup Wei */
        if(_currentBalanceBn.lte(_minThresholdBalanceBn))
        {
            console.log("Min Threshold Hit for "+_signerWallet.address+", Funding (in Wei) "+topUpBalanceInWei);

            let _options = {
                // nonce: (await getNonce()).toString(),
                to: _signerWallet.address,
                value: _topUpBalanceInWei
            }


            let _status = await _relayerWallet.sendTransaction(_options);
            await _status.wait();
        }
    }

    return new ethers.Wallet(_signerPrivateKey, _ethProvider);
}

async function getWalletBalance(_address,_ethProvider){
    return _ethProvider.getBalance(_address)
}

/* async function getNonce(_senderAddress,toNumber) {
    return new Promise(async (_resolve,_reject) => {
        try
        {
            let _response = await axios({
                method: 'post',
                url: preset.configs.blockchain.uniblocknet.gethUrl,
                responseType: 'json',
                data: {
                    "method": "parity_nextNonce",
                    "params": [_senderAddress],
                    "id": 1,
                    "jsonrpc": "2.0"
                }
            });

            if(toNumber != undefined && toNumber == true)
            {
                _resolve(parseInt(_response.data.result,16))
            } 

            _resolve(_response.data.result);
        }
        catch(e)
        {
            _reject(e);
        }
    });
} */

async function getNonce(_senderAddress, toNumber) {

    return new Promise(async (_resolve, _reject) => {
        try {

            let _response = await axios({
                method: 'post',
                url: preset.configs.blockchain.uniblocknet.gethUrl,
                responseType: 'json',
                data: {
                    "method": "parity_nextNonce",
                    "params": [_senderAddress],
                    "id": 1,
                    "jsonrpc": "2.0"
                }
            });

            let _cachedNonce = cache.get(`nonce.${_senderAddress}`);

            // console.log('_cachedNonce',_cachedNonce);

            if (_cachedNonce == null) {
                _cachedNonce = parseInt(_response.data.result, 16);
                // console.log('inside if _cachedNonce',_cachedNonce);
            }
            else {
                _cachedNonce = parseInt(_cachedNonce) + 1;
                // console.log('inside else _cachedNonce',_cachedNonce);
            }

            cache.put(`nonce.${_senderAddress}`, _cachedNonce, 1000000, (key, _nonceCommited) => {
                // console.log('_nonceCommited',_nonceCommited);
            });

            _resolve(_cachedNonce);
        }
        catch (e) {
            _reject(e);
        }
    });
}

function getRelayerPrivateKey() {
    return preset.configs.blockchain.relayerPrivateKey;;
}

function getProviderInstance(_network) {

    /* Uniblocknet Provider */

    let _gethUrl = preset.configs.blockchain.uniblocknet.gethUrl;
    let _uniblocknetEthProvider = new ethers.providers.JsonRpcProvider(_gethUrl);

    if(_network == 'uniblocknet')
    {
        return _uniblocknetEthProvider;
    }
    else
    {
        return {
            "uniblocknet": _uniblocknetEthProvider
        }
    }
    
}

function isAddress(_address)
{
    let _response = {
        'status' : 'success'
    }

    try
    {
        ethers.utils.getAddress(_address);
        _response['status'] = 'success';
    }
    catch(e)
    {
        _response['status'] = 'error';
    }
    return _response;
}

function isHexString(_term){
    let _response = {
        'status' : 'success'
    }

    if(ethers.utils.isHexString(_term) == false)
    {
        _response['status'] = 'failure';
    }

    return _response;
}



module.exports = {
    getContractInstance: getContractInstance,
    getWalletInstance: getWalletInstance,
    getProviderInstance: getProviderInstance,
    getRelayerPrivateKey: getRelayerPrivateKey,
    getCertificateInstance:getCertificateInstance,
    getWalletBalance:getWalletBalance,
    getNonce:getNonce,
    isAddress:isAddress,
    isHexString:isHexString
}