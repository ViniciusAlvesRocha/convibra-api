module.exports = async function (job, done) {
    try {
        let targetHash = job.data.targetHash;
        let issuerPrivateKey = job.data.issuerPrivateKey;
        

        let _provider = await autoloaded.ChainService.getProviderInstance('uniblocknet');
        let _wallet = await autoloaded.ChainService.getWalletInstance(issuerPrivateKey, _provider);
        let _certificateInstance = await autoloaded.ChainService.getCertificateInstance(_wallet);


        /* check provided certificate hash(target hash) is valid or not  */
        let txCertificateData = {}
        try
        {
            txCertificateData = await _certificateInstance.getCertificate(targetHash);

            /* Revoke Only if not revoked  */
            console.log(txCertificateData.isRevoked,"Revocation");
            if(txCertificateData.isRevoked == false)
            {
                /* revoke certificate from blockchain  */

                let options = {
                    nonce: await autoloaded.ChainService.getNonce(_wallet.address, true)
                }

                let tx = await _certificateInstance.revokeCertificate(targetHash,options);
                let txResponse  = await tx.wait();
                let txnHash = txResponse.transactionHash;
                
                let response = await autoloaded.CertificateService.updateRevocationTxnHash(targetHash,txnHash);    
                

                if(response.status == "success"){
                    console.log(response.message);
                    done(null);
                }else{
                    console.log(response.message);
                    done(response.message);
                }          
            }
            else
            {
                console.log("Certificate: "+targetHash+" Already Revoked");
                done("Certificate: "+targetHash+" Already Revoked");
            }

        }
        catch(e)
        {
            /* Certificate Does not Exists  */
            console.log("Certificate: "+targetHash+" Does not exist , Error: "+e.message);
            done("Certificate: "+targetHash+" Does not exist , Error: "+e.message);
        }
    }
    catch (e) {
        console.log("Job error", e.message);
        done(e.message);
    }
}

