(async () => {
    const Bootstraper = require("./bootstraper");
    // var MailerUtil = require("./src/util/mailer.util");

    let jobName = process.argv[2];
    let jobConcurrency = process.argv[3] || 1;

    if (jobName == null) {
        console.log("Job Name is missing.");
        return;
    }


    /*  Init Root */
    global.preset = {};

    /* Environment  */
    global.preset.configs = await Bootstraper.loadConfig(process.env.NODE_ENV);

    /* Global Dependencies */
    global = await Bootstraper.injectDependencies(global);

    /* Global Services */
    global.preset.services = await Bootstraper.injectConstant(preset.configs);

    /* Global Services */
    global.preset.constants = await Bootstraper.injectConstant(preset.configs);

    /* Configure Mongo DB Connection */
    await Bootstraper.configureDB(global, preset.configs);

    /*  Autloaded Services */
    global.autoloaded = await Bootstraper.injectAutoloadedLib();

    global.activeQueue = await Bootstraper.injectQueue(global);

    // await MailerUtil.initializeMailConfig();

    switch (jobName) {
        case 'certificate-creator.job': {
            var CertificateCreatorJob = require("./src/job/certificate-creator.job");
            activeQueue['certificate-creator.job'].process('__default__',jobConcurrency, CertificateCreatorJob);
            break;
        }
        case 'certificate-convertor.job': {
            var CertificateConvertorJob = require("./src/job/certificate-convertor.job");
            activeQueue['certificate-convertor.job'].process('__default__',jobConcurrency, CertificateConvertorJob);
            break;
        }
        case 'recipient-importer.job': {
            var RecipientImporterJob = require("./src/job/recipient-importer.job");
            activeQueue['recipient-importer.job'].process('__default__',jobConcurrency, RecipientImporterJob);
            break;
        }
        case 'certificate-revocation.job': {
            var CertificateRevocationJob = require("./src/job/certificate-revocation.job");
            activeQueue['certificate-revocation.job'].process('__default__',jobConcurrency, CertificateRevocationJob);
            break;
        }
        case 'certificate-issuer.job': {
            var CertificateIssuanceJob = require("./src/job/certificate-issuer.job");
            activeQueue['certificate-issuance.job'].process('__default__',jobConcurrency, CertificateIssuanceJob);
            break;
        }
        case 'issue-certificate-on-blockchain.job': {
            var IssueCertificateOnBlockchainJob = require("./src/job/issue-certificate-on-blockchain.job");
            activeQueue['issue-certificate-on-blockchain.job'].process('__default__',jobConcurrency, IssueCertificateOnBlockchainJob);
            activeQueue['issue-certificate-on-blockchain.job'].add({}, { repeat: { cron: '*/2 * * * *' } });
            break;
        }
        default: {
            console.log("Option not available");
            break;
        }
    }

    /* const QueueStart = require("./src/start/queue.start");
    QueueStart.init(); */

    for (let _job in activeQueue) {
        activeQueue[_job].on('active', function (job, jobPromise) {
            // A job has started. You can use `jobPromise.cancel()`` to abort it.
            console.log(`${job['queue'].name} has started`);
        }).on('stalled', function (job, jobPromise) {
            // A job has started. You can use `jobPromise.cancel()`` to abort it.
            console.log(`${job['queue'].name} has stalled`);
        }).on('completed', function (job, jobPromise) {
            // A job has started. You can use `jobPromise.cancel()`` to abort it.
            console.log(`${job['queue'].name} has completed`);
        });
    }


})();
