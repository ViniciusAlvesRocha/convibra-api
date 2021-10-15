const Router = require("express").Router();
const CertificateController = require("../../controller/certificate.controller");

Router.get('/list',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),CertificateController.getListing);

Router.get('/details/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),CertificateController.getDetails);

Router.get('/public/details/:id',CertificateController.getCertificatePublicDetails);

Router.post('/issue',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ISSUER),CertificateController.issueCertificate);

Router.post('/share_to/verifier',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.RECIPIENT),CertificateController.shareCertificateToVerifier);


Router.post('/revoke',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ALL_USER),CertificateController.revokeCertificate);

Router.post('/claim/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.RECIPIENT),CertificateController.claimCertificate);

Router.get('/history',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),CertificateController.getHistory);

Router.get('/batch/list',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),CertificateController.getBatchListing);

Router.get('/shared',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.VERIFIER),CertificateController.getSharedCertificateListing);

Router.post('/store/stats',CertificateController.storeCertificateStats);


Router.post('/generate_zip/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),CertificateController.generateCertificateZip);

Router.get('/get_id_from_qr',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.USER_AND_ADMIN),CertificateController.getCertificateIdQrScan);

module.exports = Router