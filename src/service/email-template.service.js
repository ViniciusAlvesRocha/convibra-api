let EmailTemplate = require('../model/email-template.model');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();
const ejs = require('ejs');

async function getList(){
    let _response = {
        "status": "",
        "data": {},
        "message": ""
    };

    try{
        let data = await EmailTemplate.find({});

        if(data == null){
            _response['status'] = 'failure';
            _response['message'] = "Email template data not available";    

            return _response;
        }

        _response['status'] = 'success';
        _response['message'] = "Email template data get successfully";
        _response['data'] = data;
    }
    catch(e){
        _response['status'] = 'failure';
        _response['message'] = e.message;
    }

    return _response;
}

async function storeData(_data){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        // _data.templateHtml = unescape(_data.templateHtml);

        let unUsedVariables = [];
        let arrTemplateVariables = _data.templateVariables.split("~");

        if(arrTemplateVariables != undefined && arrTemplateVariables.length > 0){
            arrTemplateVariables.forEach((_variable) => {
                /* If variable not used into template */
                if(_data.templateHtml.indexOf(_variable) === -1){
                    unUsedVariables.push(_variable);
                }
            });
        }

        if(unUsedVariables.length > 0){
            _response["status"] = "failure";
            _response["message"] = "Please remove un-used variables. un-used variables are :"+JSON.stringify({...unUsedVariables});
            return _response;
        }

        var emailTemplate = new EmailTemplate(_data);
        await emailTemplate.save();

        _response["status"] = "success";
        _response["message"] = "Email template saved successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function getDetail(id, isOnlyView){
    let _response = {
        "status" : "",
        "data" : {},
        "message": ""
    };

    try{
        let data = await EmailTemplate.findOne({_id:id});

        if(data == null){
            _response["status"] = "failure";
            _response["message"] = "Email template not available with this id";

            return _response;
        }
        
        if(isOnlyView == 'true') {
            let emailTemplateHtml = data.templateHtml;
            let emailTemplateVariable = data.templateVariables;
            arrTemplateVariables = emailTemplateVariable.split("~");
            let arrKey = [];
            let arrVal = [];
            if(arrTemplateVariables.length > 0){
                arrTemplateVariables.forEach((templateVariables,index)=>{
                    templateVariables = entities.decode(templateVariables);
                    templateVariables = htmlToPlaintext(templateVariables);
                    arrKey.push(templateVariables.trim());
                    arrVal.push(`Sample ${templateVariables}`);
                });
            }
            let arrSampleData = [];
            if(arrKey.length > 0){
                arrKey.forEach((key,index)=>{
                    arrSampleData[key] = arrVal[index];
                });
            }
            let _builtData = '';
            emailTemplateHtml = entities.decode(emailTemplateHtml);

            _builtData = await ejs.render(emailTemplateHtml, arrSampleData, {});

            // console.log('builtDagta',_builtData);

            if (_builtData == null) {
                _response["status"] = "failure";
                _response["message"] = 'Template does not exists';
            }

            data.templateHtml = _builtData;   
        }

        _response["status"] = "success";
        _response["message"] = "Email template data get successfully";
        _response["data"] = data;
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateData(_templateId,_data){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        /* Check  record available or not */
        let data = await EmailTemplate.findOne({_id:_templateId});

        if(data == null){
            _response["status"] = "failure";
            _response["message"] = "No template available for update with given Id";
            return _response;
        }      

        /* check Template name or Template Subject duplication */
        /* Template name or  { templateName: _data.templateName }, */
        let checkDuplication =  await EmailTemplate.findOne({$or: [{templateSubject: _data.templateSubject}], _id : {$ne: _templateId}});
        if(checkDuplication != null){
            _response["status"] = "failure";
            _response["message"] = "Template subject already present into system";
            return _response;
        }
       
        await EmailTemplate.updateOne({_id:_templateId}, _data);

        _response["status"] = "success";
        _response["message"] = "Email template updated successfully";
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function getDetailFromName(name){
    let _response = {
        "status" : "",
        "data" : {},
        "message": ""
    };

    try{
        let data = await EmailTemplate.findOne({templateName:name});

        if(data == null){
            _response["status"] = "failure";
            _response["message"] = "Email template not available with this name";

            return _response;
        }

        _response["status"] = "success";
        _response["message"] = "Email template data get successfully";
        _response["data"] = data;
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

function htmlToPlaintext(string) {
    var ltString = /<%=/gi;
    var gtString = /%>/gi;
    string = string.replace(ltString, '');
    string = string.replace(gtString, '');
    return string;
}

module.exports = {
    getList:getList,
    storeData:storeData,
    getDetail:getDetail,
    updateData:updateData,
    getDetailFromName:getDetailFromName
}