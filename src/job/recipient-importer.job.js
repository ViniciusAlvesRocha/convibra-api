let UserService = require("../service/user-service");
let RecipientImportQueue = require('../model/recipient-import-queue.model');
let InstanceSettings = require('../model/instance-setting.model');
let Course = require('../model/course.model');
let User = require('../model/user.model');
var EncryptionUtil = require("../util/encryption-utility");
var VerificationToken = require("../model/verification-token.model");
var MailerUtil = require("../util/mailer.util");
let sha1 = require('sha1');
var moment = require('moment');
var axios = require('axios');

module.exports = async function (job, done) {

    try {
        await processJob(job, done);
    }
    catch (e) {
        done(e.message);
    }
}

async function processJob(job, done) {

    /* Get Data */
    let subAccountAdminID = job.data.subAccountAdminID;
    let recipientImportType = job.data.recipientImportType;

    try {
        if (recipientImportType == 'API') {

            let _apiUrl = job.data.apiUrl;
            let _headerName = job.data.headerName;
            let _headerValue = job.data.headerValue;

            let tmpHeader = {};
            tmpHeader[_headerName] = 'Bearer ' + _headerValue;

            let resultData = await axios.get(_apiUrl, { headers: tmpHeader });

            if (resultData.data != undefined) {

                /* Find Current Process Batch Record */
                let currentImportQueueId = job.data.currentImportQueueId;
                _currentBatch = await RecipientImportQueue.findOne({ _id: currentImportQueueId });
                _currentBatch.stats['startedAt'] = new Date();
                _currentBatch.stats['totalRecords'] = 0;
                _currentBatch.save();

                await processRecords(resultData.data, subAccountAdminID, recipientImportType, _currentBatch, done);
            }

        } else if (recipientImportType == 'CSV') {

            let fileName = job.data.fileName;

            /* Find Current Process Batch Record */
            let currentImportQueueId = job.data.currentImportQueueId;
            _currentBatch = await RecipientImportQueue.findOne({ _id: currentImportQueueId });
            _currentBatch.stats['startedAt'] = new Date();
            _currentBatch.stats['totalRecords'] = 0;
            _currentBatch.save();

            /* Read CSV File */
            let streamResponse = await autoloaded.FileService.getFileStream(fileName);
            if (streamResponse['status'] == 'failure') {
                done(new Error(streamResponse['message']));
            }

            /*  Parse to JSON  */
            let _csvRecords = {}

            _csvRecords = await autoloaded.FileService.streamCSVToJSON(streamResponse['data'], true, false);

            await processRecords(_csvRecords, subAccountAdminID, recipientImportType, _currentBatch, done);

        }
    } catch (e) {
        // console.log(e.message);
        done(new Error(e.message));
    }
}

async function processRecords(_userRecords, subAccountAdminID, recipientImportType, _batch, done) {

    try {

        /* Update Batch Status */
        if (recipientImportType == 'CSV') {
            _batch.stats['validForImport'] = _userRecords.length;
        }
        _batch.stats['log'] = 'Recipient ' + recipientImportType + ' import job has been initialized';
        _batch.stats['totalRecords'] = _userRecords.length;
        _batch.jobProcessStatus = 'PROCESSING';
        _batch.save();

        /* Get Instance Settings */
        let instanceSettingData = await InstanceSettings.findOne({});

        if (instanceSettingData == null) {
            done(new Error('Unable to get instance settings for this import'));
            // _response["status"] = "failure";
            // _response["message"] = "Unable to get instance settings for this import";
            // return _response;
        }

        let apiFieldConfigFields = instanceSettingData['apiFieldConfig']['fields'];

        /* Flip Config Keys */
        let apiFieldConfigFieldIndexMap = Object.keys(apiFieldConfigFields).reduce((_data, key) => {
            _data[apiFieldConfigFields[key]] = key;
            return _data;
        }, {});

        /* Get comparativeUniqueness fields */
        let comparativeUniquenessFields = instanceSettingData['apiFieldConfig']['criteria']['comparativeUniqueness'];

        /* Get systemUniqueness fiels */
        let systemUniquenessFields = instanceSettingData['apiFieldConfig']['criteria']['systemUniqueness'];

        /*  Filter Duplicates  Courses */
        var uniqueProgram = filterDuplicateCourses(_userRecords, apiFieldConfigFieldIndexMap['programLang1'], apiFieldConfigFieldIndexMap['programLang2']);
        uniqueProgram = Object.values(uniqueProgram);

        let courseMap = {};
        courseMap = await processCourses(uniqueProgram, subAccountAdminID);

        /* Get Exisiting Recipient */
        let systemUniquenessFieldsIndex = [];
        systemUniquenessFields.forEach((_key, _dataIndex) => {
            systemUniquenessFieldsIndex.push(apiFieldConfigFields[_dataIndex]);
        });

        /*  Deal with Existing Users */
        let _existingUserPromise = [];

        try {

            let recipientAddressToBeAdded = [];
            let errCnt = 0;

            for(let _userData of _userRecords) {

                _userData = transformToKeyBased(apiFieldConfigFieldIndexMap, _userData);

                    let _userCriteria = buildSystemUniquenessCriteria(systemUniquenessFieldsIndex, _userData);
                    let _existingUser = await User.findOne(flat.flatten(_userCriteria));

                    /* Transform to Lowercase */

                    let _processedAdditionalData = {};
                    if(_userData.additional != undefined)
                    {
                        for(let _tmpIdx in _userData.additional)
                        {
                            _processedAdditionalData[_tmpIdx.toLowerCase() ] = _userData.additional[_tmpIdx];
                        }

                        _processedAdditionalData['result'] = _userData.result;
                    }
                    else
                    {
                        _userData.additional = {};
                    }

                    _userData.additional = _processedAdditionalData;

                    try {

                        /* Existing User */
                        if (_existingUser != null) {

                            /* Basic Details */
                            _existingUser.firstName = _userData.firstName;
                            _existingUser.lastName = _userData.lastName;
                            _existingUser.email = _userData.email;
                            _existingUser.mobileNumber = _userData.mobileNumber;
                            _existingUser.personalAddress = _userData.address;

                            /* Extra Details */
                            /* extraData = _userData.recipientDetails.additional;
    
                            extraData.nationalId = _userData.nationalId,
                            extraData.studentId  = _userData.studentId;
                                    
                            _existingUser.recipientDetails.additional = extraData; */

                            _existingUser.recipientDetails.additional = {
                                nationalId: _userData.nationalId,
                                studentId: _userData.studentId
                            };

                            
                             



                            /* Course Details */
                            if (_userData.programLang1 != undefined && _userData.programLang2 != undefined) {

                                /* Find Checksum */
                                let checkSum = sha1(("" + _userData.programLang1 + "::" + _userData.programLang2 + "").toUpperCase());

                                /* Find course using checkSum */
                                let course = courseMap[checkSum];

                                let tmpConvoDateLang1 = moment.utc(_userData.convocationDateLang1).hours(0).minutes(0).seconds(0).toDate();
                                let tmpConvoDateLang2 = _userData.convocationDateLang2;

                                let tmpCourseData = {
                                    _id: course._id,
                                    nameLang1: course.nameLang1,
                                    nameLang2: course.nameLang2,
                                    convocationDateLang1: tmpConvoDateLang1,
                                    convocationDateLang2: tmpConvoDateLang2,
                                    additional: _userData.additional
                                }

                                /*  Find If Course Already Exists for Recipient  */
                                let tmpCourseNeedle = _existingUser.recipientDetails.courses.find((x) => {
                                    return x._id.toString() == course._id.toString();
                                });

                                let tmpCourseNeedleIndex = _existingUser.recipientDetails.courses.indexOf(tmpCourseNeedle);

                                if (tmpCourseNeedleIndex != -1) {
                                    _existingUser.recipientDetails.courses[tmpCourseNeedleIndex] = tmpCourseData;
                                }
                                else {
                                    _existingUser.recipientDetails.courses.push(tmpCourseData);
                                }
                            }


                            /* If existing user email is not verified then send email */
                            if (_existingUser.isEmailVerified == false) {

                                /*  Create Password  */
                                _existingUser.salt = uuid();
                                let rawPassword = uuid();
                                _existingUser.password = EncryptionUtil.encryptPassword(_existingUser.salt, rawPassword);

                                /*  Generate Verification Token  */
                                let verificationToken = {
                                    email: _userData.email, token: uuid(), type: 'EMAIL_VERIFICATION'
                                };

                                await VerificationToken.create(verificationToken);

                                let mailData = {
                                    firstName: _userData.firstName,
                                    lastName: _userData.lastName,
                                    email: _userData.email,
                                    token: verificationToken.token,
                                    rawPassword: rawPassword,
                                    url: `${preset.configs.siteUrl}/email/verification/${verificationToken.token}`
                                };

                                console.log("Token Sent ",`${preset.configs.siteUrl}/email/verification/${verificationToken.token}`);

                                try{
                                    await MailerUtil.sendMail("recipient-creation-invitation", _userData.email, mailData);
                                }
                                catch(e)
                                {
                                    console.log(e,"Mail sending error")
                                }
                            }

                            await _existingUser.save();
                        }
                        else {

                            /* New User */
                            let newUser = {};
                            newUser.recipientDetails = {};

                            /* Basic Details */
                            newUser.role = 'ROLE_RECIPIENT';
                            newUser.firstName = _userData.firstName;
                            newUser.lastName = _userData.lastName;
                            newUser.email = _userData.email;
                            newUser.mobileNumber = _userData.mobileNumber;
                            newUser.personalAddress = _userData.address;

                            /*  Create Password  */
                            newUser.salt = uuid();
                            let rawPassword = uuid();
                            newUser.password = EncryptionUtil.encryptPassword(newUser.salt, rawPassword);

                            /*  Create User Wallet  */
                            createUserWallet(newUser);

                            /* Push for Blockchain Operation */
                            recipientAddressToBeAdded.push(newUser.ethAddress);


                            /* Find Checksum */
                            let checkSum = sha1(("" + _userData.programLang1 + "::" + _userData.programLang2 + "").toUpperCase());

                            /* Find course using checkSum */
                            let course = courseMap[checkSum];

                            // console.log(_userData.convocationDateLang1,"Raw _userData.convocationDateLang1");
                            // console.log(_userData.convocationDateLang2,"Raw _userData.convocationDateLang2");

                            // let tmpConvoDateLang1 = moment.utc(_userData.convocationDateLang1).hours(0).minutes(0).seconds(0).toDate();
                            let tmpConvoDateLang1 = _userData.convocationDateLang1;
                            let tmpConvoDateLang2 = _userData.convocationDateLang2;

                            let tmpCourseData = {
                                _id: course._id,
                                nameLang1: course.nameLang1,
                                nameLang2: course.nameLang2,
                                convocationDateLang1: tmpConvoDateLang1,
                                convocationDateLang2: tmpConvoDateLang2,
                                additional: _userData.additional
                            }

                            // console.log(tmpCourseData); return;

                            /* Extra Details */
                            // extraData = _userData.recipientDetails;

                            // extraData.additional.nationalId = _userData.nationalId,
                            // extraData.additional.studentId  = _userData.studentId,

                            // newUser.recipientDetails = extraData;



                            newUser.recipientDetails.additional = {
                                nationalId: _userData.nationalId,
                                studentId: _userData.studentId
                            };


                            newUser.recipientDetails.courses = [];
                            newUser.recipientDetails.courses.push(tmpCourseData);

                            // console.log(newUser); return;

                            await User.create(newUser);





                            /*  Generate Verification Token  */
                            let verificationToken = {
                                email: newUser.email,
                                token: uuid(), 
                                type: 'EMAIL_VERIFICATION'
                            };

                            console.log("Token Sent ",`${preset.configs.siteUrl}/email/verification/${verificationToken.token}`);
                            
                            await VerificationToken.create(verificationToken);

                            let mailData = {
                                firstName: newUser.firstName,
                                lastName: newUser.lastName,
                                email: newUser.email,
                                token: verificationToken.token,
                                rawPassword: rawPassword,
                                url: `${preset.configs.siteUrl}/email/verification/${verificationToken.token}`
                            };

                            try{
                                await MailerUtil.sendMail("recipient-creation-invitation", newUser.email, mailData);
                            }
                            catch(e)
                            {
                                console.log(e,"Mail sending error")
                            }
                            
                        }



                    }
                    catch (e) {
                        errCnt++;
                        _batch.stats['log'] = e.message;
                    }

            }


            /* Update Batch Status */
            if (errCnt == _userRecords.length) {
                // _batch.stats['log'] = 'Error while processing '+ recipientImportType+' recipient';
                _batch.jobProcessStatus = 'FAILED';
                done(new Error(_batch.stats['log']));
            } else {
                _batch.stats['log'] = 'Recipient processed successfully';
                _batch.stats['completedAt'] = new Date();
                _batch.jobProcessStatus = 'SUCCEEDED';
                _batch.save();
                done(null);
            }


            /* Add Recipient to Blockchain */
            if (recipientAddressToBeAdded.length > 0) {

                let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
                let _relayerPrivateKey = await autoloaded.ChainService.getRelayerPrivateKey();
                let _wallet = await autoloaded.ChainService.getWalletInstance(_relayerPrivateKey, _provider);
                let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_wallet);

                
                let recipientAddressToBeAddedPromise = [];
                
                for (let _ethAddress of recipientAddressToBeAdded) {
                    try
                    {
                        let _nonce = await autoloaded.ChainService.getNonce(_wallet.address, true);
                        await UserService.addRecipientOnChain(_certificateInstance, _ethAddress, {
                            nonce: _nonce
                        });

                        // console.log("Blockchain issuance done for "+ _ethAddress._id);
                    }
                    catch(e)
                    {
                        console.log(e,"Blockchain issuance error");
                    }
                }               
            }

            /* Free up memory  */
            _userRecords = [];


            




        } catch (e) {
            done(new Error(e.message));
        }
    } catch (e) {
        done(new Error(e.message));
    }
}

async function issueRecipientOnChain(_certificateInstance, _ethAddress, _options) {
    return new Promise(async (_resolve, _reject) => {
        try {
            let _blockchainResponse = await _certificateInstance.addRecipient(_ethAddress, _options);
            let _tx = await _blockchainResponse.wait();

            _resolve({ ethAddress: _ethAddress, txHash: _tx.transactionHash });
        }
        catch (e) {
            console.log("Blockchain TX Failure for Data: ", _ethAddress, e.message);
            _resolve({ ethAddress: _ethAddress, txHash: null });
        }

    });
}

function createUserWallet(newUser) {
    // create ethereum wallet
    let ethWallet = ethers.Wallet.createRandom();
    newUser.encKey = uuid();
    newUser.privateKey = EncryptionUtil.encryptText(newUser.encKey, ethWallet.privateKey);
    newUser.ethAddress = ethWallet.address;
}

function transformToKeyBased(_keyMapArr, _data) {
    let _rawData = _data;
    let _rawIndexMap = Object.keys(_rawData);

    _data = Object.values(_data);

    let _finalData = {};
    for (let _keyData in _keyMapArr) {
        let _tmpIndex = parseInt(_keyMapArr[_keyData]);
        _finalData[_keyData] = _data[_tmpIndex];
        delete _rawIndexMap[_tmpIndex];

    }

    /*  _finalData['recipientDetails'] = {
         "additional": {}
     }; */

    /* Removed undefined */
    /* _rawIndexMap = _rawIndexMap.filter(_data => _data);
    _rawIndexMap.forEach((_field,_index)=>{
        _finalData['recipientDetails']['additional'][_field] = _rawData[_field];
    }); */

    _finalData['additional'] = {};

    /* Removed undefined */
    _rawIndexMap = _rawIndexMap.filter(_data => _data);
    _rawIndexMap.forEach((_field, _index) => {
        _finalData['additional'][_field] = _rawData[_field];
    });


    return _finalData;
}

function buildSystemUniquenessCriteria(_criteriaArr, _data) {
    let _builtCriteria = {
        "recipientDetails": {
            'additional': {}
        }
    };

    let _additionalFound = false;
    _criteriaArr.forEach((_criteria, _key) => {
        if (_criteria == 'nationalId' || _criteria == 'studentId') {
            _additionalFound = true;
            _builtCriteria['recipientDetails']['additional'][_criteria] = _data[_criteria];
        }
        else {
            _builtCriteria[_criteria] = {};
            _builtCriteria[_criteria] = _data[_criteria];
        }
    });

    if (_additionalFound == false) {
        delete _builtCriteria['recipientDetails'];
    }

    return _builtCriteria;
}


function filterDuplicateCourses(records, indexLang1, indexLang2) {
    let finalRecords = {};
    records.forEach((data, index) => {
        data = Object.values(data);
        indexLang1 = parseInt(indexLang1);
        indexLang2 = parseInt(indexLang2);

        let tmpIndex = sha1(("" + data[indexLang1] + "::" + data[indexLang2] + "").toUpperCase());
        if (finalRecords[tmpIndex] != undefined) {
            finalRecords[tmpIndex] = {};
        }

        finalRecords[tmpIndex] = {
            nameLang1: data[indexLang1],
            nameLang2: data[indexLang2],
            checksum: tmpIndex
        }
    })

    return finalRecords;
}

async function processCourses(uniquePrograms, subAccountAdminID) {
    let courseMap = {};

    /* Existing Course  */
    let existingCourseMap = {};

    let existingCourse = await Course.find({
        "subAccountAdminID": subAccountAdminID
    });

    /* Transform Course Map */
    if (existingCourse.length > 0) {
        existingCourse.forEach((_data) => {
            existingCourseMap[_data.checksum] = _data;
        });

        existingCourse = [];
    }

    let coursePromise = [];

    /* Check for Duplication  */
    uniquePrograms.forEach((_program, _index) => {
        let programChecksum = _program.checksum;

        /* Only Create if Does not exist */
        if (existingCourseMap[programChecksum] == undefined) {
            let _course = new Course({
                subAccountAdminID: subAccountAdminID,
                nameLang1: _program.nameLang1,
                nameLang2: _program.nameLang2,
                checksum: programChecksum
            });

            coursePromise.push(_course.save());
        }

    });

    let _completedCourses = await Promise.all(coursePromise);

    _completedCourses.forEach((_course) => {
        existingCourseMap[_course.checksum] = _course;
    });

    return existingCourseMap;
}