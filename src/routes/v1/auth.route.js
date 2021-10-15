const Router = require("express").Router();
const AuthController = require("../../controller/auth.controller");

Router.post('/signup', AuthController.signup);
Router.get('/logout', AuthController.logout);
Router.post('/login', AuthController.login);
Router.post('/loginByID/:id', autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN), AuthController.loginUserByID);
Router.post('/email/verification/:token', AuthController.verifyEmail);
Router.post('/forgot_password', AuthController.forgotPassword);
Router.post('/password/reset', AuthController.resetPassword);

Router.post('/password/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), AuthController.updatePassword);
Router.post('/account_settings/update',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), AuthController.updateAccountSettings);
Router.get('/account_settings',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN), AuthController.getAccountSettings);

module.exports = Router;