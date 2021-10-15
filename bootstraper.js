var fs = require('fs');

async function loadConfig(environment){
    let configs = {};
    if (environment == 'production') {
        configs = require('./env/env-prod');
    } else if (environment == 'staging') {
        configs = require('./env/env-staging');
    } else {
        configs = require('./env/env-dev');
    }
    
    return configs;
}

async function injectDependencies(_global){
    _global.mongoose = require('mongoose');
    _global.joi = require('@hapi/joi');
    _global.fse = require('fs-extra')
    // _global.fs = require('fs');
    _global.fs = _global.fse;
    _global.nodemailer = require("nodemailer");
    _global.axios = require('axios');
    _global.uuid = (require('uuid')).v4;
    _global.ejs = require('ejs');
    _global.crypto = require('crypto');
    _global.ethers = require('ethers');
    _global.grid = require("gridfs-stream");
    _global.Queue = require("bull");
    _global.csvParser = require('csv-parser');
    _global.flatted = require('flatted');
    _global.flat = require('flat')
    _global.jwt = require('jsonwebtoken');
    _global.stream = require('stream');
    _global.sha1 = require('sha1');
    _global.moment = require('moment');
    _global.docxTemplates = require('docx-templates');
    _global.openAttestation = require('@govtechsg/open-attestation');

    _global.csvWriter = require('csv-write-stream');
    
    _global.CronJob = require('cron').CronJob;

    return _global;
}

async function injectAutoloadedLib(){
    return {
        MailerUtil: require("./src/util/mailer.util"),
        EncryptionUtil: require("./src/util/encryption-utility"),
        AuthorizationMiddleware: require("./src/middleware/authorization.middleware"),
        ChainService: require("./src/service/chain.service"),
        BootupService: require("./src/service/bootup-service"),
        FileService: require("./src/service/file.service"),
        TemplateService: require("./src/service/template.service"),
        CertificateService: require("./src/service/certificate.service"),
        UniblockGatewayService: require("./src/service/uniblock-gateway.service")
    }
}

async function injectQueue(global){
    return {
        "certificate-creator.job" : new global.Queue('Certificate Create (Doc to pdf): ', global.preset.services.redis.url),
        "certificate-convertor.job" : new global.Queue('Certificate Conversion (Doc to pdf): ', global.preset.services.redis.url),
        "recipient-importer.job" : new global.Queue('Recipient Importer: ', global.preset.services.redis.url),
        "certificate-revocation.job" : new global.Queue('Certificate Revocation: ', global.preset.services.redis.url),
        "certificate-issuance.job" : new global.Queue('Certificate Issuance: ', global.preset.services.redis.url),
        "issue-certificate-on-blockchain.job": new global.Queue('Issue Certificate to Blockchain: ', global.preset.services.redis.url)
    }
}

async function injectRoles(_global){
    return {
        'USER_AND_ADMIN': ['ROLE_ISSUER', 'ROLE_RECIPIENT', 'ROLE_VERIFIER', 'ROLE_ACCOUNT_ADMIN','ROLE_SUB_ACCOUNT_ADMIN'],
        'ISSUER_AND_ADMIN': ['ROLE_ISSUER', 'ROLE_ACCOUNT_ADMIN','ROLE_SUB_ACCOUNT_ADMIN'],
        'ISSUER_AND_SUB_ACCOUNT_ADMIN' : [ 'ROLE_ISSUER', 'ROLE_SUB_ACCOUNT_ADMIN'],
        'ALL_USER': ['ROLE_ISSUER', 'ROLE_RECIPIENT', 'ROLE_VERIFIER'],
        'ADMINS': ['ROLE_ACCOUNT_ADMIN','ROLE_SUB_ACCOUNT_ADMIN'],
        'ADMIN_AND_ISSUER': ['ROLE_ACCOUNT_ADMIN','ROLE_SUB_ACCOUNT_ADMIN','ROLE_ISSUER'],
        'ACCOUNT_ADMIN':['ROLE_ACCOUNT_ADMIN'],
        'SUB_ACCOUNT_ADMIN':['ROLE_SUB_ACCOUNT_ADMIN'],
        'ISSUER': ['ROLE_ISSUER'],
        'RECIPIENT': ['ROLE_RECIPIENT'],
        'VERIFIER': ['ROLE_VERIFIER'],
        'ISSUER_AND_VERIFIER':['ROLE_ISSUER','ROLE_VERIFIER']
    }
}

async function injectConstant(_config){
    return {
        'redis':{
            "url": 'redis://'+_config.redisHost+':'+_config.redisPort
        },
        'openCert':{
            "schema": require("./src/schema/default.json")
        },
        'jwt':{
            'key' : "NSb@Q9tt6hPLpE#LHA&xnR*9$y4!=$z8ZAL%Ajp@&DWrgc8bWd_QrsJvDQv9a3ad@q?_AmJVrz58Gh=ergJxjq#WVU=eAz#b_XyK*kgxzz3LY-^JAnwX23Lt&aLWf!JjuQMfJW&ar9s%Lz$weQWkHdeqcGH@d3RbRkzctzSfU8%%HxsY?U8BeSj_g_Uapy7y??Lh&VQ5NeMZFkJL-*RYtHsEvK2wD2PXC8dr?sdg!Lgx9hxaSfj@pUNRxY8n?nvkCk!fNj%ZF#r#hHxbJC=^h5@THzS?4c4x94Yg$sgsmeMUYQCV5VEn7Exr*wp-8FqgN=xs_E%VZEj_ws+mwhQ5bTm3V+XT#S#ZGDT*uyR3BgpreUPJW^mJAHf6rRHmx+?$-Y_P6dbwf5#$_qHT7VmW5qn2u87W9bu3ud@s!7^y@Napg6sqvD^g9R_JL^u_ufA23+rf$_mjvWTHf?@FLH8t&#S-Cgr+mt?LTyV&QTPK-6*zbE$K-hTr&L?A4F!mm95m"
        },
        'storage':{
            'batch': './storage/batch',
            'certificateBatchTmp' : "./tmp"
        },
        'soffice' : 'libreoffice5.1'
    }
}

async function configureDB(_global,_config){

    try{
        let databasePromise = await global.mongoose.connect(_config.mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    
        if(global.mongoose.connection.readyState == 1) {
            /* Grid FS Connection */
            _global.gridBucket = {};
            _global.gridBucket['fs'] = new _global.mongoose.mongo.GridFSBucket(_global.mongoose.connection.db);
    
            _global.gfs = _global.grid(_global.mongoose.connection.db, _global.mongoose.mongo);
            console.log("DB Connection Established.");

            _global.mongoose.set('useFindAndModify', false);
        }

        return databasePromise;
        
    } catch(e) {
        console.log('Error while configuring database connection: ', e.message);
    }
}

async function configureMulterGridFs(databasePromise){

    var multer = require('multer');

    var gridFsStorage = require('multer-gridfs-storage')({
        db: databasePromise
    });

    return multer({
        storage: gridFsStorage,
        
        fileFilter: function (req, file, cb) {

            /*  Route  */
            let fileValidation = require('./src/routes/validation');
            let _response = fileValidation.validateRoute(req, file)

            if (_response.hasError == true) {
                // return cb(_response.error);
                cb(null, false);
                return
            }

            cb(null, true)
        }
    });
}
async function launchExpress(_config){

    /* Dependencies */
    var express = require("express");
    var bodyParser = require('body-parser');
    
    var cors = require('cors');
    

    /* Initiate Express App */
    var app = express();

    /*  cors */
    app.use(cors())

    /* Request Body Parser */
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    
    /* Start Express Server */
    app.listen(_config.serverPort);

    return app;
}

module.exports = {
    loadConfig: loadConfig,
    injectDependencies: injectDependencies,
    injectRoles:injectRoles,
    injectConstant:injectConstant,
    injectAutoloadedLib:injectAutoloadedLib,
    injectQueue:injectQueue,
    configureDB:configureDB,
    launchExpress:launchExpress,
    configureMulterGridFs:configureMulterGridFs
}
