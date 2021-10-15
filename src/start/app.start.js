var RoutesStart = require("./routes.start");
var QueueStart = require("./queue.start");
var MailerUtil = require("../util/mailer.util");

async function init(app){
    MailerUtil.initializeMailConfig();

    /*  Check if Superadmin Exists */
    // let adminStatus = await AdminService.createSuperAdmin();
    // console.log("Superadmin Status: ",adminStatus);

    RoutesStart.init(app);
    // QueueStart.init(app);
}
module.exports = {
    init:init
}
