var CertificateCreatorJob = require("../job/certificate-creator.job");
var CertificateConvertorJob = require("../job/certificate-convertor.job");
var RecipientImporterJob  = require("../job/recipient-importer.job");
var CertificateRevocationJob  = require("../job/certificate-revocation.job");
var CertificateIssuanceJob  = require("../job/certificate-issuer.job");

async function init(app){
    activeQueue['certificate-creator.job'].process(2,CertificateCreatorJob);
    activeQueue['certificate-convertor.job'].process(2,CertificateConvertorJob);
    activeQueue['recipient-importer.job'].process(RecipientImporterJob);
    activeQueue['certificate-revocation.job'].process(CertificateRevocationJob);
    activeQueue['certificate-issuance.job'].process(CertificateIssuanceJob);
    
}
module.exports = {
    init:init
}