let APIConfigSetting = require('../model/api-config-setting.model');
let RecipientImportQueue = require('../model/recipient-import-queue.model');
let InstanceSettings = require('../model/instance-setting.model');
let Course = require('../model/course.model');
let User = require('../model/user.model');
var EncryptionUtil = require("../util/encryption-utility");
var VerificationToken = require("../model/verification-token.model");
var MailerUtil = require("../util/mailer.util");
let sha1 = require('sha1');
var moment = require('moment');

async function cronRecipientImport(_subAccountAdminId){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{

        let _configData = await APIConfigSetting.findOne({subAccountAdminID:_subAccountAdminId});

        if(_configData == null){
            _response["status"] = "failure";
            _response["message"] = "API config setting details not found";
            return _response;
        }

        if(_configData.isEnabled == true){

            let scheduleTime = _configData.scheduleTime;
            let timeData     = scheduleTime.split(':');

            /* Get Hours and min from time string*/
            var scheduleHrs = timeData[0];
            var scheduleMin = timeData[1];

            /* var scheduleHrs = '14';
            var scheduleMin = '0'; */
            var cronString = '* * * * *';

            /* Process for DAILY */
            // if (_configData.scheduleType == 'DAILY'){
            //     cronString = scheduleMin + ' ' + scheduleHrs+' * * *';
            // }    

            // /* Process for WEEKLY */
            // if (_configData.scheduleType == 'WEEKLY') {
            //     cronString = scheduleMin + ' ' + scheduleHrs + ' * * 7';//7 for Sunday
            // }

            // /* Process for MONTHLY */
            // if (_configData.scheduleType == 'MONTHLY') {
            //     cronString = scheduleMin + ' ' + scheduleHrs + ' 1 * *'; //1 for Month
            // }

            console.log(cronString); 
            // return;

            let job =   new CronJob(cronString, async function() 
            {
                console.log("Recipient import from API job added in queue for subAccountAdminID: ",_configData.subAccountAdminID + 'at time ' + new Date());

                /* Insert into recipient import queue schema with jobProcessStatus = PENDING */
                let inputData = {
                    'subAccountAdminID': _subAccountAdminId,
                    'jobProcessStatus': 'PENDING',
                    'recipientImportType':'API'
                };
        
                //Store into Database
                let apiImportQueue = new RecipientImportQueue(inputData);
                let savedQueue = await apiImportQueue.save();

                /* Add job to queue  */
                activeQueue['recipient-importer.job'].add({ 
                                subAccountAdminID: _configData.subAccountAdminID,
                                apiUrl: _configData.apiUrl,
                                headerName:_configData.headerName,
                                headerValue:_configData.headerValue,
                                currentImportQueueId:savedQueue._id,
                                recipientImportType:savedQueue.recipientImportType
                            });
               
            }, null, true, 'UTC');

            _response["status"]  = "success";
            _response["message"] = 'Recipient importer api job has called';
           
        }else{
            _response["status"] = "failure";
            _response["message"] = 'API configuration setting is not enabled';
        }

    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
        _response["data"] = e.stack;
    }

    return _response;

}


async function createRecipientCSVImportQueue(_data, _CSVFile, _currentUser) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        //Check whether tag already exist or not
        let checkExistance = await RecipientImportQueue.find({ 'tag': _data.tag });

        if(checkExistance.length > 0){
            _response["status"]  = "failure";
            _response["message"] = 'Queue with same tag already exists';
            return _response;
        }

        /* Read CSV File */
        let streamResponse = await autoloaded.FileService.getFileStream(_CSVFile.filename);
        if (streamResponse['status'] == 'failure') {
            _response["status"] = "failure";
            _response["message"] = streamResponse['message'];
            return _response;
        }

        /*  Parse to JSON  */
        let _parsedData = {}

        _parsedData = await autoloaded.FileService.streamCSVToJSON(streamResponse['data'], false);
        let csvFields = Object.keys(_parsedData[0]);

        //Get Instance Settings
        let instanceSettingData = await InstanceSettings.findOne({});
        let apiFieldConfigFields = Object.values(instanceSettingData['apiFieldConfig']['fields']);


        /* let arrDiff = apiFieldConfigFields.filter( x => !csvFields.includes(x));

        if(arrDiff.length > 0){
            _response["status"] = "failure";
            _response["message"] = "Please check csv fields"
            return _response;
        } */

        let inputData = {
            'subAccountAdminID': _currentUser._id,
            'tag': _data.tag,
            'fileName': _CSVFile.filename,
            'jobProcessStatus': 'PENDING',
            'recipientImportType':'CSV'
        };

        //Store into Database
        let csvImportQueue = new RecipientImportQueue(inputData);
        let savedQueue = await csvImportQueue.save();

        /*---------------------------Code for JOB (START)-------------------------------------*/

         /* Add job to queue  */
            activeQueue['recipient-importer.job'].add({ 
                subAccountAdminID: savedQueue.subAccountAdminID,
                fileName: savedQueue.fileName,
                currentImportQueueId:savedQueue._id,
                recipientImportType:savedQueue.recipientImportType
            });

        /* let queueResponse = {
            data: {
                primaryId: savedQueue._id,
                fileName: savedQueue.fileName,
                subAccountAdminID: savedQueue.subAccountAdminID
            }
        };

        let jobResponse = await processJob(queueResponse);

        if (jobResponse['status'] == 'failure') {
            _response['status'] = 'failure';
            _response['message'] = jobResponse['message'];
            return _response;
        } */

        /*---------------------------Code for JOB (END)---------------------------------------*/


        // _response['data'] = jobResponse;
        _response['data'] = savedQueue;
        _response['status'] = 'success';
        _response['message'] = 'CSV file uploaded successfully';

    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
        _response["data"] = e.stack;
    }

    return _response;
}

async function getRecipientImportQueueList(pageNumber, limit, subAccountAdminID, filter){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        
        pageNumber = pageNumber - 1;
        let skip   = pageNumber * limit;
        
        let condition = {subAccountAdminID:subAccountAdminID};

        filter = JSON.parse(filter);

        if(filter.recipientImportType != undefined && filter.recipientImportType != "ALL"){
            condition.recipientImportType = filter.recipientImportType;
        }

        let queueData = await RecipientImportQueue.find(condition).sort({'createdAt': -1})
                                    .skip(parseInt(skip))
                                    .limit(parseInt(limit))
                                    .lean()
                                    .exec();

        let count = await RecipientImportQueue.countDocuments(condition);

        let response = {
            'data':queueData,
            'count':count
        }

        _response['status'] = 'success';
        _response['message'] = "Recipient import queue data get successfully";
        _response['data'] = response;
    }
    catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

/*---------------------------Code for JOB (START)-------------------------------------*/

async function processJob(job) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    let primaryId = job.data.primaryId;
    let fileName = job.data.fileName;
    let subAccountAdminID = job.data.subAccountAdminID;

    try {

        /* Find Current Process Batch Record */
        _csvBatch = await RecipientImportQueue.findOne({ _id: primaryId });
        _csvBatch.stats['startedAt'] = new Date();
        _csvBatch.stats['totalRecords'] = 0;
        _csvBatch.save();

        /* Read CSV File */
        let streamResponse = await autoloaded.FileService.getFileStream(fileName);
        if (streamResponse['status'] == 'failure') {
            _response["status"] = "failure";
            _response["message"] = streamResponse['message'];
            return _response;
        }

        /*  Parse to JSON  */
        let _csvRecords = {}

        _csvRecords = await autoloaded.FileService.streamCSVToJSON(streamResponse['data'], true, false);

        /* Update Batch Status */
        _csvBatch.stats['totalRecords']   = _csvRecords.length;
        _csvBatch.stats['validForImport'] = _csvRecords.length;
        _csvBatch.stats['log'] = 'Recipient import job has been initialized';
        _csvBatch.jobProcessStatus = 'PROCESSING';
        await updateBatchStatus(_csvBatch);


        /* Get Instance Settings */
        let instanceSettingData = await InstanceSettings.findOne({});

        if (instanceSettingData == null) {
            _response["status"] = "failure";
            _response["message"] = "Unable to get instance settings for this import";
            return _response;
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
        var uniqueProgram = filterDuplicateCourses(_csvRecords, apiFieldConfigFieldIndexMap['programLang1'], apiFieldConfigFieldIndexMap['programLang2']);
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

        try{
            let errCnt = 0;
            _csvRecords.forEach(async(_userData,_csvRecordindex) => {

                let _promise = new Promise(async(resolve,reject) => {
    
                    _userData = transformToKeyBased(apiFieldConfigFieldIndexMap,_userData);
                    
                    let _userCriteria = buildSystemUniquenessCriteria(systemUniquenessFieldsIndex,_userData);
                    let _existingUser = await User.findOne(flat.flatten(_userCriteria));
                    
                    try{           
    
                        /* Existing User */
                        if(_existingUser != null)
                        {
                            /* If existing user email is not verified then send email */
                            if(_existingUser.isEmailVerified == false){
                                /*  Generate Verification Token  */                
                                let verificationToken = {
                                    email:_userData.email, token:uuid(), type:'RECIPIENT_CREATION'
                                };
    
                                await VerificationToken.create(verificationToken);
                                
                                let mailData =  {   
                                                    firstName:_userData.firstName, 
                                                    lastName:_userData.lastName,
                                                    email:_userData.email, 
                                                    token:verificationToken.token,
                                                    url:`${preset.configs.siteUrl}/recipient/creation/${verificationToken.token}`
                                                };
                                MailerUtil.sendMail("recipient-creation-invitation",_userData.email, mailData).then().catch(console.error);
                            }
    
                            
                            /* Basic Details */
                            _existingUser.firstName       = _userData.firstName;
                            _existingUser.lastName        = _userData.lastName;
                            _existingUser.mobileNumber    = _userData.mobileNumber;
                            _existingUser.personalAddress = _userData.address;
    
                            /* Extra Details */
                            extraData = _userData.recipientDetails.additional;
    
                            extraData.nationalId = _userData.nationalId,
                            extraData.studentId  = _userData.studentId;
                                    
                            _existingUser.recipientDetails.additional = extraData;
    
                            
                            /* Course Details */
                            if(_userData.programLang1 != undefined && _userData.programLang2 !=undefined){
    
                                /* Find Checksum */
                                let checkSum  = sha1((""+_userData.programLang1 + "::" + _userData.programLang2+"").toUpperCase());
    
                                /* Find course using checkSum */
                                let course = courseMap[checkSum];
    
                                let tmpConvoDateLang1 = moment.utc(_userData.convocationDateLang1).hours(0).minutes(0).seconds(0).valueOf();
                                let tmpConvoDateLang2 = moment.utc(_userData.convocationDateLang2).hours(0).minutes(0).seconds(0).valueOf();
    
                                let tmpCourseData = {
                                    _id:course._id,
                                    nameLang1:course.nameLang1,
                                    nameLang2:course.nameLang2,
                                    result:_userData.result,
                                    convocationDateLang1:tmpConvoDateLang1,
                                    convocationDateLang2:tmpConvoDateLang2
                                }
                                
                                /*  Find If Course Already Exists for Recipient  */
                                let tmpCourseNeedle = _existingUser.recipientDetails.courses.find((x)=>{
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
    
                            await _existingUser.save();
                        }
                        else
                        {
                            /* New User */
                            let newUser = {};
    
                            /* Basic Details */
                            newUser.role            = 'ROLE_RECIPIENT';
                            newUser.firstName       = _userData.firstName;
                            newUser.lastName        = _userData.lastName;
                            newUser.email           = _userData.email;
                            newUser.mobileNumber    = _userData.mobileNumber;
                            newUser.personalAddress = _userData.address;                    
    
                            /*  Create Password  */
                            newUser.salt = uuid();
                            let rawPassword = uuid();
                            newUser.password = EncryptionUtil.encryptPassword(newUser.salt,rawPassword);
    
                            /*  Create User Wallet  */
                            createUserWallet(newUser);
    
                            /* Find Checksum */
                            let checkSum  = sha1((""+_userData.programLang1 + "::" + _userData.programLang2+"").toUpperCase());
    
                            /* Find course using checkSum */
                            let course = courseMap[checkSum];

                            let tmpConvoDateLang1 = moment.utc(_userData.convocationDateLang1).hours(0).minutes(0).seconds(0).valueOf();
                            let tmpConvoDateLang2 = moment.utc(_userData.convocationDateLang2).hours(0).minutes(0).seconds(0).valueOf();
    
                            let tmpCourseData = {
                                _id:course._id,
                                nameLang1:course.nameLang1,
                                nameLang2:course.nameLang2,
                                result:_userData.result,
                                convocationDateLang1:tmpConvoDateLang1,
                                convocationDateLang2:tmpConvoDateLang2
                            }
                            
                            /* Extra Details */
                            extraData = _userData.recipientDetails;
    
                            extraData.additional.nationalId = _userData.nationalId,
                            extraData.additional.studentId  = _userData.studentId,
                                    
                            newUser.recipientDetails = extraData;
                                        
                            newUser.recipientDetails.courses = [];
                            newUser.recipientDetails.courses.push(tmpCourseData);
    
                            await User.create(newUser);
    
                            /*  Generate Verification Token  */                
                            let verificationToken = {
                                email:newUser.email, token:uuid(), type:'RECIPIENT_CREATION'
                            };
    
                            await VerificationToken.create(verificationToken);
                            
                            let mailData =  {   
                                                firstName:newUser.firstName, 
                                                lastName:newUser.lastName,
                                                email:newUser.email, 
                                                token:verificationToken.token,
                                                url:`${preset.configs.siteUrl}/recipient/creation/${verificationToken.token}`
                                            };
                            // MailerUtil.sendMail("recipient-creation-invitation.ejs",mailData,newUser.email,"Certificate Recipient Invitation"); 
                            MailerUtil.sendMail("recipient-creation-invitation",newUser.email, mailData).then().catch(console.error);
                        }
    
                        /* Call resolve once all await calls finish */
                        resolve();
    
                    }catch(e){
                        errCnt++;
                        _csvBatch.stats['log'] = e.message;         
                    }
                });
                
                _existingUserPromise.push(_promise);
                
            });

            /* Update Batch Status */   
            if(errCnt == _csvRecords.length){
                // _csvBatch.stats['log'] = 'Error while processing recipient';   
                _csvBatch.jobProcessStatus = 'FAILED';  
            }else{
                _csvBatch.stats['log'] = 'Recipient processed successfully';   
                _csvBatch.jobProcessStatus = 'SUCCEEDED';   
            }
            await updateBatchStatus(_csvBatch,true);

            /* Free up memory  */
            _csvRecords = [];

            await Promise.all(_existingUserPromise);

        }catch(e){
            _response["status"]  = "failure";
            _response["message"] = e.message;
            _response["data"]    = e.stack;
            return _response;
        }

    } catch (e) {
        _response["status"]  = "failure";
        _response["message"] = e.message;
        _response["data"]    = e.stack;
        return _response;
    }
    return _response;
}

function createUserWallet(newUser){
    // create ethereum wallet
    let ethWallet = ethers.Wallet.createRandom();
    newUser.encKey = uuid();
    newUser.privateKey = EncryptionUtil.encryptText(newUser.encKey,ethWallet.privateKey);
    newUser.ethAddress = ethWallet.address;
}

function updateBatchStatus(_csvBatch, commit){
    if(commit == true){
        _csvBatch.stats['completedAt'] = new Date();
    }
    _csvBatch.save();
}

/* async function filterDuplicateCourses(records){
    var programs = records.map(value=>value.name);
    
    var uniqueProgram = await programs.filter(function(item, pos) {
        return programs.indexOf(item) == pos;
    })
    
    return uniqueProgram;
} */

function transformToKeyBased(_keyMapArr,_data){
    let _rawData = _data;
    let _rawIndexMap = Object.keys(_rawData);

    _data = Object.values(_data);

    let _finalData = {};
    for(let _keyData in _keyMapArr)
    {
        let _tmpIndex = parseInt(_keyMapArr[_keyData]);
        _finalData[_keyData] = _data[_tmpIndex];
        delete _rawIndexMap[_tmpIndex]; 
        
    }
    
    _finalData['recipientDetails'] = {
        "additional": {}
    };

    /* Removed undefined */
    _rawIndexMap = _rawIndexMap.filter(_data => _data);
    _rawIndexMap.forEach((_field,_index)=>{
        _finalData['recipientDetails']['additional'][_field] = _rawData[_field];
    });
    
    
    return _finalData;
}

function buildSystemUniquenessCriteria(_criteriaArr,_data)
{
    let _builtCriteria = {
        "recipientDetails":{
            'additional' : {}
        }
    };

    let _additionalFound = false;
    _criteriaArr.forEach((_criteria,_key) => {
       if(_criteria == 'nationalId' || _criteria == 'studentId')
       {
            _additionalFound = true;
            _builtCriteria['recipientDetails']['additional'][_criteria] = _data[_criteria]; 
       } 
       else
       {
            _builtCriteria[_criteria] = {};
            _builtCriteria[_criteria] = _data[_criteria]; 
       }
    });

    if(_additionalFound == false)
    {
        delete _builtCriteria['recipientDetails'];
    }

    return _builtCriteria;
}

function filterDuplicateCourses(records, indexLang1, indexLang2) {
    let finalRecords = {};
    records.forEach((data,index) => {
        data = Object.values(data);
        indexLang1 = parseInt(indexLang1);
        indexLang2 = parseInt(indexLang2);

        let tmpIndex = sha1((""+data[indexLang1] + "::" + data[indexLang2]+"").toUpperCase());
        if(finalRecords[tmpIndex] != undefined)
        {
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
    uniquePrograms.forEach((_program,_index) => {
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

/*---------------------------Code for JOB (END)---------------------------------------*/


module.exports = {
    createRecipientCSVImportQueue: createRecipientCSVImportQueue,
    getRecipientImportQueueList:getRecipientImportQueueList,
    cronRecipientImport:cronRecipientImport
}