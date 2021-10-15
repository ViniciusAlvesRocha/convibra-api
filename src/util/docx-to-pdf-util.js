// var toPdf = require("office-to-pdf")
const fse = require('fs-extra');
const uuid = (require('uuid')).v4;
const FileService = require("../service/file.service");
const sha1 = require('sha1');
const execShPromise = require("exec-sh").promise;

module.exports = async(_buffer) => {
  // return toPdf(_buffer);
  return new Promise(async(resolve, reject) => {
    try
    {
      let _basePath = "./tmp/"+sha1(_buffer,toString());
      let _fileName = uuid();
      let _inputFile = _basePath + "/" + _fileName+".docx";
      let _outputDir = _basePath + "/output" ;
      let _outputFile = _outputDir + "/" + _fileName+".pdf" ;

      await fse.ensureDir(_basePath);
      await fse.ensureDir(_outputDir);
      await fse.ensureFile(_outputFile);

      let _stream = await FileService.bufferToStream(_buffer);
      await FileService.writeStreamToFile(_stream,_inputFile);
      
      let cmd = global.preset.constants.soffice + ' --headless --convert-to pdf ' + _inputFile + ' --outdir ' + _outputDir;

      // console.log(_inputFile,"_inputFile");
      // console.log(_outputFile,"_outputFile");
      console.log(cmd,"cmd");

      // Run on Child Process 
      try
      {
        let out = await execShPromise(cmd, true);
        let _buffer = fse.readFile(_outputFile);

        // Cleanup Directory
        /* try {
          await fse.remove(_basePath);
        } 
        catch(_error) 
        {
          console.error(_error)
        } */

        resolve(_buffer);
      }
      catch(_error)
      {
        console.log('Error: ', _error);
        console.log('Stderr: ', _error.stderr);
        console.log('Stdout: ', _error.stdout);
        reject(_error);
      }
      

      /* exec(cmd, function (_error, stdout, stderr) {
        
        console.log(stdout,"stdout");
        console.log(stderr,"stderr");
          
        if (_error) {
          reject(_error);
        }
        
        fse.readFile(_outputFile, async(_error, _buffer) => 
        {
          

          if (_error)
          {
            reject(_error)
          } 

          resolve(_buffer);
          
          

        })
      }) */
    }
    catch(_error)
    {
      reject(_error);
    }
    
  }); 
 


}
