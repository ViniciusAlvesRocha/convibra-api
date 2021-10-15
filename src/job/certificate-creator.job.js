const { Duplex } = require('stream');
var toPdf = require('../util/docx-to-pdf-util');


module.exports = async function (job, done) {
    /* Get data */
    let templateId = job.data.templateId;
    let document = job.data.document;

    try{       

        let previewPdf = null;
        let status  = "UNDER_PROGRESS";
        if(document != null){
            try
            {
                previewPdf = await convertTemplateintoPdf(document).catch(async (error) => {
                    await autoloaded.TemplateService.deleteData(0,templateId);
                });

                if(previewPdf == null || previewPdf == undefined){
                    status = "FAILED";
                }else{
                    status = "COMPLETED";
                    console.log("Preview PDF Conversion done for Template : "+templateId,document);
                }
            }
            catch(e){
                status = "FAILED";   
                console.log("Preview PDF Conversion failed for Template : "+templateId,e);
            }
            
        }

        
        
        let updateData = {};
        updateData["templateId"] = templateId;
        updateData["previewPdf"] = previewPdf;
        updateData["status"] = status;

        await autoloaded.TemplateService.updateDocToPdfConversion(updateData);

        done(null);
    }
    catch(e){
        console.log("Exception Caused in Preview PDF Conversion done for Template : "+templateId);
        done(new Error(e.message));
    }

}


function convertTemplateintoPdf(documentId){
    return new Promise(async(resolve,reject)=>{
        try{
            let readstream = await autoloaded.FileService.getFileStream(documentId);

            if(readstream.status == 'success'){
                
                readstream = readstream.data;

                let bufs = [];
                readstream.on('data', function (chunk) {
                    bufs.push(chunk);
                });

                readstream.on('end', async function () {
                    var docxBuffer = null;
                    var finalBuf = null;
                    
                    docxBuffer =  Buffer.concat(bufs);    
                    finalBuf =  await docxTemplates({
                        output: 'buffer',
                        template: docxBuffer,
                        data: {
                            recipient: "Preview Recipient",
                            courseNameLang1: "Preview Program Lang 1",
                            courseNameLang2: "Preview Program Lang 2",
                            date: moment().format("D/M/Y"),
                            convoDateLang1: moment().format("D/M/Y"),
                            convoDateLang2: moment().format("D/M/Y"),
                            serialNo: "Preview Serial No.",
                            extraData: "extraData",
                            fileId:"File ID"
    
                        },
                        additionalJsContext: {
                            qrCode: () => {
                                let data = "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";
                                return { width: 3, height: 3, data, extension: '.png' };
                            }
                        }
                    }).catch((error) => {
                        reject(error);
                    });
                    
                    
                    let pdfBuffer = await toPdf(finalBuf).catch((error) => {
                        reject(error);
                    });

                    var bufferStream = bufferToStream(pdfBuffer);
                    bufferStream.pipe(gridBucket.fs.openUploadStream(sha1(uuid()),{contentType:'application/pdf'}))
                    .on('error', function(error) {
                        reject(error);
                    })
                    .on('finish', function(e) {
                        resolve(e.filename);
                    });
                       
                    
                })
            }
            else{
                reject(new Error(readstream.message, err));
            }    
        }
        catch(e){
            reject(e);
        }
    });
}

function bufferToStream(buffer) {  
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}