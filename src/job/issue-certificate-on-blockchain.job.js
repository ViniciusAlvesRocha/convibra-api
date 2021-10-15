let Batch = require("../model/batch.model");
let Certificate = require('../model/certificate.model');
let UserService = require("../service/user-service");
let CertificateService = require("../service/certificate.service");
let ChainService = require("../service/chain.service");
let EncryptionUtil = require("../util/encryption-utility");

module.exports = async function (job, done) {
    try {
        await processJob(job, done);
    }
    catch (e) {
        done(e.message);
    }
}

async function processJob(_jobData, _done) {

    /* Get Certificates */
    let condition = {
        'issuanceTxHash': null,
        'processingStatus': false,
    };

    let pageNumber = 1;
    let limit = 50;

    let _certificateResponse = await CertificateService.getListing(pageNumber, limit, condition);

    if (_certificateResponse.status == 'failure') {
        _done("No certificates found.")
    }

    if (_certificateResponse.data.data == null) {
        _done("Invalid certificates.");
    }

    try {

        await processForCertificates(_certificateResponse.data.data, _jobData);
        _done();
    }
    catch (e) {
        _done(`Process Halted ${e.message}`);
    }

}

async function processForCertificates(_certificateResponse, _jobData) {

    for (let _data of _certificateResponse) {

        try {

            let _updateData = { 'processingStatus': true };
            await Certificate.updateOne({ _id: _data._id }, _updateData);


            let _provider = await ChainService.getProviderInstance('uniblocknet');
            let _issuerPrivateKey = EncryptionUtil.decryptEncryptedText(_data.issuedBy._id.encKey, _data.issuedBy._id.privateKey);
            let _issuerWallet = await ChainService.getWalletInstance(_issuerPrivateKey, _provider);
            let _certificateInstance = await ChainService.getCertificateInstance(_issuerWallet);

            let _issuerNonce = await ChainService.getNonce(_issuerWallet.address, true);

            /* Deploy Certificate on Blockchain */
            let _tmpTargetHash = _data['signedCertificate']['signature']['targetHash'];
            let _tmpRecipientAddress = _data['rawCertificate']['additionalData']['assignedAddress'];
            let _tmpCertificateData = JSON.stringify(_data['rawCertificate']);

            let _trackId = _data['rawCertificate']['id'];

            let _txData = await CertificateService.issueCertificateOnChain(_certificateInstance, {
                targetHash: _tmpTargetHash,
                recipientAddress: _tmpRecipientAddress,
                certificateData: _tmpCertificateData,
                options: {
                    nonce: _issuerNonce
                },
                isClaimed:true
            }, _trackId);

            let updateData = {};
            if (_txData.txHash != null) {
                updateData['status'] = "COMPLETED"
            }
            else {
                updateData['status'] = "FAILED"
            }
            updateData['issuanceTxHash'] = _txData.txHash;
            updateData['claimDetails.txHash'] = _txData.txHash;
            updateData['claimDetails.claimDate'] = new Date();
            updateData['processingStatus'] = false;

            await Certificate.updateOne({ targetHash: _txData.targetHash }, updateData);
        }
        catch (e) {

            let _updateData = { 'processingStatus': false, 'issuanceTxHash': null };
            await Certificate.updateOne({ _id: _data._id }, _updateData)

            console.log("Failed Blockchain Issuance for " + _data._id)
        }

    }


}
