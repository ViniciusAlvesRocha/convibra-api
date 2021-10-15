
const ResponseHandler = require("../util/response-handler");

const TestRouter = require("../routes/v1/test.route");
const AuthRoute = require("../routes/v1/auth.route");
const UserRoute = require("../routes/v1/user.route");
const InstanceSettingRoute = require("../routes/v1/instance_setting.route");
const EmailTemplateRoute = require("../routes/v1/email_template.route");
const RecipientImportRoute = require("../routes/v1/recipient_import.route");
const TemplateRoute = require("../routes/v1/template.route");
const APIConfigSettingRoute = require("../routes/v1/apiconfig_setting.route");
const CertificateRoute = require("../routes/v1/certificate.route");
const CommonRoute = require("../routes/v1/common.route");
const CourseRoute = require("../routes/v1/course.route");
const VerificationRequestRoute = require("../routes/v1/verification_request.route");
const BlockExplorerRoute = require("../routes/v1/block_explorer.route");

function init(app) {

    app.use("/api/v1/test", TestRouter);

    app.use("/api/v1/auth/", AuthRoute);
    app.use("/api/v1/user/", UserRoute);
    app.use("/api/v1/instance_setting/", InstanceSettingRoute);
    app.use("/api/v1/email_template/", EmailTemplateRoute);
    app.use("/api/v1/recipient_import/", RecipientImportRoute);
    app.use("/api/v1/template/", TemplateRoute);
    app.use("/api/v1/api_config_setting/", APIConfigSettingRoute);
    app.use("/api/v1/certificate/", CertificateRoute);
    app.use("/api/v1/common/", CommonRoute);
    app.use("/api/v1/course/", CourseRoute);
    app.use("/api/v1/verification_request/", VerificationRequestRoute);
    app.use("/api/v1/block_explorer/", BlockExplorerRoute);


    app.use(function (err, req, res, next) {
        console.error(err.stack)
        res.status(500).send({ status: 'failure', message: err.message })
    });

    app.get('*', function (req, res) {
        return ResponseHandler.generateError(res, "Route Not Found", 404);
    });
}

module.exports = {
    init: init
}