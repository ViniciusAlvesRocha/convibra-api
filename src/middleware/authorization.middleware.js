
var ResponseHandler = require("./../util/response-handler");
var UserModel = require("../model/user.model");

module.exports.authenticate = function (roles, additionalCriteria) {

    return async function (req, res, next) {
        // authenticate request
        var _token = req.headers.authorization;

        if (additionalCriteria == undefined || additionalCriteria == null) {
            additionalCriteria = {};
        }

        if (additionalCriteria.enforce == undefined) {
            additionalCriteria['enforce'] = true;
        }


        // invalid token - synchronous
        try {

            let _user = null;
            if (additionalCriteria.enforce == true) {

                /* Check if incomming token is from mainnet */
                if(preset.configs.uniblockGateway != undefined && _token == preset.configs.uniblockGateway.apiSecret)
                {
                    _user = await UserModel.findOne({ role: "ROLE_ACCOUNT_ADMIN" });
                }
                else
                {
                    var _authToken = jwt.verify(_token, preset.services.jwt.key);
                    _user = await UserModel.findOne({ _id: _authToken.userId })

                    if (_user == false) {
                        return ResponseHandler.generateError(res, "Invalid User", null);
                    }

                    /*  Check Roles  */

                    var isUnauthorized = roles.indexOf(_user.role) < 0;
                    if (isUnauthorized) {
                        return ResponseHandler.generateError(res, "Unauthorized access", null, 401);
                    }
                }


                
            }
            /* Not Enforce but if exists  */
            else if(additionalCriteria.enforce == false && _token != null && _token != undefined)
            {
                try
                {
                    var _authToken = jwt.verify(_token, preset.services.jwt.key);
                    _user = await UserModel.findOne({ _id: _authToken.userId })
                }
                catch(e)
                {

                }
            }

            /* Assign Current User */
            req.currentUser = _user;

            return next();

        } catch (err) {
            return ResponseHandler.generateError(res, err.message, err.stack);
        }

        /*  AuthToken.findOne({ token: token }).populate('userId').exec(function (err, authToken) {
             if (err || (!authToken) || (!authToken.userId)) {
                 var err = new Error("Unauthorized access");
                 err.status = 401;
                 return next(err);
             }
          
             var isExpired = new Date(authToken.expiry).getTime() < new Date().getTime();
             var isUnauthorized = roles.indexOf(authToken.userId.role[0]) < 0;
 
             if (isExpired || isUnauthorized) {
                 
                 var msg = (isExpired) ? " Session expired . Login again" : "You don't have permission to access this url";
                 var err = new Error(msg);
                 err.status = 401;
                 cleanToken(token);
                 return next(err);
             }
             req.currentUser = authToken.userId;
 
             return next();
         }) */
    }
}