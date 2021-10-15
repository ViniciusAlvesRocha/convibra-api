let Template = require('../model/template.model');
let moment = require('moment');
let { Duplex } = require('stream');
let toPdf = require('../util/docx-to-pdf-util');

var Schema = global.mongoose.Types;
var ObjectId = Schema.ObjectId;

async function storeData(_subAccountID, _data) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let nameCheck = await Template.findOne({ name: _data.name, subAccountID: _subAccountID });

        if (nameCheck != null) {
            _response["status"] = "failure";
            _response["message"] = "Template name already exists";

            return _response;
        }

        _data.startDate = moment.utc(_data.startDate).hours(0).minutes(0).seconds(0).valueOf();
        _data.endDate = moment.utc(_data.endDate).hours(0).minutes(0).seconds(0).valueOf();


        if (isNaN(_data.startDate) || isNaN(_data.endDate)) {
            _response["status"] = "failure";
            _response["message"] = "Start date or End date should be valid date";

            return _response;
        }

        if (_data.startDate > _data.endDate) {
            _response["status"] = "failure";
            _response["message"] = "End Date should be greater than start date";

            return _response;
        }

        _data["version"] = 1.0;

        /* Check the start date and end date are not clashing with any predefined date range 
            Conditions like
                givenStartDate <= startDate >= givenEndDate
                givenStartDate <= endDate >= givenEndDate
                givenStartDate >= startDate  AND  givenEndDate <= endDate
                givenStartDate <= startDate AND  endDate <= givenEndDate
        */
        /* let tempData = await Template.find({subAccountID:_subAccountID,
            $or: [
                {startDate : _data.startDate, endDate: _data.endDate},
                {
                    startDate: { $gte: _data.startDate, $lt: _data.endDate }
                },
                {
                    endDate: { $gte: _data.startDate, $lt: _data.endDate }
                },
                {
                    $and: [
                        {startDate: {$lte: _data.startDate}},{endDate: {$gte: _data.startDate}},
                        {startDate: {$lte: _data.endDate}},{endDate: {$gte: _data.endDate}}
                    ]
                }
            ]
        });

        if(tempData.length > 0){
            _response["status"] = "failure";
            _response["message"] ="Given start date and end date is already present";

            return _response;
        } */

        /* Build 2 Seprate data structure for web and print version */


        /*  Validate if Document Uploaded are Syntactically correct */

        /*  Web  */
        let webPreviewPdf = false;
        let printPreviewPdf = false;
        
        try
        {
            webPreviewPdf = await convertTemplateintoPdf(_data.webDocument);
        }
        catch(error) {
            _response["status"] = "failure";
            _response["message"] = "Invalid document tag used in Web Version.";
            return _response;
        }

        try
        {
            printPreviewPdf = await convertTemplateintoPdf(_data.printDocument);
        }
        catch(error) {
            _response["status"] = "failure";
            _response["message"] = "Invalid document tag used in Print Version.";
            return _response;
        }
        

        let dataWeb = {
            "name": _data.name,
            "description": _data.description,
            "startDate": _data.startDate,
            "endDate": _data.endDate,
            "language": _data.language,
            "status": "COMPLETED",
            "document": _data.webDocument,
            "previewPdf": webPreviewPdf,
            "certificateType": "WEB",
            "subAccountID": _data.subAccountID,
            "version": _data.version
        };

        var templateDataWeb = new Template(dataWeb);
        await templateDataWeb.save();

        /* activeQueue['certificate-creator.job'].add({
            templateId: templateDataWeb._id,
            document: templateDataWeb.document
        }); */

        let dataPrint = {
            "name": _data.name,
            "description": _data.description,
            "startDate": _data.startDate,
            "endDate": _data.endDate,
            "language": _data.language,
            "status": "COMPLETED",
            "document": _data.printDocument,
            "previewPdf": printPreviewPdf,
            "certificateType": "PRINT",
            "subAccountID": _data.subAccountID,
            "version": _data.version
        };

        var templateDataPrint = new Template(dataPrint);
        await templateDataPrint.save();

        /* activeQueue['certificate-creator.job'].add({
            templateId: templateDataPrint._id,
            document: templateDataPrint.document
        }); */


        _response["status"] = "success";
        _response["message"] = "Template store successfully";
    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function getData(_templateId) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        var data = await Template.findOne({ _id: _templateId});

        _response["status"] = "success";
        _response["message"] = "Template data get successfully";
        _response["data"] = data;
    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}



async function getListing(query) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        var condition = {};

        if (query.filter != undefined) {

            /* Only parse if query not in JSON format */

            let _queryData = {};
            if(query.hasJSON != undefined && query.hasJSON == true)
            {
                _queryData = query.filter;
            }
            else
            {
                _queryData = JSON.parse(query.filter);
            }
            

            /* For Date  */
            if (_queryData.date != undefined || _queryData.date != null) {
                let convertedDate = moment(_queryData.date).format("YYYY-MM-DD");

                condition['startDate'] = { $lte: convertedDate };
                condition['endDate'] = { $gte: convertedDate };

            }

            /* For Parent ID  */
            if (_queryData.parentID != undefined || _queryData.parentID != "") {
                condition["parentID"] = _queryData.parentID == null ? null : ObjectId(_queryData.parentID);
            }

            /* For Template ID array */
            if (_queryData._id != undefined ) {
                if(Array.isArray(_queryData._id) == false)
                {
                    condition["_id"] = { $in: [_queryData._id]};    
                }
                else
                {
                    condition["_id"] = { $in: _queryData._id};
                }
            }

            /* For Certificate Type */
            if (_queryData.certificateType != undefined) {
                condition["certificateType"] = _queryData.certificateType;
            }
            
            /* For subAccountID */
            if (_queryData.subAccountID != undefined) {

                if(Array.isArray(_queryData.subAccountID) == false)
                {
                    condition["subAccountID"] = { $in: [_queryData.subAccountID]};    
                }
                else
                {
                    condition["subAccountID"] = { $in: _queryData.subAccountID};
                }
            }

            /* For parentID */
            if (_queryData.parentID != undefined) {

                if(Array.isArray(_queryData.parentID) == false)
                {
                    condition["parentID"] = { $in: [_queryData.parentID]};    
                }
                else
                {
                    condition["parentID"] = { $in: _queryData.parentID};
                }
            }

        }

        if(query.isRemoveParentID == true)
        {
            delete(condition['parentID']);
        }

        
        var data = await Template.find(condition).populate('parentID');
        
        if(data.length <= 0)
        {
            _response["status"] = "failure";
            _response["message"] = "No Template data found.";
            _response["data"] = data;    
        }
        else
        {
            _response["status"] = "success";
            _response["message"] = "Template data get successfully";
            _response["data"] = data;    
        }

    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
        _response["data"] = e.stack;
    }

    return _response;
}

async function deleteData(_subAccountID, _templateId) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        var data = await Template.remove({ _id: _templateId });

        _response["status"] = "success";
        _response["message"] = "Template data deleted successfully";
    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateVersion(_data, _documentName) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    let _subAccountID = _data['subAccountID'];

    try {

        _data.startDate = moment.utc(_data.startDate).hours(0).minutes(0).seconds(0).valueOf();
        _data.endDate = moment.utc(_data.endDate).hours(0).minutes(0).seconds(0).valueOf();


        if (isNaN(_data.startDate) || isNaN(_data.endDate)) {
            _response["status"] = "failure";
            _response["message"] = "Start date or End date should be valid date";

            return _response;
        }

        if (_data.startDate > _data.endDate) {
            _response["status"] = "failure";
            _response["message"] = "End Date should be greater than start date";

            return _response;
        }

        /* Get Parent template data */
        let parentData = await Template.findOne({ _id: _data.parentID });

        if (parentData == null) {
            _response["status"] = "failure";
            _response["message"] = "Parent template not available";

            return _response;
        }

        let _parentStartDate = moment.utc(parentData.startDate).hours(0).minutes(0).seconds(0).valueOf();

        /* Let check given start date should be greater than or equal to parent start date */
        if (_parentStartDate > _data.startDate) {
            _response["status"] = "failure";
            _response["message"] = "Start date should be greater than equal parent start date";

            return _response;
        }


        /* Get last updated child version */
        let lastUpdatedChildData = await Template.findOne({ parentID: _data.parentID },
            { version: 1, startDate: 1, endDate: 1 })
            .sort({ version: -1 });


        let processVersion;
        let processStartDate;
        let processEndDate;

        if (lastUpdatedChildData != null) {
            processVersion = lastUpdatedChildData.version;
            /* processStartDate = lastUpdatedChildData.startDate;
            processEndDate = lastUpdatedChildData.endDate; */
        } else {
            processVersion = parentData.version;
            /* processStartDate = parentData.startDate;
            processEndDate = parentData.endDate; */
        }

        /* Auto Increment parent template last date + 1 and add as start date for new template */
        /* let newStartDate = moment.utc(processEndDate, "DD-MM-YYYY").add(1,'days');

        let tempEndDate = moment.utc(processEndDate);
        let tempStartDate = moment.utc(processStartDate);

        let dateDiff = tempEndDate.diff(tempStartDate, 'days');

        let newEndDate = moment.utc(newStartDate, "DD-MM-YYYY").add(dateDiff,'days');

        newStartDate = moment.utc(newStartDate).hours(0).minutes(0).seconds(0).valueOf();
        newEndDate   = moment.utc(newEndDate).hours(0).minutes(0).seconds(0).valueOf(); */

        /* Check the start date and end date are not clashing with any predefined date range 
            Conditions like
                givenStartDate <= startDate >= givenEndDate
                givenStartDate <= endDate >= givenEndDate
                givenStartDate >= startDate  AND  givenEndDate <= endDate
                givenStartDate <= startDate AND  endDate <= givenEndDate
        */
        /* let tempData = await Template.find({subAccountID:_subAccountID,
            $or: [
                {startDate : newStartDate, endDate: newEndDate},
                {
                    startDate: { $gte: newStartDate, $lt: newEndDate }
                },
                {
                    endDate: { $gte: newStartDate, $lt: newEndDate }
                },
                {
                    $and: [
                        {startDate: {$lte: newStartDate}},{endDate: {$gte: newStartDate}},
                        {startDate: {$lte: newEndDate}},{endDate: {$gte: newEndDate}}
                    ]
                }
            ]
        });

        if(tempData.length > 0){
            _response["status"] = "failure";
            _response["message"] ="Increamental template start date and end date already available, can't add new version";

            return _response;
        } */


        _data['name'] = parentData.name;
        _data['description'] = parentData.description;
        _data['language'] = parentData.language;
        _data['startDate'] = _data.startDate;
        _data['endDate'] = _data.endDate;
        _data['status'] = "UNDER_PROGRESS";
        _data['version'] = await incrementVersion(processVersion);

        /* check certifciate type and on that basis update document */
        if (parentData.certificateType == 'WEB') {
            _data['document'] = _documentName;
            _data['certificateType'] = 'WEB';
        } else if (parentData.certificateType == 'PRINT') {
            _data['document'] = _documentName;
            _data['certificateType'] = 'PRINT';
        }

        var templateData = new Template(_data);
        await templateData.save();


        // let lastInsertedData = await Template.findOne().sort({ field: 'asc', _id: -1 }).limit(1);

        /* Add job to queue  */
        activeQueue['certificate-creator.job'].add({ templateId: templateData._id, document: templateData.document });


        _response["status"] = "success";
        _response["message"] = "Template version updated successfully";


    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}


function incrementVersion(existingVersion) {
    existingVersion = parseFloat(existingVersion);
    existingVersion += 0.1
    return parseFloat(existingVersion.toPrecision(2));
}

async function getVersionHistory(_subAccountID, _parentID) {
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try {

        let data = await Template.findOne({ subAccountID: _subAccountID, _id: _parentID });


        let childData = await Template.find({ subAccountID: _subAccountID, parentID: _parentID })
            .populate('parentID');

        let finalData = {};
        finalData['parentTemplate'] = data;
        finalData['childTemplate'] = childData;


        _response["status"] = "success";
        _response["message"] = "Template data get successfully";
        _response["data"] = finalData;
    }
    catch (e) {
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateDocToPdfConversion(_data) {

    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };


    try {
        await Template.updateMany({ _id: _data.templateId }, {
            "previewPdf": _data.previewPdf,
            "status": _data.status
        });

        _response['status'] = 'success';
        _response['message'] = "Certificate Create (Doc to pdf): Data updated successfully";

        return _response;
    }
    catch (e) {

        _response['status'] = 'failure';
        _response['message'] = e.message;
        _response['data'] = e.stack;

        return _response;
    }
}


function convertTemplateintoPdf(documentId){
    return new Promise(async(resolve,reject)=>{
        try{
            let readstream = await autoloaded.FileService.getFileStream(documentId);

            if(readstream.status == 'success'){
                
                readstream = readstream.data;

                let bufs = [];
                readstream.on('data', function (chunk) {
                    bufs.push(chunk);
                });

                readstream.on('end', async function () {
                    var docxBuffer = null;
                    var finalBuf = null;
                    
                    docxBuffer =  Buffer.concat(bufs);    
                    finalBuf =  await docxTemplates({
                        output: 'buffer',
                        template: docxBuffer,
                        data: {
                            recipient: "Preview Recipient",
                            courseNameLang1: "Preview Program Lang 1",
                            courseNameLang2: "Preview Program Lang 2",
                            date: moment().format("D/M/Y"),
                            convoDateLang1: moment().format("D/M/Y"),
                            convoDateLang2: moment().format("D/M/Y"),
                            serialNo: "Preview Serial No.",
                            extraData:{},
                            fileId:"File ID"
    
                        },
                        additionalJsContext: {
                            qrCode: () => {
                                let data = "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";
                                return { width: 3, height: 3, data, extension: '.png' };
                            }
                        }
                    }).catch((error) => {
                        reject(error);
                    });
                    
                    
                    let pdfBuffer = await toPdf(finalBuf).catch((error) => {
                        reject(error);
                    });

                    var bufferStream = bufferToStream(pdfBuffer);
                    bufferStream.pipe(gridBucket.fs.openUploadStream(sha1(uuid()),{contentType:'application/pdf'}))
                    .on('error', function(error) {
                        reject(error);
                    })
                    .on('finish', function(e) {
                        resolve(e.filename);
                    });
                       
                    
                })
            }
            else{
                reject(new Error(readstream.message, err));
            }    
        }
        catch(e){
            reject(e);
        }
    });
}

function bufferToStream(buffer) {  
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

module.exports = {
    storeData: storeData,
    getData: getData,
    getListing: getListing,
    deleteData: deleteData,
    updateVersion: updateVersion,
    getVersionHistory: getVersionHistory,
    updateDocToPdfConversion: updateDocToPdfConversion
}