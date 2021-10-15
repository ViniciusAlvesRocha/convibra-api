const Router = require("express").Router();
const EmailTemplateController = require("../../controller/email_template.controller");

Router.get('/listing',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),EmailTemplateController.getList);

Router.post('/store',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),EmailTemplateController.storeData);

Router.get('/detail/:id/:isOnlyView?',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),EmailTemplateController.getDetail);

/* get template from template name */
Router.get('/detail',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),EmailTemplateController.getDetailFromName);

Router.post('/update/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN),EmailTemplateController.updateData);
 

module.exports = Router
