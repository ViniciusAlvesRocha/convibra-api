var ResponseHandler = require("../util/response-handler");
var FileService = require("../service/file.service");
const FileType = require('file-type');
/* const isSvg = require('is-svg'); */
const { sync: mime, async: mimeAsync } = require('mime-kind');

async function serveFile(req, res) {
    try {

        let _finalStream = false;
        let _finalContentType = false;

        

        if(req.query.entity == 'batch_zip')
        {
            /* For Downloading Batch Zip */
            
            /*  check file exists */
            let _batchPath = preset.configs.basePath.generatedBatchZip;
            let _batchPathWithBatch = _batchPath+"/"+req.params.fileName;
            let _fileExists = await fse.pathExists(_batchPathWithBatch);

            _finalStream = fs.createReadStream(_batchPathWithBatch);
        }
        else
        {
            let _fileStreamResponse = await FileService.getFileStream(req.params.fileName);
            if (_fileStreamResponse['status'] == "failure") {
                return ResponseHandler.generateError(res, _fileStreamResponse['message'], {}, 404);
            }

            _finalStream = _fileStreamResponse['data'];
        }
        
        
        /*  Detect Mime Type  */
        let _mimeDetails = await mimeAsync(_finalStream);
        if(_mimeDetails != undefined)
        {
            _finalContentType = _mimeDetails.mime;
        }
        else
        {
            /* Check if file is svg */
            
            /* if(isSvg(await FileService.streamToBuffer(_finalStream)))
            {
                _finalContentType = "image/svg+xml";
            } */
            
        }

        
        /* Check if Stream Acquired */
        if(_finalStream == false)
        {
            return ResponseHandler.generateError(res,"Error Occured while acquiring stream." , {});
        }

        /* Set Mime Type for Reponse  */
        if(_finalContentType != false)
        {
            res.setHeader('Content-Type',_finalContentType);
        }
        else if(req.query.entity == 'image')
        {
            res.setHeader('Content-Type',"image/svg+xml");
        }
        else
        {
            res.setHeader('Content-Type',"application/octet-stream");
        }


        _finalStream.pipe(res);
        

        _finalStream.on("error",() => {
            return ResponseHandler.generateError(res,"Error Occured while initiating download." , {});
        })
        
    }
    catch (e) {
        return ResponseHandler.generateError(res, e.message, {}, 500);
    }
}

// async function serveFileLegacy(req, res) {
//     let _file = false
//     try {
//         _file = await gfs.files.find({ filename: req.params.fileName }).toArray();

//         if (!_file || _file.length === 0) {
//             return ResponseHandler.generateError(res, "File Not Found.", {}, 404);
//         }

//         /** create read stream */
//         var readstream = gfs.createReadStream({
//             filename: _file[0].filename
//         });
//         /** set the proper content type */
//         res.set('Content-Type', _file[0].contentType)
//         /** return response */
//         return readstream.pipe(res);

//     }
//     catch (e) {
//         return ResponseHandler.generateError(res, "Error Getting file.", {}, 500);
//     }
// }



module.exports = {
    serveFile: serveFile,
}