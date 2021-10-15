var InstanceSettingService = require("../service/instance-setting-service");
var EmailTemplateService = require("../service/email-template.service");
var transporter;


async function initializeMailConfig() {
    if (preset.configs.mail.mode == "sendmail") {
        transporter = nodemailer.createTransport({
            sendmail: true,
            newline: 'unix',
            path: '/usr/sbin/sendmail'
        });
    }
    else if (preset.configs.mail.mode == "smtp") {

        let emailDetails = await InstanceSettingService.getDetails(['emailSettings']);
        
        let mailData = {
                            "host": preset.configs.mail.smtp.host,
                            "port": preset.configs.mail.smtp.port,
                            "userName": preset.configs.mail.smtp.user,
                            "password": preset.configs.mail.smtp.pass
                        };
        if(emailDetails.data.emailSettings != undefined){
            mailData["host"] = emailDetails.data.emailSettings.host;
            mailData["port"] = emailDetails.data.emailSettings.port;
            mailData["userName"] = emailDetails.data.emailSettings.userName;
            mailData["password"] = emailDetails.data.emailSettings.password;
        }


        transporter = nodemailer.createTransport({
            host: mailData.host,
            port: mailData.port,
            secure: preset.configs.mail.smtp.secure, // use SSL
            auth: {
                user: mailData.userName,
                pass: mailData.password
            }
        });

    }

}

async function sendMail(_templateName, _receiverEmail, _templateData, _attachments) {

    await initializeMailConfig();

    /* Get Email Template Data */
    let _templateDataResponse = await EmailTemplateService.getDetailFromName(_templateName);
    if(_templateDataResponse['status'] == 'failure')
    {
        return _templateDataResponse;
    }

    _templateBody = _templateDataResponse['data']['templateHtml'];
    _subject = _templateDataResponse['data']['templateSubject'];
    _fromEmail = _templateDataResponse['data']['templateFromEmail'];

    _templateData['closingText'] = preset.configs.mail.closingText;
    _attachments = _attachments || [];

    /* let basePath = "../mails/";
    template = basePath + template; */

    try {

        let _builtData = await ejs.render(_templateBody, _templateData, {});
        var _options = {
            from: _fromEmail,
            to: _receiverEmail,
            subject: `${preset.configs.mail.subjectPrefix}${_subject}`,
            html: _builtData,
            attachments: _attachments
        };

        let _info = await transporter.sendMail(_options);
        console.log('Mail sent: ' + _info.response);
        return _info;

    }
    catch (e) {
        console.log("Mail error: ",e.message,e.stack);
        return e.message;
    }
}



function _renderFile(template, templateData) {
    return new Promise((resolve, reject) => {
        ejs.renderFile(__dirname + `/${template}`, templateData, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}




module.exports = {
    initializeMailConfig: initializeMailConfig,
    sendMail: sendMail
}