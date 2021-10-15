const Bootstraper = require("./bootstraper");

/* Async Function  */

(async () => {


    /******************************************************************
 *                      Global Initialization  
 * ****************************************************************/

    /*  Init Root */
    global.preset = {};

    /* Environment  */
    global.preset.configs = await Bootstraper.loadConfig(process.env.NODE_ENV);


    console.log("Current environment: ", preset.configs.environment);
    console.log("Current environment host: ", preset.configs.serverHost);
    console.log("Current environment port: ", preset.configs.serverPort);


    /* Global Dependencies */
    global = await Bootstraper.injectDependencies(global);



    /*  Global Roles */
    global.preset.roles = await Bootstraper.injectRoles(global);

    /* Global Services */
    global.preset.services = await Bootstraper.injectConstant(preset.configs);
    
    /* Global Services */
    global.preset.constants = await Bootstraper.injectConstant(preset.configs);

    /*  Autloaded Services */
    global.autoloaded = await Bootstraper.injectAutoloadedLib();


    /*  Autloaded Services */
    global.activeQueue = await Bootstraper.injectQueue(global);

    // var IssueCertificateOnBlockchainJob = require("./src/job/issue-certificate-on-blockchain.job");
    // activeQueue['issue-certificate-on-blockchain.job'].process(5, IssueCertificateOnBlockchainJob);
    // activeQueue['issue-certificate-on-blockchain.job'].add({}, { repeat: { cron: '*/2 * * * *' } });


    /* Configure Mongo DB Connection */
    var databasePromise = await Bootstraper.configureDB(global, preset.configs);


    /* Grid FS + Multer Connection */
    global.multerGridFs = await Bootstraper.configureMulterGridFs(databasePromise);

    /* Launch Express */
    let app = await Bootstraper.launchExpress(preset.configs)

    /* Inject multerGridFS */
    app.multerGridFs = global.multerGridFs;


    /* Initiate App */
    var appStart = require('./src/start/app.start');
    app.roles = preset.roles;

    await appStart.init(app);

    try {
        await global.autoloaded.BootupService.configureSuperAdmin();
    }
    catch (e) {
        console.log("Error Occured while configuring superadmin.");
    }




})()


/* Global Promise Handler */
process.on("unhandledRejection", (_error) => {
    console.error((new Date).toUTCString() + ' unhandledRejection:', _error.message)
    console.error(_error.stack)
    process.exit(1)

});

process.on("uncaughtException", (_error) => {
    console.error((new Date).toUTCString() + ' uncaughtException:', _error.message)
    console.error(_error.stack)
    process.exit(1)

});

