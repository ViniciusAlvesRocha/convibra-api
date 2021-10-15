function validateRoute(req, file) {
    let routeConfig = {
        "/api/v1/common/account_settings/update": {
            "methods": ['POST'],
            "validExtentions": ['jpg', 'jpeg', 'png']
        },
        "/api/v1/account-admin/batch/upload_csv": {
            "methods": ['POST'],
            "validExtentions": ['csv']
        }
    }

    return validateUpload(req, file, routeConfig)
}

function validateUpload(req, file, routeConfig) {

    let response = {
        hasError: false,
        error: {}
    }

    if (routeConfig[req.originalUrl] != undefined) {
        let methods = routeConfig[req.originalUrl].methods;
        let validExtentions = routeConfig[req.originalUrl].validExtentions;


        if (methods.includes(req.method)) {
            if (validExtentions.indexOf(file.originalname.split('.').pop().toLowerCase()) == -1) {
                response.error = new Error("Please upload file of "+validExtentions.join(" , ")+" format");
                response.error.status = 500;
                response.hasError = true;
            }
        }
    }

    return response
}

module.exports = {
    validateRoute: validateRoute
}