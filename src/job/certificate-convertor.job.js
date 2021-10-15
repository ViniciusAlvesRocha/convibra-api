module.exports = async function (job, done) {
    /* Get data */
    let _inputDir = job.data._inputDir;
    let _outputDir = job.data._outputDir;
    let _batchId = job.data._batchId;

    try{
        await autoloaded.CertificateService.bulkConvertDocToPdf(_inputDir,_outputDir);

        /* call to generate a zip */
        await autoloaded.CertificateService.generateCertificateZip(_batchId);

        done(null);
    }
    catch(e){
        console.log("Exception Caused in Bulk Conversion Template : "+templateId);
        done(new Error(e.message));
    }

}