var generateError = function(res,message,responseObject,responseCode){
	responseCode = responseCode || 400;
	res.status(responseCode).send({
		"message":message,
		"data":responseObject,
		"status": "failure"
	});
    res.end();
};

var generateSuccess = function(res,message,responseObject,responseCode){

	responseCode = responseCode || 200;
	res.status(responseCode).send({
		"message":message,
		"data":responseObject,
		"status": "success"
	});
    res.end();
};

module.exports = {
    generateError:generateError,
    generateSuccess:generateSuccess
}