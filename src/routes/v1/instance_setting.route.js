const Router = require("express").Router();
const MulterHandler = require("../../middleware/multer.middleware");
const InstanceSettingController = require("../../controller/instance_setting.controller");

/* **********************Instacne Setting Controller**************** */
Router.get('/general_info',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),InstanceSettingController.getGeneralInfo);
Router.post('/general_info/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),MulterHandler.multiple([{name:'logo',maxCount:1},{name:'favicon',maxCount:1},{name:'organizationPicture',maxCount:1}]),InstanceSettingController.updateGeneralInfo);

Router.get('/localization',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getLocalizationInfo);
Router.post('/localization/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateLocalizationInfo);

Router.get('/email_setting',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getEmailSettingInfo);
Router.post('/email_setting/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateEmailSettingInfo);

Router.get('/google_api',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getGoogleApiSettingInfo);
Router.post('/google_api/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateGoogleApiSettingInfo);

Router.get('/payment_gateway',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getPaymentGatewayConfigInfo);
Router.post('/payment_gateway/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updatePaymentGatewayConfigInfo);

Router.get('/api_field',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),InstanceSettingController.getApiFieldConfigInfo);
Router.post('/api_field/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateApiFieldConfigInfo);

Router.get('/certificate_access_trigger',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getCertificateAccessTriggerInfo);
Router.post('/certificate_access_trigger/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateCertificateAccessTriggerInfo);

Router.get('/certificate_store',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getCertificateStoreInfo);
Router.post('/certificate_store/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateCertificateStoreInfo);

Router.get('/wallet',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getWalletInfo);
Router.post('/wallet/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.updateWalletInfo);

Router.get('/blockchain_info',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),InstanceSettingController.getBlockchainInfo);


module.exports = Router