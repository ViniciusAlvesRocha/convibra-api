const route                          = require("express").Router();
const TestController = require("../../controller/test/test.controller");

route.get('/testResponse', TestController.testResponse);
route.get('/testUniblockGateway', TestController.testUniblockGateway);
route.get('/configureSuperAdmin', TestController.configureSuperAdmin);


module.exports = route;