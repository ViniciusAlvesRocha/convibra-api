function single(fileName){
    return function (req, res, next) {
        // return next(req.app.multerGridFs.single(fileName));
        let multerInstance = req.app.multerGridFs.single(fileName);
        return multerInstance(req,res,next);
    }
}

function multiple(fileObject){
    return function (req, res, next) {
        let multerInstance = req.app.multerGridFs.fields(fileObject);
        return multerInstance(req,res,next);
    }
}

module.exports = {
    single:single,
    multiple:multiple
}

// module.exports.single = function (fileName) {
//     return function (req, res, next) {
//         // return next(req.app.multerGridFs.single(fileName));
//         let multerInstance = req.app.multerGridFs.single(fileName);
//         return multerInstance(req,res,next);
//     }
// }