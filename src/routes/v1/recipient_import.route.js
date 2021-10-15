const Router = require("express").Router();
const MulterHandler           = require("../../middleware/multer.middleware");
var RecipientImportController = require("../../controller/recipient_import.controller");

Router.post('/csv', autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),MulterHandler.single('csvFile'),RecipientImportController.createRecipientCSVImportQueue);

Router.get('/queue/list', autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),RecipientImportController.getRecipientImportQueueList);

Router.post('/api',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),RecipientImportController.cronRecipientImport);

module.exports = Router;