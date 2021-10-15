const Router = require("express").Router();
const MulterHandler = require("../../middleware/multer.middleware");
const TemplateController = require("../../controller/template.controller");

Router.get('/list',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMIN_AND_ISSUER),TemplateController.getListing);

Router.post('/store',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),MulterHandler.multiple([{name:'webDocument',maxCount:1},{name:'printDocument',maxCount:1}]),TemplateController.storeData);
Router.get('/detail/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),TemplateController.getDetail);
Router.delete('/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),TemplateController.deleteData);
Router.post('/update_version',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),MulterHandler.single('document'),TemplateController.updateVersion);
Router.get('/version_history/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),TemplateController.getVersionHistory);

module.exports = Router;