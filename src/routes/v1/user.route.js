const Router = require("express").Router();
const MulterHandler = require("../../middleware/multer.middleware");
var UserController = require("../../controller/user.controller");

Router.post('/create', autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),UserController.create);
Router.post('/update/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), UserController.update);
Router.get('/details/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), UserController.getDetails);
Router.get('/listing',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), UserController.getListing);
Router.post('/update/status/:id/:status',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), UserController.updateStatus);

Router.post('/create/recipient',UserController.createRecipient);

Router.get('/convocation/dates',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), UserController.getAllConvocationDates);

Router.post('/verify_private_key',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ISSUER),MulterHandler.single('privateKeyFile'),UserController.verifyPrivateKey);
/* Router.get('/recipient/listing',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ISSUER_AND_SUB_ACCOUNT_ADMIN),UserController.getAllRecipients); */
/* Router.get('/recipient/listing',UserController.getAllRecipients); */

Router.get('/wallet_details',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), UserController.getWalletDetails);

module.exports = Router;