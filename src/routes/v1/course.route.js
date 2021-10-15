const Router = require("express").Router();
const CourseController = require("../../controller/course.controller");

Router.get('/list',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.ISSUER_AND_SUB_ACCOUNT_ADMIN),CourseController.getListing);

Router.get('/details/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),CourseController.getDetails);

Router.post('/create',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),CourseController.create);

Router.post('/update/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),CourseController.update);

Router.post('/delete/:id',autoloaded.AuthorizationMiddleware.authenticate(preset.roles.SUB_ACCOUNT_ADMIN),CourseController.deleteCourse);

module.exports = Router