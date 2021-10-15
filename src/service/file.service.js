const { Duplex } = require('stream');
const archiver = require('archiver');

async function getFileContent(_fileId) {
    let _response = {
        status: "success",
        data: {},
        message: "",
    }

    _response = await getFileStream(_fileId);
    if (_response['status'] == 'failure') {
        return _response;
    }

    try {
        _response['status'] = 'success';
        _response['data']   = await streamToContent(_response['data']);
        return _response; 
    }
    catch (e) {
        _response['status'] = 'failure';
        _response['message'] = e.message;
        return _response;
    }

}

async function streamToContent(_stream) {
    return new Promise((resolve, reject) => {
        let _finalData = '';
        _stream.on("data", (_data) => {
            _finalData += _data.toString();
        }).on("error", (_error) => {
            reject(_error);
        }).on("end", (_error) => {
            resolve(_finalData);
        })
    });
}

async function getFileStream(_fileName) {
    let _response = {
        status: "success",
        data: {},
        message: "",
    }
    
    if (await fileExists(_fileName) == false) {
        _response["status"] = "failure";
        _response["message"] = "File Does not Exists.";
        return _response;
    }

    _response["data"] = gridBucket['fs'].openDownloadStreamByName(_fileName);
    return _response;
}


async function streamCSVToJSON(_stream,_unflatten,_indexedColumn) {
    let _option = {};
    if(_indexedColumn != undefined && _indexedColumn == true)
    {
        _option['headers'] = false;
    }    

    return new Promise((resolve, reject) => {
        let final = [];
        _stream
        .pipe(csvParser(_option))
        .on("data", (_data) => {
            /* Convert into nested JSON */
            if(_unflatten != undefined && _unflatten == true)
            {
                final.push(flat.unflatten(_data));
            }
            else
            {
                final.push(_data);
            }
        })
        .on("end", (_data) => {
            resolve(final);
        })
        .on("error", (_error) => {
            reject(_error);
        })
    });
}


async function fileExists(_fileId) {
    /* Check by filename */
    _fileByName = await gridBucket['fs'].find({ filename: _fileId }).toArray();
    if (!_fileByName || _fileByName.length === 0) {

        return false;
    }

    return true;
}

async function bufferToStream(buffer) {  
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

async function streamToBuffer(stream)
{
    return new Promise((_resolve,_reject) => {
        let bufs = [];
        stream.on('data', (chunk) => {
            bufs.push(chunk);
        });
        stream.on("end", () =>{
            _resolve(Buffer.concat(bufs));
        })
        stream.on("error", (e) =>{
            _reject(e);
        })
    })
    
}

async function writeStreamToFile(stream,fullFilePath)
{
    return new Promise(async (_resolve,_reject) => {
        try
        {
            await fse.ensureFile(fullFilePath);
            let wstream = fse.createWriteStream(fullFilePath);
            stream.pipe(wstream);
            wstream.on("close",(_close) => _resolve(fullFilePath));
            wstream.on("error",(_error) => _reject(_error));
        }
        catch(e)
        {
            _reject(e)
        }
        
    })
}

async function createZip(_basePath, _fileName, _srcPath) {

    return new Promise(async (resolve, reject) => {
        await fse.ensureDir(_basePath, 0o2777);

        let _output = fs.createWriteStream(_basePath + '/' + _fileName + '.zip');
        let _archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // pipe archive data to the file
        _archive.pipe(_output);
        _archive.directory(_srcPath, false);
        _archive.finalize();

        _archive.on('error',  (err) =>{
            reject(err);
        });

        _output.on('close',  async() => {
            resolve();

            /* Removing Generated directory */
            await fse.remove(_srcPath);
        });
    });
}    

module.exports = {
    getFileContent: getFileContent,
    getFileStream: getFileStream,
    streamCSVToJSON:streamCSVToJSON,
    streamToContent:streamToContent,
    bufferToStream:bufferToStream,
    streamToBuffer:streamToBuffer,
    writeStreamToFile:writeStreamToFile,
    createZip:createZip
}

