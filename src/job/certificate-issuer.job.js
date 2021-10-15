let Batch = require("../model/batch.model");
let Certificate = require('../model/certificate.model');
let UserService = require("../service/user-service");

module.exports = async function (job, done) {
    
    try {
        await processJob(job.data);
        done(null);
    }
    catch (e) {
        done(e.message);
    }
}

async function processJob(_data,_done)
{
    let {_certificateStore,
        _templates,
        _printableTemplates,
        _courses,
        _recipients,
        _subAccountID,
        _issuer,
        _presetSchema,
        _certificationDate
    } = _data;
    
    let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
    let _issuerPrivateKey = autoloaded.EncryptionUtil.decryptEncryptedText(_issuer.encKey, _issuer.privateKey);
    let _issuerWallet = await autoloaded.ChainService.getWalletInstance(_issuerPrivateKey, _provider);
    let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_issuerWallet);

    /* Relayer Wallet */
    let _relayerPrivateKey = await autoloaded.ChainService.getRelayerPrivateKey();
    let _relayerWallet = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
    let _relayerCertificateInstance = await autoloaded.ChainService.getCertificateInstance(_relayerWallet);


    let _rawCertificateArr = [];
    let _dbCertificates = {};
    let _recipientPromises = [];

    /* Create Batch */
    let _batch = new Batch({
        subAccountID: _subAccountID

    });

    await _batch.save();

    /* Prepare Array for templates */
    let _templateID = _templates.map((_data) => {
        return _data._id;
    })

    /* Prepare Array for printable templates */
    let _printableTemplateID = _printableTemplates.map((_data) => {
        return _data._id;
    })

    let _relayerNonce = await autoloaded.ChainService.getNonce(_relayerWallet.address, true);
    let _recipientAddressToBeAddedPromise = [];

    /* Iterate courses  */
    for(let _course of _courses){
        for(let _recipient of _recipients){
            let _recipientCourseDetails = _recipient.recipientDetails.courses.find((_data) => {
                return _data._id.toString() == _course._id;
            });

            if (_recipientCourseDetails == null) {
                // console.log("Skipping Non Existent Course "+_course._id+", for recipient "+_recipient._id,_batch);
                logMessage(_batch._id, "Skipping Non Existent Course " + _course._id + ", for recipient " + _recipient._id, {});
                continue;
            }

            let _convocationDateLang = {
                Lang1: _recipientCourseDetails != undefined && _recipientCourseDetails.convocationDateLang1 != undefined ? _recipientCourseDetails.convocationDateLang1 : _certificationDate,
                Lang2: _recipientCourseDetails != undefined && _recipientCourseDetails.convocationDateLang2 != undefined ? _recipientCourseDetails.convocationDateLang2 : _certificationDate
            };

            let _extraData = { ..._recipient.recipientDetails.additional, ..._recipientCourseDetails.additional }

            let _dbCertificate = {
                batchID: _batch._id,
                subAccountID: _subAccountID,
                templateID: _templateID,
                printableTemplateID: _printableTemplateID,
                generatedFiles: [],
                printableGeneratedFiles: [],
                issuedTo: {
                    _id: _recipient._id,
                    name: _recipient.firstName + " " + _recipient.lastName,
                    email: _recipient.email,
                },
                issuedBy: {
                    _id: _issuer._id,
                    address: _issuer.ethAddress,
                },
                convocationDate: {
                    Lang1: _convocationDateLang.Lang1,
                    Lang2: _convocationDateLang.Lang2,
                },
                course: {
                    _id: _course._id,
                    Lang1: _course.nameLang1,
                    Lang2: _course.nameLang2,
                },
                extraData: _extraData,
                rawCertificate: {
                    "id": uuid(),
                    "issuedOn": (new Date(_convocationDateLang.Lang1)).toISOString(),
                    "name": _course.nameLang1,
                    "issuer": {
                        "name": _issuer.firstName + " " + _issuer.lastName,
                        "email": _issuer.email,
                        "address": _issuer.ethAddress
                    },
                    "recipient": {
                        "name": _recipient.firstName + " " + _recipient.lastName,
                        "email": _recipient.email
                    },
                    "additionalData": {
                        "certificateStore": _certificateStore,
                        "assignedAddress": _recipient.ethAddress
                    }
                },
                isClaimed:true
            } 

            _dbCertificates[_dbCertificate.rawCertificate.id] = _dbCertificate;
            _rawCertificateArr.push(_dbCertificate.rawCertificate);
        }
    }
    
    // _courses.forEach((_course) => {

    //     /*  Iterare recipients */
    //     _recipients.forEach(async (_recipient) => {
    //         let _recipientCourseDetails = _recipient.recipientDetails.courses.find((_data) => {
    //             return _data._id.toString() == _course._id;
    //         });

    //         if(_recipientCourseDetails == undefined)
    //         {
    //             // console.log("Skipping Non Existent Course "+_course._id+", for recipient "+_recipient._id,_batch);
    //             logMessage(_batch._id,"Skipping Non Existent Course "+_course._id+", for recipient "+_recipient._id,{});
    //             return;
    //         }

    //         let _tmpRecipientPromise = new Promise(async (_resolve, _reject) => {
    //             try {

    //                 let _convocationDateLang = {
    //                     Lang1: _recipientCourseDetails != undefined && _recipientCourseDetails.convocationDateLang1 != undefined ? _recipientCourseDetails.convocationDateLang1 : _certificationDate,
    //                     Lang2: _recipientCourseDetails != undefined && _recipientCourseDetails.convocationDateLang2 != undefined ? _recipientCourseDetails.convocationDateLang2 : _certificationDate
    //                 };

    //                 let _extraData = {..._recipient.recipientDetails.additional,..._recipientCourseDetails.additional}

    //                 let _dbCertificate = {
    //                     batchID: _batch._id,
    //                     subAccountID: _subAccountID,
    //                     templateID: _templateID,
    //                     printableTemplateID: _printableTemplateID,
    //                     generatedFiles: [],
    //                     printableGeneratedFiles: [],
    //                     issuedTo: {
    //                         _id: _recipient._id,
    //                         name: _recipient.firstName + " " + _recipient.lastName,
    //                         email: _recipient.email,
    //                     },
    //                     issuedBy: {
    //                         _id: _issuer._id,
    //                         address: _issuer.ethAddress,
    //                     },
    //                     convocationDate: {
    //                         Lang1: _convocationDateLang.Lang1,
    //                         Lang2: _convocationDateLang.Lang2,
    //                     },
    //                     course: {
    //                         _id: _course._id,
    //                         Lang1: _course.nameLang1,
    //                         Lang2: _course.nameLang2,
    //                     },
    //                     extraData: _extraData,
    //                     rawCertificate: {
    //                         "id": uuid(),
    //                         "issuedOn": (new Date(_convocationDateLang.Lang1)).toISOString(),
    //                         "name": _course.nameLang1,
    //                         "issuer": {
    //                             "name": _issuer.firstName + " " + _issuer.lastName,
    //                             "email": _issuer.email,
    //                             "address": _issuer.ethAddress
    //                         },
    //                         "recipient": {
    //                             "name": _recipient.firstName + " " + _recipient.lastName,
    //                             "email": _recipient.email
    //                         },
    //                         "additionalData": {
    //                             "certificateStore": _certificateStore,
    //                             "assignedAddress": _recipient.ethAddress
    //                         }
    //                     },
    //                     isClaimed:true
    //                 }

                    

                    

    //                 _dbCertificates[_dbCertificate.rawCertificate.id] = _dbCertificate;
    //                 _rawCertificateArr.push(_dbCertificate.rawCertificate);

    //                 _resolve();
    //             }
    //             catch (e) {
    //                 _reject(e);
    //             }
    //         });

            

    //         _recipientPromises.push(_tmpRecipientPromise);

    //         /* Add Recipient to Blockchain */

    //         /* let _recipientPromise = UserService.addRecipientOnChain(_relayerCertificateInstance, _recipient.ethAddress, {
    //             nonce: _relayerNonce++
    //         });

    //         _recipientAddressToBeAddedPromise.push(_recipientPromise); */
    //     });
    // });

    /* Let All Async Process Complete for Recipients */
    // await Promise.all(_recipientPromises);


    /* Sign Open Attestation */
    let _signedCertificateArr = openAttestation.issueDocuments(_rawCertificateArr, _presetSchema);

    /* Patch signCertificate */

    let _merkleRoot = null;
    let _blockchainPromises = [];
    let _templatePromises = [];
    let _issuerNonce = await autoloaded.ChainService.getNonce(_issuerWallet.address, true);



    _signedCertificateArr.map(async (_data, _index) => {
        let _trackId = _rawCertificateArr[_index].id;

        if (_dbCertificates[_trackId] != undefined) {

            _dbCertificates[_trackId]['signedCertificate'] = _data;
            _dbCertificates[_trackId]['targetHash'] = _data['signature']['targetHash'];

            _merkleRoot = _data['signature']['merkleRoot'];

            /* Deploy Certificate on Blockchain */
            /* let _tmpTargetHash = _data['signature']['targetHash'];
            let _tmpRecipientAddress = _dbCertificates[_trackId]['rawCertificate']['additionalData']['assignedAddress'];
            let _tmpCertificateData = JSON.stringify(_dbCertificates[_trackId]['rawCertificate']);

            
            let _promise = autoloaded.CertificateService.issueCertificateOnChain(_certificateInstance, {
                targetHash: _tmpTargetHash,
                recipientAddress: _tmpRecipientAddress,
                certificateData: _tmpCertificateData,
                options: {
                    nonce: _issuerNonce++
                },
                isClaimed:true
            },_trackId);

            _blockchainPromises.push(_promise); */

            /* Generate All certificates */
            try {

                let _promise = autoloaded.CertificateService.generateTemplatesForCertificate(_templates, _dbCertificates[_trackId]);
                _templatePromises.push(_promise);
            }
            catch (e) {
                // console.log("Error Generation for Certificate [" + _dbCertificates[_trackId].rawCertificate.id + "]", e.message,_batch);
                logMessage(_batch._id, "Error Generation for Certificate [" + _dbCertificates[_trackId].rawCertificate.id + "]", e.stack);
            }
        }
    });
   

    /* Wait for Blockchain Call to finish */
    /* try {

        // await Promise.all(_recipientAddressToBeAddedPromise);

        let _blockchainResponse = await Promise.all(_blockchainPromises);
        _blockchainResponse.map((_data) =>{
            
            if(_data.txHash != null)
            {
                _dbCertificates[_data.trackId]['status'] = "COMPLETED"
            }
            else
            {
                _dbCertificates[_data.trackId]['status'] = "FAILED"
            }
            _dbCertificates[_data.trackId]['issuanceTxHash']         = _data.txHash;
            _dbCertificates[_data.trackId]['claimDetails.txHash']    = _data.txHash;
            _dbCertificates[_data.trackId]['claimDetails.claimDate'] = new Date();
            
        });
    }
    catch (e) {
        // console.log("Blockchain Overall TX Failure ", e.message,_batch);
        logMessage(_batch._id,"Blockchain Overall TX Failure: ",e.stack);
    } */


    /* Wait for PDF Conversion for Generated Docx files */
    try {
        await Promise.all(_templatePromises);
    }
    catch (e) {
        logMessage(_batch._id, "Template Generation Failure: ", e.stack);
    }


    /* TODO: Send Email to Respective Certificates */
    Object.values(_dbCertificates).map((_dbCertificate) => {

        let recipientEmail = _dbCertificate.issuedTo.email;
        /* Access Complete Details About Certificate Here  */
        try {

            let mailData = {
                recipientName: _dbCertificate.issuedTo.name,
                issuerName: _dbCertificate.rawCertificate.issuer.name,
                courseName: _dbCertificate.course.Lang1,
                issuerAddress: _dbCertificate.issuedBy.address,
                url: `${preset.configs.siteUrl}/login`
            };
            autoloaded.MailerUtil.sendMail("certificate-issuance",recipientEmail,mailData);
        } catch (e) {
            console.log('Failure while sending email to recipient: '+recipientEmail,e.message,_batch);
            logMessage(_batch._id, "Failure while sending email to recipient: " + recipientEmail, e.stack);
        } 
    });


    /* Update Merkle Hash in Batch */


    await Batch.updateOne(
        { _id: _batch._id },
        {
            $set: {
                merkleRoot: _merkleRoot,
                totalRecords: _signedCertificateArr.length
            }
        }
    );

    // console.log("Done Processing Certificates for Batch ",_batch);

    logMessage(_batch._id, "Done Processing Certificates for Batch ", await Batch.findOne({ _id: _batch._id }));


    /* Store all certificates */
    try{
        await Certificate.insertMany(Object.values(_dbCertificates));
    }
    catch(e){
        console.log('Error while inserting certificates',e.message);
        logMessage(_batch._id, "Error while inserting certificates: ", e.stack);
    }
    
    /* Deployment on Main Instance  */
    
    /* Feature Hide 25052020 */

    /* let _batchChain = {
        "merkleRoot": _merkleRoot,
        "validRecords": ""+_signedCertificateArr.length+""
    }

    let _responseChain = await autoloaded.UniblockGatewayService.issueCertificateBatch(_batchChain); */

    try {
        let _inputDir = `${global.preset.constants.storage.certificateBatchTmp}/${_batch._id}`;
        let _outputDir = `${global.preset.constants.storage.certificateBatchTmp}/${_batch._id}/output`;

        activeQueue['issue-certificate-on-blockchain.job'].add({});

        activeQueue["certificate-convertor.job"].add({
            _inputDir: _inputDir,
            _outputDir: _outputDir,
            _batchId: _batch._id
        });
    }
    catch (e) {
        logMessage(_batch._id, "Template Generation Failure: ", e.stack);
    }

}

function logMessage(_batchId,_message,_data){ 
    console.log("[Certificate Issuance Log | Batch ID: "+_batchId+"]: "+_message,_data);
}