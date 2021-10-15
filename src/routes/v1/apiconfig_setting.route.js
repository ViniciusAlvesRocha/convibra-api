const Router = require("express").Router();
const APIConfigSettingController = require("../../controller/apiconfig_setting.controller");

Router.post('/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),APIConfigSettingController.update);

Router.get('/details',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),APIConfigSettingController.getDetails);

module.exports = Router

