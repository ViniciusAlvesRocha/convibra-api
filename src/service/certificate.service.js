const fse = require('fs-extra');
const uuid = (require('uuid')).v4;
const QRCode = require('qrcode')
const sha1 = require('sha1');
const path = require("path");
const execShPromise = require("exec-sh").promise;

let Certificate = require('../model/certificate.model');
let CertificateShare = require('../model/certificate-share.model');
let User = require("../model/user.model");
let CertificateStats = require("../model/certificate-stats.model");
var Batch = require("../model/batch.model");

var MailerUtil = require("../util/mailer.util");
var EncryptionUtil = require("../util/encryption-utility");
var UserService = require("./user-service");
var TemplateService = require("./template.service");
var InstanceSettingService = require("./instance-setting-service");
var CourseService = require("./course.service");
var toPdf = require('../util/docx-to-pdf-util');
var UniblockGatewayService = require("../service/uniblock-gateway.service");
const FileService = require("../service/file.service");

let CommonService = require('../service/common.service');

async function getListing(pageNumber, limit, condition) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let _certificateData = {};

        pageNumber = pageNumber - 1;
        let skip = pageNumber * limit;


        _certificateData = await Certificate.find(condition).sort({ 'uploadDate': -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean()
            .populate('issuedBy._id')
            .exec();

        let count = await Certificate.countDocuments(condition);

        let response = {
            'data': _certificateData,
            'count': count
        }

        _response["status"] = "success";
        _response["message"] = "Certificate listing data get successfully";
        _response["data"] = response;
    }
    catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}

async function getDetails(_condition) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let _certificateData = await Certificate.findOne(_condition)
            .populate('issuedById', ['firstName', 'lastName', 'ethAddress'])
            .exec();
        
        if(_certificateData == null)    
        {
            _response['status'] = "failure";
            _response['message'] = 'Certificate details not available';

            return _response;
        }

        let _certficateStatusData = {
            "certificateStore[mainnet]": _certificateData.rawCertificate.additionalData.certificateStore.mainnet,
            "certificateStore[uniblocknet]": _certificateData.rawCertificate.additionalData.certificateStore.uniblocknet,
            "merkleRoot": _certificateData.signedCertificate.signature.merkleRoot,
            "targetHash": _certificateData.signedCertificate.signature.targetHash
        }

        
        
        let _data = {
            "certificateData": {},
            "instanceSettingData": {},
            "insuanceRevocationData": {}
        }
        _data["certificateData"] = _certificateData;
        
        /* Feature Hide 25052020 */
        
        /* let certificateUniblockData = await UniblockGatewayService.getCertificateStatus(_certficateStatusData);
        if (certificateUniblockData.status != 'failure') {
            _data["insuanceRevocationData"] = certificateUniblockData.data;
        } */


        let _instanceSettingData = await InstanceSettingService.getDetails('general');


        if (_instanceSettingData != null) {
            _data["instanceSettingData"] = { "organizationName": _instanceSettingData.data.general.organizationName };
        }

        if (_certificateData != null) {

            _response["status"] = "success";
            _response["message"] = "Certificate details get successfully";
            _response["data"] = _data;

        } else {
            _response['status'] = "failure";
            _response['message'] = 'Certificate details not available';
        }

    } catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;

}

async function shareCertificateToVerifier(_data, _currentUser) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {
        let shareArray = [];

        let emails = _data.emails;
        let certificateId = _data.certificateId;
        let issuerId = _data.issuerId;

        let certificateUrl = `${preset.configs.siteUrl}/public/certificate/${certificateId}`;

        let certificateInfo = {
            firstName: _currentUser.firstName,
            lastName: _currentUser.lastName,
            url: preset.configs.siteUrl,
            certificateUrl: certificateUrl,
            isVerifierRegistered: false
        }

        let alreadyshared = await CertificateShare.find({ verifierEmail: { $in: emails }, certificateId: certificateId });

        let alreadysharedEmail = alreadyshared.map(v => v.verifierEmail);
        let emailTosave = emails.filter(val => !alreadysharedEmail.includes(val));

        for (let email of emails) {

            //Check whether verifier exist in system or not
            let _userData = await User.findOne({ email: email });

            //If its not present then create verifier and send password, email also
            let user = {};
            let verifierId = '';
            let emailTemplate = '';
            if (_userData == null) {

                user.firstName = 'NA';
                user.lastName = 'NA';
                user.rawPassword = uuid();
                user.salt = uuid();
                user.password = EncryptionUtil.encryptPassword(user.salt, user.rawPassword);
                user.email = email;
                user.role = 'ROLE_VERIFIER';
                user.isEmailVerified = true;

                // console.log(user.rawPassword);

                createUserWallet(user);
                let signupUser = new User(user);
                let savedUser = await signupUser.save();

                certificateInfo.isVerifierRegistered = true;
                certificateInfo.verifierEmail = user.email;
                certificateInfo.verifierPassword = user.rawPassword;

                verifierId = savedUser._id;
                emailTemplate = 'share-cert-to-new-verifier';
            } else {
                verifierId = _userData._id;
                emailTemplate = 'share-cert-to-existing-verifier';
            }

            let share = new CertificateShare({
                certificateId: certificateId,
                recipientId: _currentUser._id,
                verifierId: verifierId,
                verifierEmail: email,
                issuerId: issuerId
            })
            certificateInfo.finalUrl = `http://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=${certificateInfo.certificateUrl}&chld=H|0`

            MailerUtil.sendMail(emailTemplate, email , certificateInfo).then().catch(console.error);

            // MailerUtil.sendMail("share-cert.ejs", certificateInfo, email, "View Certificate")

            if (emailTosave.indexOf(email) > -1) {
                shareArray.push(share);
            }
        }

        if (shareArray.length > 0) {
            let shareCertResponse = await CertificateShare.create(shareArray);

            if (shareCertResponse) {
                _response['status'] = "success";
                _response['message'] = "Certificate shared successfully";
                _response['data'] = shareCertResponse;
            } else {
                _response['status'] = "failure";
                _response['message'] = "Unable to save certificate share information";
            }
        } else {
            _response['status'] = "failure";
            _response['message'] = "Certificate alreay shared";
        }

    } catch (e) {
        _response['status'] = "failure";
        _response['message'] = e.message;
    }

    return _response;
}

function createUserWallet(user) {
    // create ethereum wallet
    let ethWallet = ethers.Wallet.createRandom();
    user.encKey = uuid();
    user.privateKey = EncryptionUtil.encryptText(user.encKey, ethWallet.privateKey);
    user.ethAddress = ethWallet.address;
}


async function issueCertificate(_issuer, _requestData) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };


    let _subAccountID = _issuer.issuerDetails.subAccountID;
    let _presetSchema = preset.services.openCert.schema;
    let _recipients = [];
    let _courses = [];
    let _printableTemplates = [];
    let _templates = [];
    let _totalCertificateIssuance = 0;

    /* Blockchain Instance  */
    let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
    let _relayerPrivateKey = await autoloaded.ChainService.getRelayerPrivateKey();
    let _issuerPrivateKey = EncryptionUtil.decryptEncryptedText(_issuer.encKey, _issuer.privateKey);
    let _relayerWallet = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
    let _issuerWallet = await autoloaded.ChainService.getWalletInstance(_issuerPrivateKey, _provider);
    let _certificateInstanceAdmin = await autoloaded.ChainService.getCertificateInstance(_relayerWallet);
    

    /* Date Conversion */
    try {
        /* To avoid auto utc conversion */
        _requestData.certificationDate = moment.utc(_requestData.certificationDate + "T00:00:00.000Z", 'DD-MM-YYYYTHH:mm:ss');

        if (_requestData.certificationDate.isValid() == false) {
            throw (new Error("Invalid Date, required format DD-MM-YYYY"))
        }

        _requestData.certificationDate = _requestData.certificationDate.toDate();
    }
    catch (e) {

        _response['status'] = 'failure';
        _response['message'] = e.message;
        _response['data'] = e.stack;

        return _response;
    }



    /* Verify Private Key before proceeding */
    let _walletResponse = UserService.verifyPrivateKey(_requestData.privateKey);
    if (_walletResponse['status'] == 'failure') {

        _response['status'] = 'failure';
        _response['message'] = "Invalid Private Key";
        _response['data'] = null;

        return _response;
    }


    /* fetch recipients */

    let _recipientResponse = await UserService.getListing({
        query: {
            filter: {
                _id: { $in: _requestData.recipientID }
            }
        },

    });



    if (_recipientResponse['status'] == 'failure') {

        _response['status'] = 'failure';
        _response['message'] = "No valid recipients found.";
        _response['data'] = null;

        return _response;
    }

    /* Get into differnt variable */
    _recipients = _recipientResponse['data']['userData'];
    _recipientResponse = {};


    /* fetch courses */

    let _courseResponse = await CourseService.getListing({
        query: {
            filter: {
                subAccountAdminID: _subAccountID,
                _id: _requestData.courseID
            }
        }
    });

    if (_courseResponse['status'] == 'failure') {
        _response['status'] = 'failure';
        _response['message'] = "No valid courses found.";
        _response['data'] = null;

        return _response;
    }

    /* Get into differnt variable */
    _courses = _courseResponse['data']['courseData'];
    _courseResponse = {};


    /* fetch templates */


    let templatesResponse = await TemplateService.getListing({
        filter: {
            _id: _requestData.templateID,
            subAccountID: [_subAccountID, null]
        },
        hasJSON: true,
        isRemoveParentID: true
    });

    if (templatesResponse['status'] == 'failure') {
        _response['status'] = 'failure';
        _response['message'] = "No valid templates found.";
        _response['data'] = null;

        return _response;
    }

    /* Get into differnt variable */
    _templates = templatesResponse['data'];

    /* Filter Printable One  */
    _printableTemplates = templatesResponse['data'].filter((_data) => {
        return _data.certificateType == 'PRINT';
    });

    /* Open up for Garbage Collection */
    templatesResponse = {};


    /* Calculate Potential Certificates */
    _totalCertificateIssuance = _requestData.courseID.length * _requestData.recipientID.length;


    /* Load Issuer Wallet and ETH Provider  */



    /* Check if Issuer is Verified */
    let issuerStatus = await _certificateInstanceAdmin.isIssuer(_issuerWallet.address);
    if (issuerStatus == false) {
        _response['status'] = 'failure';
        _response['message'] = "Issuer is not verified on blockchain.";
        _response['data'] = null;

        return _response;
    }


    /* Perform Checks with Main Instance for Issuance Quota */
    
    /* let _mainUniblockSettingResponse = await UniblockGatewayService.getInstanceSettings();
    if (_mainUniblockSettingResponse['status'] == 'failure') {
        return _mainUniblockSettingResponse;
    }

    if (['data']['certificateIssuanceQuota'] <= _totalCertificateIssuance) {
        _response['status'] = 'failure';
        _response['message'] = "Certificate Issuance Quota Exhausted.";
        _response['data'] = null;

        return _response;
    } */

    /* Feature Hide 25052020 */
    let _mainUniblockSettingResponse = {
        data:{
            certificateStore:{
                mainnet:'0x0000000000000000000000000000000000000000',
                uniblocknet:'0x0000000000000000000000000000000000000000'
            }
        }
    }


    /* Fetch Certificate Store for this account  */

    if (_mainUniblockSettingResponse['data']['certificateStore']['mainnet'] == undefined ||
        _mainUniblockSettingResponse['data']['certificateStore']['uniblocknet'] == undefined) {
        _response['status'] = 'failure';
        _response['message'] = "Certificate Stores not deployed.";
        _response['data'] = null;

        return _response;
    }


    let _certificateStore = _mainUniblockSettingResponse['data']['certificateStore'];

    /* TODO: Array chunk , each of 50 record */
    let _chunkSize = 50;
    let _arrRecipientData = await CommonService.getChunkData(_recipients, _chunkSize);

    if (_arrRecipientData['status'] == 'failure') {
        _response["status"] = "failure";
        _response["message"] = _arrRecipientData['message'];
        return _response;
    }

    let _arrRecipientChunk = _arrRecipientData.data;

    for (let _chunkedRecipients of _arrRecipientChunk) {

        let _jobData = {
            _certificateStore: _certificateStore,
            _templates: _templates,
            _printableTemplates: _printableTemplates,
            _courses: _courses,
            _recipients: _chunkedRecipients,
            _subAccountID: _subAccountID,
            _presetSchema: _presetSchema,
            _certificationDate: _requestData.certificationDate,
            _issuer: _issuer,
        }

        /* Queue Job */
        let queueResponse = activeQueue["certificate-issuance.job"].add(_jobData);
    }

    _response['status'] = 'success';
    _response['message'] = 'Certificates generation queued successfully';

    return _response;

}

async function issueCertificateOnChain(_certificateInstance, _data, _trackId) {
    return new Promise(async (_resolve, _reject) => {
        try {
            
            let _blockchainResponse = await _certificateInstance.issueCertificate(_data.targetHash, _data.recipientAddress, _data.certificateData, _data.options);
            let _tx = await _blockchainResponse.wait();

            console.log(`Issuance on Blockchain Done: ${_tx.transactionHash}`,_data.targetHash, _data.recipientAddress, _data.certificateData, _data.options);

            _resolve({ trackId: _trackId, txHash: _tx.transactionHash, targetHash: _data.targetHash });
        }
        catch (e) {
            console.log("Blockchain TX Failure for Data: ", _data, e.message);
            _resolve({ trackId: _trackId, txHash: null, targetHash: _data.targetHash });
        }

    });
}

async function generateTemplatesForCertificate(_templates, _dbCertificate) {
    let _templatePromises = [];

    /*  Template PDF generation */
    _templates.forEach(async (_template) => {

        let _tmpPromise = new Promise(async (_resolve, _reject) => {
            try {

                let qrUrl = `${preset.configs.siteUrl}/public/certificate/${_dbCertificate.signedCertificate.signature.targetHash}`;

                /* QR Code Generation  */
                let _qrCodeObject = {
                    'issuer': _dbCertificate.issuedBy.address,
                    'certificateHash': _dbCertificate.signedCertificate.signature.targetHash,
                    'merkleRoot': _dbCertificate.signedCertificate.signature.merkleRoot,
                    'certificateStoreMainnet': _dbCertificate.rawCertificate.additionalData.certificateStore.mainnet,
                    'certificateStoreUniblocknet': _dbCertificate.rawCertificate.additionalData.certificateStore.uniblocknet,
                    'certificateURL': qrUrl
                };

                let _qrCertificateData = JSON.stringify(_qrCodeObject);
                let _qrDataUrl = await QRCode.toDataURL(_qrCertificateData)
                _dbCertificate['_qrDataUrl'] = _qrDataUrl;

                let _compiledPdf = await generateCompiledDoc(_template.document, _dbCertificate);

                let _tmpGeneratedFile = {
                    templateID: _template._id,
                    file: _compiledPdf
                }


                _dbCertificate.generatedFiles.push(_tmpGeneratedFile);
                if (_template.certificateType == "PRINT") {
                    _dbCertificate.printableGeneratedFiles.push(_tmpGeneratedFile);
                }


                _resolve(_dbCertificate);
            }
            catch (e) {
                console.log("Error Generation for Certificate [" + _dbCertificate.rawCertificate.id + "], Template [" + _template._id + "]", e.message);
                _reject(e);
            }
        });

        _templatePromises.push(_tmpPromise);

    });

    return Promise.all(_templatePromises);
}

async function generateCompiledDoc(_document, _dbCertificate) {
    return new Promise(async (_resolve, _reject) => {

        try {
            let _documentResponse = await autoloaded.FileService.getFileStream(_document);
            if (_documentResponse['status'] == 'success') {
                let docxBuffer = await autoloaded.FileService.streamToBuffer(_documentResponse['data']);
                let _fileName = uuid();

                var finalBuf = await docxTemplates({
                    output: 'buffer',
                    template: docxBuffer,
                    data: {
                        recipient: _dbCertificate.issuedTo.name,
                        courseNameLang1: _dbCertificate.course.Lang1,
                        courseNameLang2: _dbCertificate.course.Lang2,
                        date: moment().format("D/M/Y"),
                        convoDateLang1: _dbCertificate.convocationDate.Lang1,
                        convoDateLang2: _dbCertificate.convocationDate.Lang2,
                        serialNo: _dbCertificate.rawCertificate.id,
                        extraData: _dbCertificate.extraData,
                        fileId: _fileName

                    },
                    additionalJsContext: {
                        qrCode: () => {
                            let _data = _dbCertificate._qrDataUrl.slice('data:image/png;base64,'.length);
                            return { width: 3, height: 3, data: _data, extension: '.png' };
                        }
                    },
                    rejectNullish: true
                });

                try
                {
                    let _basePath = global.preset.constants.storage.certificateBatchTmp + '/' +_dbCertificate.batchID;
                    
                    let _inputFile = _basePath + "/" + _fileName+".docx";
                    let _outputDir = _basePath + "/output" ;
                    let _outputFile = _outputDir + "/" + _fileName+".pdf" ;

                    await fse.ensureDir(_basePath);
                    await fse.ensureDir(_outputDir);
                    await fse.ensureFile(_outputFile);

                    let _stream = await FileService.bufferToStream(finalBuf);
                    await FileService.writeStreamToFile(_stream,_inputFile);

                    _resolve(_fileName);
                }
                catch(_error)
                {
                    _reject(_error);
                }
                

                /* let pdfBuffer = await toPdf(finalBuf).catch((err) => {
                    _reject(new Error(err.message +" : "+_dbCertificate.rawCertificate.id));
                });

                var bufferStream = await autoloaded.FileService.bufferToStream(pdfBuffer);

                bufferStream.pipe(gridBucket.fs.openUploadStream(sha1(uuid()), { contentType: 'application/pdf' }))
                    .on('error', function (error) {
                        _reject(error);
                    })
                    .on('finish', function (e) {
                        _resolve(e.filename);
                    }); */
            }
            else {
                _reject(_documentResponse['message']);
            }
        }
        catch (e) {
            _reject(e);
        }
    });
}

async function bulkConvertDocToPdf(_inputDir,_outputDir){

    _inputDir = path.resolve(_inputDir);
    _outputDir = path.resolve(_outputDir);

    let cmd = `${global.preset.constants.soffice}  --headless --convert-to pdf --outdir ${_outputDir} ${_inputDir}/*.docx`;
    // Run on Child Process 
    try
    {
        let out = await execShPromise(cmd);
        let _arrGeneratedFile = await fse.readdir(_outputDir);

        if(_arrGeneratedFile.length > 0)
        {
            let _arrPromise = [];
            _arrGeneratedFile.forEach((_file) => {

                let _tmpPromise = new Promise((resolve, reject) =>{
                    
                    /* Extract File name from full name */
                    let _fileName = _file.split(".");
                                   
                    if(_fileName[0] != undefined)
                    {
                        /* Upload in Mongo fs */
                        let _rstream = fse.createReadStream(`${_outputDir}/${_file}`);
                        _rstream.pipe(gridBucket.fs.openUploadStream(_fileName[0], { contentType: 'application/pdf' }))
                        .on('error', function (error) {
                            resolve(false);
                        })
                        .on('finish', function (e) {
                            // console.log(_file,e.filename,"file,e.filename");
                            resolve(e.filename);
                        }); 
                    }
                    else
                    {
                        resolve(false);
                    }
                });

                _arrPromise.push(_tmpPromise);
            });

            await Promise.all(_arrPromise);
        }

        
        // Cleanup Directory
        /* try {
            await fse.remove(_basePath);
        } 
        catch(_error) 
        {
            console.error(_error)
        } */

        //   resolve(_buffer);
    }
    catch(_error)
    {
      console.log('Error: ', _error);
      console.log('Stderr: ', _error.stderr);
      console.log('Stdout: ', _error.stdout);

    //   reject(_error);
    }

}



async function revokeCertificate(_data, _issuer) {

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {

        let certificateData = await Certificate.findOne({ targetHash: _data.certificateHash });

        if (certificateData == null) {
            _response['status'] = 'failure';
            _response['message'] = 'Invalid certificate hash';
            return _response;
        }


        /* Get Private Key */
        let _privateKey = EncryptionUtil.decryptEncryptedText(_issuer.encKey, _issuer.privateKey);

        /* store data into database with pending status */
        let _updateData = {
            "isRevoked": true,
            "revocationDetails": {
                "revocationDate": new Date(),
                "reason": _data.reason
            }
        };

        let revokedData = await Certificate.updateOne({ targetHash: _data.certificateHash }, { $set: _updateData });

        /* Queue Job */
        let queueResponse = activeQueue["certificate-revocation.job"].add({
            targetHash: _data.certificateHash,
            issuerPrivateKey: _privateKey,
        });

        /* TODO: Call Main Instance for Revocation */

        _response['status'] = 'success';
        _response['message'] = "Certificate Revocation has queued sucessfully, Please check listing for the status";
    }
    catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;

}

async function updateRevocationTxnHash(_targetHash, _txnHash) {
    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {
        let certificateData = await Certificate.findOne({ targetHash: _targetHash });

        if (certificateData == null) {
            _response['status'] = 'failure';
            _response['message'] = 'Invalid certificate hash';
            return _response;
        }

        /* store data into database with pending status */
        let _updateData = {
            "revocationDetails": certificateData.revocationDetails
        };

        if (_updateData['revocationDetails'] == null || _updateData['revocationDetails'] == undefined) {
            _updateData['revocationDetails'] = {};
        }

        _updateData['revocationDetails']["txHash"] = _txnHash;

        let revokedData = await Certificate.updateMany({ targetHash: _targetHash }, _updateData);

        _response['status'] = 'success';
        _response['message'] = "Certificate revocation transaction hash updated successfully";
    }
    catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function getHistory(_data) {

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {

        let courseName = _data.courseName;
        let issuedToId = _data.issuedToId;
        let limit = _data.limit;
        let pageNumber = _data.pageNumber;

        pageNumber = pageNumber - 1;
        let skip = pageNumber * limit;

        courseName = courseName.replace(/\(/g, '\\(');
        courseName = courseName.replace(/\)/g, '\\)');

        let condition = {
            'issuedTo._id': issuedToId,
            'course.Lang1': { '$regex': courseName, '$options': 'i' }
        };

        let _certificateData = await Certificate.find(condition).sort({ 'uploadDate': -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        let count = await Certificate.countDocuments(condition);

        if (_certificateData.length <= 0) {
            let response = {
                'data': [],
                'count': count
            }

            _response["status"] = "failure";
            _response["message"] = "No certificate history found";
            _response["data"] = response;
        }
        else {
            let response = {
                'data': _certificateData,
                'count': count
            }

            _response["status"] = "success";
            _response["message"] = "Certificate history found";
            _response["data"] = response;
        }
    } catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function getBatchListing(condition) {

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {

        let _batchData = await Batch.find(condition).sort({ 'createdAt' : -1 });

        if (_batchData.length <= 0) {
            _response["status"] = "failure";
            _response["message"] = "No Batch found";
            return _response;
        }

        _response['status'] = 'success';
        _response['message'] = 'Batch records found';
        _response['data'] = _batchData;

    } catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function getSharedCertificateListing(pageNumber, limit, condition) {

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {

        pageNumber = pageNumber - 1;
        let skip = pageNumber * limit;

        let _certificateShareData = await CertificateShare.find(condition)
            .sort({ 'uploadDate': -1 })
            .populate('certificateId')
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        let count = await CertificateShare.countDocuments(condition);

        if (_certificateShareData.length <= 0) {
            let response = {
                'data': [],
                'count': count
            }

            _response["status"] = "failure";
            _response["message"] = "No shared certificate found";
            _response["data"] = response;
        }
        else {
            let response = {
                'data': _certificateShareData,
                'count': count
            }

            _response["status"] = "success";
            _response["message"] = "Shared certificates found";
            _response["data"] = response;
        }

    } catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }
    return _response;
}

async function storeCertificateStats(_data) {

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {

        let certificateId = _data.certificateId;
        let fingerPrint = 'fingerPrint_' + _data.fingerPrint;


        certificateStatsInfo = await CertificateStats.findOne({
            'certificateId': certificateId,
            'fingerPrint': fingerPrint
        })
            .sort({ date: 'desc' });

        let certificateStatsData = new CertificateStats({
            certificateId: certificateId,
            fingerPrint: fingerPrint
        });

        if (certificateStatsInfo == null) {
            await CertificateStats.create(certificateStatsData);
            _response['status'] = 'success';
            _response['message'] = 'Certificate Stats has been stored';
            return _response;
        }

        let currentDateTime = new Date();
        let currentISODateTime = currentDateTime.toISOString();

        let start = moment(certificateStatsInfo.date);
        let end = moment(currentISODateTime);

        let duration = moment.duration(end.diff(start));
        let hour = Math.floor(duration.asHours());

        if (hour > 1) {
            await CertificateStats.create(certificateStatsData);
            _response['status'] = 'success';
            _response['message'] = 'Certificate Stats has been stored';
            return _response;

        } else {
            _response['status'] = 'failure';
            _response['message'] = 'You have visited within 1 hour';
            return _response;
        }

    } catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }
    return _response;

}

async function claimCertificate(certificateId, currentUser) {

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {

        let certificateInfo = await Certificate.findOne({ _id: certificateId });

        if (certificateInfo == null) {
            _response['status'] = 'failure';
            _response['message'] = 'Certificate does not exist';
            return _response;
        }


        let targetHash = certificateInfo.targetHash;

        /* Get Recipient Private Key */
        let _recipientPrivateKey = EncryptionUtil.decryptEncryptedText(currentUser.encKey, currentUser.privateKey);


        let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
        let _wallet = await autoloaded.ChainService.getWalletInstance(_recipientPrivateKey, _provider);
        let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_wallet);

        let _relayerPrivateKey = await autoloaded.ChainService.getRelayerPrivateKey();
        let _relayerWallet = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
        let _relayerCertificateInstance = await autoloaded.ChainService.getCertificateInstance(_relayerWallet);

        /* check provided certificate hash(target hash) is valid or not  */
        let txCertificateData = {}

        try {

            txCertificateData = await _certificateInstance.getCertificate(targetHash);

            /* Check whether certificate is already claimed or not*/
            if (txCertificateData.isClaimed != false) {
                _response['status'] = 'failure';
                _response['message'] = 'Certificate is already claimed';
                return _response;
            }

            /* Check if Recipient is verified */
            txRecipientData = await _relayerCertificateInstance.isRecipient(txCertificateData.recipient);
            

            if (txRecipientData == false) {
                let options = {
                    nonce: await autoloaded.ChainService.getNonce(_relayerWallet.address, true)
                }

                let tx = await _relayerCertificateInstance.addRecipient(txCertificateData.recipient, options);
                let txResponse = await tx.wait();
            }

            /* Claim certificate on blockchain */
            
            let options = {
                nonce: await autoloaded.ChainService.getNonce(_wallet.address, true)
            }

            let tx = await _certificateInstance.claimCertificate(targetHash, options);
            let txResponse = await tx.wait();
            let txnHash = txResponse.transactionHash;

            /* Update Data into database */
            certificateInfo.isClaimed = true;
            certificateInfo.claimDetails.claimDate = new Date();
            certificateInfo.claimDetails.txHash = txnHash;
            await certificateInfo.save();

            _response['status'] = 'success';
            _response['message'] = 'Certificate claimed successfully';

        } catch (e) {
            _response['status'] = 'failure';
            _response['message'] = e.message;
            return _response;
        }

    } catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function generateCertificateZip(_batchId) {
    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try {
        let certificateData = await Certificate.find({ batchID: _batchId }, { printableGeneratedFiles: 1 });

        let arrFile = [];
        if (certificateData.length > 0) {
            certificateData.forEach((data) => {
                if (data.printableGeneratedFiles.length > 0) {
                    data.printableGeneratedFiles.forEach((genFile) => {
                        arrFile.push(genFile.file);
                    })
                }
            });
        }

        /* get a base file path */
        let batchPath = preset.configs.basePath.generatedBatchZip;
        let batchPathWithBatch = batchPath + "/" + _batchId;
        if (arrFile.length > 0) {

            /* remove old/existing batch id folder  */
            fse.removeSync(batchPathWithBatch);

            let arrPromise = [];
            arrFile.forEach((fileId) => {
                arrPromise.push(autoloaded.FileService.getFileStream(fileId));
            });

            /* resolve promise all */
            let arrFileStream = await Promise.all(arrPromise);

            let arrWirteFilePromise = [];
            if (arrFileStream.length > 0) {
                arrFileStream.forEach((fileStream, index) => {
                    let _fullFilePath = batchPathWithBatch + '/' + arrFile[index] + '.pdf';
                    arrWirteFilePromise.push(autoloaded.FileService.writeStreamToFile(fileStream['data'], _fullFilePath));
                });

                await Promise.all(arrWirteFilePromise);

                /* create a zip of that file */
                await autoloaded.FileService.createZip(batchPath, _batchId, batchPathWithBatch);

                _response['status'] = 'success';
                _response['message'] = "Batch: " + _batchId + ".zip created successfully";
            }
            else {
                _response['status'] = 'failure';
                _response['message'] = "Error while getting file stream";

                return _response;
            }
        }
        else {
            _response['status'] = 'failure';
            _response['message'] = "Error while getting files to process";

            return _response;
        }

    } catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function getCertificateIdQrScan(queryParam){
    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try{
        if(queryParam.issuer == undefined || queryParam.issuer == ''){
            _response['status'] = 'failure';
            _response['message'] = 'issuer is required';
            return _response;
        }

        if(queryParam.certificateHash == undefined || queryParam.certificateHash == ''){
            _response['status'] = 'failure';
            _response['message'] = 'certificateHash is required';
            return _response;
        }

        if(queryParam.merkleRoot == undefined || queryParam.merkleRoot == ''){
            _response['status'] = 'failure';
            _response['message'] = 'merkleRoot is required';
            return _response;
        }

        if(queryParam.certificateStoreMainnet == undefined || queryParam.certificateStoreMainnet == ''){
            _response['status'] = 'failure';
            _response['message'] = 'certificateStoreMainnet is required';
            return _response;
        }

        if(queryParam.certificateStoreUniblocknet == undefined || queryParam.certificateStoreUniblocknet == ''){
            _response['status'] = 'failure';
            _response['message'] = 'certificateStoreUniblocknet is required';
            return _response;
        }

        let certificateData = await Certificate.findOne({
                                                        'issuedBy.address' :  queryParam.issuer,
                                                        'signedCertificate.signature.targetHash': queryParam.certificateHash,
                                                        'signedCertificate.signature.merkleRoot': queryParam.merkleRoot,  
                                                        'rawCertificate.additionalData.certificateStore.mainnet': queryParam.certificateStoreMainnet,  
                                                        'rawCertificate.additionalData.certificateStore.uniblocknet': queryParam.certificateStoreUniblocknet  
                                                        },{_id:1});                                      

        if(certificateData == null){
            _response['status'] = 'failure';
            _response['message'] = 'No certificate available';
            return _response;
        }   
        
        _response['status'] = 'success';
        _response['data'] = certificateData;
        _response['message'] = 'Certificate id get successfully.';
        
    }catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;    
}

async function buildCSV(_criteria){

    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    try{
        let certificateRecords = await Certificate.find(_criteria);

        if(certificateRecords.length <= 0){
            _response['status'] = 'failure';
            _response['message'] = 'Unable to find certificate records.';
            return _response;
        }

        const records = certificateRecords.map(row=>({
            BatchID: row.batchID,
            IssuedOn:row.rawCertificate.issuedOn,
            IssuerName: row.rawCertificate.issuer.name,
            IssuerEmail: row.rawCertificate.issuer.email,
            RecipientName:  row.issuedTo.name,
            RecipientEmail: row.issuedTo.email,
            CourseNameLanguage1: row.course.Lang1,
            CourseNameLanguage2: row.course.Lang2,
            ConvocationDateLanguage1: row.convocationDate.Lang1,
            ConvocationDateLanguage2: row.convocationDate.Lang2,
            IsClaimed: row.isClaimed,
            IsRevoked: row.isRevoked,
            CertificateStatus: row.status,
            CertificateHash: row.targetHash,
            IssuanceTxHash: row.issuanceTxHash,
            RevocationTxHash:row.revocationDetails.txHash,
            FileID: row.generatedFiles.map(item => item.file).toString()
        }));

        const headers = Object.keys(records[0]);

        let responseData = {
            'rows':records,
            'headers':headers
        };
              
        _response['status']  = 'success';
        _response['data']    =  responseData;
        _response['message'] = 'Certificate records get successfully.';

    }catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }
    return _response;
}

module.exports = {
    getListing: getListing,
    getDetails: getDetails,
    shareCertificateToVerifier: shareCertificateToVerifier,
    createUserWallet: createUserWallet,
    issueCertificate: issueCertificate,
    revokeCertificate: revokeCertificate,
    updateRevocationTxnHash: updateRevocationTxnHash,
    getHistory: getHistory,
    getBatchListing: getBatchListing,
    getSharedCertificateListing: getSharedCertificateListing,
    storeCertificateStats: storeCertificateStats,
    claimCertificate: claimCertificate,
    generateCertificateZip: generateCertificateZip,
    generateCompiledDoc:generateCompiledDoc,
    generateTemplatesForCertificate:generateTemplatesForCertificate,
    issueCertificateOnChain:issueCertificateOnChain,   
    getCertificateIdQrScan:getCertificateIdQrScan,
    bulkConvertDocToPdf:bulkConvertDocToPdf,
    buildCSV:buildCSV
}