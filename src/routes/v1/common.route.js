const route = require("express").Router();
const FileController = require("../../controller/file.controller");
const InstanceSettingController = require("../../controller/instance_setting.controller");
const CommonController = require("../../controller/common.controller");
const CertificateController = require("../../controller/certificate.controller");

route.get('/file/:fileName',FileController.serveFile);

route.get('/get_instance_setting',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ACCOUNT_ADMIN,{enforce:false}),InstanceSettingController.getInfo);

route.get('/get_dashboard_statistic',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ADMINS),CommonController.getDashboardStatistic);

route.get('/export_csv/:batchID',CertificateController.exportCSV);

module.exports = route;