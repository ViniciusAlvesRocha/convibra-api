const Router = require("express").Router();
const VerificationRequestController = require("../../controller/verification_request.controller");

Router.post('/send',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.VERIFIER),VerificationRequestController.sendVerificationRequest);

Router.get('/list/:id*?',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ISSUER_AND_VERIFIER),VerificationRequestController.getVerificationRequestListing);

Router.post('/reply',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ISSUER),VerificationRequestController.sendReplyToVerifier);

module.exports = Router