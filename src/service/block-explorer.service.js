let ChainService = require("../service/chain.service");
let Certificate = require('../model/certificate.model');

async function getSummary(){
    let _response = {
        "message": "",
        "data": "",
        "status": "success",
    }  

    try
    {
        let _data = {
            latestBlockNumber:0,
            lastestGasPrice:0,
            latestBlockTime:0,
            latestDifficulty:0
        };
    
        let _provider = await ChainService.getProviderInstance("uniblocknet");
    
        _data.latestBlockNumber = await _provider.getBlockNumber();
        _data.lastestGasPrice = (await _provider.getGasPrice()).toString();
    
        /* Block Time  */
        let _latestBlock = await _provider.getBlock(_data.latestBlockNumber);
        let _previousBlockIndex = _data.latestBlockNumber >= 0 ? _data.latestBlockNumber - 1 : _data.latestBlockNumber;
        let _previousBlock = await _provider.getBlock(_previousBlockIndex);
    
        _data.latestBlockTime = _latestBlock.timestamp - _previousBlock.timestamp
    
        /* Latest Difficulty */
    
        _data.latestDifficulty = _latestBlock.difficulty;

        _response['status'] = 'success';
        _response['data'] = _data;
        _response['message'] = "Retrieved Succesfully";
    }
    catch(_error)
    {
        _response['status'] = 'failure';
        _response['message'] = _error.message;
    }

    return _response;
}

async function getBlocks(_query){
    let _response = {};
    try
    {
        
        let _builtQuery = {
            fromBlockNumber: Math.abs(parseInt(_query.fromBlockNumber)),
            toBlockNumber: Math.abs(parseInt(_query.toBlockNumber)),
            fallbackPerPage: Math.abs(parseInt(_query.fallbackPerPage)),
        }
    
        /* Handle blockNumber */
        if(isNaN(_builtQuery.fromBlockNumber) || _builtQuery.fromBlockNumber == undefined)
        {
            _builtQuery.fromBlockNumber = null;
        }

        if(isNaN(_builtQuery.toBlockNumber) || _builtQuery.toBlockNumber == undefined)
        {
            _builtQuery.toBlockNumber = null;
        }

        /*  fromBlockNumber should be lesser than from toBlockNumber*/
        if(_builtQuery.fromBlockNumber != null && _builtQuery.toBlockNumber != null && _builtQuery.fromBlockNumber > _builtQuery.toBlockNumber)
        {
            _response['status'] = 'failure';
            _response['message'] = 'From Block number should be lesser than to block number';
            return _response;
        }
    

        /* Provider */
        let _provider = await ChainService.getProviderInstance("uniblocknet");
    
        /* If blocknumber is null */

        /* LAtest Block Number */
        let _latestBlockNumber = await _provider.getBlockNumber();


        if(_builtQuery.fromBlockNumber == null)
        {
            _builtQuery.toBlockNumber = await _provider.getBlockNumber();
            _builtQuery.fromBlockNumber = _builtQuery.toBlockNumber - _builtQuery.fallbackPerPage;
        }


        let _arrPromise = [];
        for(let _tmpBlockNumber = _builtQuery.toBlockNumber; _tmpBlockNumber > _builtQuery.fromBlockNumber; _tmpBlockNumber--)
        {
            _arrPromise.push(_provider.getBlock(_tmpBlockNumber));
        }
    
        let _blocks = await Promise.all(_arrPromise);
        _blocks.map((_block) => {
            if(_block == null) return _block;

            _block['gasUsedFormatted'] = _block.gasUsed.toString()
            _block['timestampFormatted'] = moment(_block.timestamp * 1000).toLocaleString()
            _block['confirmations'] = (_latestBlockNumber - _block.number) + 1;
        });


        /* Get TX Details from TX Hash */
        /*
        let _allTxPromise = [];
        _blocks.forEach((_block,_blockIndex) => {
            _blocks[_blockIndex]['confirmations'] = (_latestBlockNumber - _block.number) + 1;
            _block.transactions.forEach(async (_tx,_txIndex) => {
                let _tmpPromise = new Promise(async(resolve,reject) => {
                    _blocks[_blockIndex].transactions[_txIndex] = await _provider.getTransaction(_tx);
                    resolve();
                });
                
                _allTxPromise.push(_tmpPromise);
            });
        });
        */

        /* Wait for TX Fetch */
        /* await Promise.all(_allTxPromise); */

        _response['status'] = 'success';
        _response['data'] = {
            listing: _blocks,
            latestBlockNumber: _latestBlockNumber,
            listingExhausted:_latestBlockNumber == _builtQuery.toBlockNumber 
        };
        _response['message'] = "Retrieved Succesfully";
    }
    catch(_error)
    {
        _response['status'] = 'failure';
        _response['message'] = _error.message;
    }

    return _response;

}
async function getBlockDetails(_blockHash){
    let _response = {};

    /* Check if its Hash if not then convert into int */
    let _isHexString = ChainService.isHexString(_blockHash);
    if(_isHexString['status'] == 'failure')
    {
        _blockHash = parseInt(_blockHash);
    }

    try
    {
        
        /* Provider */
        let _provider = await ChainService.getProviderInstance("uniblocknet");

        /* LAtest Block Number */
        let _latestBlockNumber = await _provider.getBlockNumber();

        
        _response['data'] = await _provider.getBlock(_blockHash);

        if(_response['data'] != null)
        {
            if(_response['data'].number != undefined)
            {
                _response['data']['confirmation'] = (_latestBlockNumber - _response['data'].number) + 1;
                _response['data']['timestampFormatted'] = moment(_response['data'].timestamp * 1000).toLocaleString()
                _response['data']['gasLimitFormatted'] = _response['data'].gasLimit.toString();
                _response['data']['gasUsedFormatted'] = _response['data'].gasUsed.toString();
            }
            
            let _allTxPromise = [];
            if(_response['data'].transactions != undefined)
            {
                _response['data'].transactions.forEach(async (_tx,_txIndex) => {
                    let _tmpPromise = new Promise(async(resolve,reject) => {
                        _response['data'].transactions[_txIndex] = await _provider.getTransaction(_tx);

                        _response['data'].transactions[_txIndex]['timestampFormatted'] = _response['data']['timestampFormatted'];
                        _response['data'].transactions[_txIndex]['gasPriceFormatted'] = _response['data'].transactions[_txIndex].gasPrice.toString();
                        _response['data'].transactions[_txIndex]['gasLimitFormatted'] = _response['data'].transactions[_txIndex].gasLimit.toString();
                        _response['data'].transactions[_txIndex]['valueFormatted'] = _response['data'].transactions[_txIndex].value.toString();
                        resolve();
                    });
                    
                    _allTxPromise.push(_tmpPromise);
                });

                /* Wait for TX Fetch */
                await Promise.all(_allTxPromise);
            }

            _response['status'] = 'success';
            _response['message'] = "Retrieved Succesfully";
        }
        else
        {
            _response['status'] = 'failure';
            _response['message'] = "Block does not exists.";
        }
        
    }
    catch(_error)
    {
        _response['status'] = 'failure';
        _response['message'] = _error.message;
    }

    return _response;
}

async function getTxDetails(_txHash){
    let _response = {};
    try
    {
        /* Provider */
        let _provider = await ChainService.getProviderInstance("uniblocknet");

        _response['data'] = await _provider.getTransaction(_txHash);
        if(_response['data'] != null)
        {
            /* Get Timestamp  */
            _response['data']['timestampFormatted'] = 'NA';
            _response['data']['gasPriceFormatted'] = _response['data'].gasPrice.toString();
            _response['data']['gasLimitFormatted'] = _response['data'].gasLimit.toString();
            _response['data']['valueFormatted'] = _response['data'].value.toString();

            if(_response['data']['blockNumber'] != undefined)
            {
                let _tmpBlock = await getBlockDetails(_response['data']['blockNumber']);
                
                if(_tmpBlock['status'] == 'success')
                {
                    _response['data']['timestampFormatted'] = moment(_tmpBlock['data'].timestamp * 1000).toLocaleString()
                }

                /* LAtest Block Number */
                let _latestBlockNumber = await _provider.getBlockNumber();
                if(_latestBlockNumber - _response['data']['blockNumber'] === 0)
                {
                    _response['data']['confirmations'] = 'Unconfirmed';
                }
            }

            /* Check transaction hash with certificate issuance */
            let certificateIssuanceData  = await Certificate.findOne({issuanceTxHash: _txHash});

            /* Check transaction hash with certificate revocation */
            let certificateRevocationData = await Certificate.findOne({'revocationDetails.txHash' : _txHash});

            if(certificateIssuanceData != null){
                _response['data']['actionPerformed'] = 'Certificate Issuance';
                _response['data']['certificateInfo'] = certificateIssuanceData;
            }

            if(certificateRevocationData != null){
                _response['data']['actionPerformed'] = 'Certificate Revocation';
                _response['data']['certificateInfo'] = certificateRevocationData;
            }

            if(certificateIssuanceData == null && certificateRevocationData == null){
                _response['data']['actionPerformed'] = 'Other';
                _response['data']['certificateInfo'] = '';
            }
            
            // console.log('_response',_response);
            // console.log('certificateRevocationData',certificateRevocationData); 

            _response['status'] = 'success';
            _response['message'] = "Retrieved Succesfully";
        }
        else
        {
            _response['status'] = 'failure';
            _response['message'] = "Tx does not exists.";
        }    
    }
    catch(_error)
    {
        _response['status'] = 'failure';
        _response['message'] = _error.message;
    }

    return _response;
}

async function getAddressDetails(){}


module.exports = {
    getSummary: getSummary,
    getBlocks: getBlocks,
    getBlockDetails: getBlockDetails,
    getTxDetails: getTxDetails,
    getAddressDetails: getAddressDetails
}
