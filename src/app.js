var express = require('express');
const Sox = require('sox-stream');
var multer  = require('multer');
var https = require('https')
var http = require('http')
var Ds = require('deepspeech')
var app = express();
const fs = require('fs');
const fetch = require("node-fetch");
const Duplex = require('stream').Duplex;
const MemoryStream = require('memory-stream');
const {exec, spawnSync} = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const { finished } = require('stream');
const { resolve } = require('path');
const spawn  = require('child_process').spawnSync
const dns = require('dns');

const options = {
  key: fs.readFileSync('../certificates/key.pem'),
  cert: fs.readFileSync('../certificates/cert.pem')
};
console.log(__dirname)
app.use(express.static('../public'));
app.set('views','../views')
app.set('view engine','hbs')

var upload = multer({ dest: '../public/uploads/' });
var type = upload.single('upl');
//et as_model = new Ds.Model('../deepspeech/output_graph.pb', 1024);
let en_model = new Ds.Model('../deepspeech/deepspeech-0.7.4-models.pbmm',1024);

function bufferToStream(buffer) {
  var stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}


app.get('/sample',(req,res)=>{
   res.render('sample')
})


const convert = async (source_path,target_path)=>{
  return new Promise((resolve,reject)=>{
    ffmpeg(source_path)
    .toFormat('wav')
    .audioChannels(1)
    .audioFrequency(16000)
    .on('error',(err)=>{
      reject(err);
    })
    .on('end',()=>{
      resolve(target_path);
    })
    .save(target_path)
  })
}




app.post('/test',type,function (req, res) {

  convert(req.file.path,req.file.path+".wav")
  .then(result=>{
    getTranscribe(result,en_model)
    .then(fin =>{
      console.log(fin)
      fetch('http://localhost:8888/page?query='+fin)
      .then((response)=>{
        response.json().then((data)=>{
          console.log(data);
          final_data = {
            "transcription":fin,
            "query_result" :data
          }
          res.send(JSON.stringify(final_data));
        })
      })
    })
    .catch(e=>{
      console.log(e);
    })
  })
  .catch(e=>{
    console.log(e)
  })
});

app.post('/transcribe',type, function (req, res) {
  convert(req.file.path,req.file.path+".wav")
  .then(result=>{
    getTranscribe(result,en_model)
    .then(fin =>{
      data = {
        "transcription":fin
      }
      res.send(JSON.stringify(data));
    })
    .catch(e=>{
      console.log(e);
    })
  })
  .catch(e=>{
    console.log(e)
  })
});

app.post('/query',type,function (req,res){
  console.log(req.body['query']);
  fetch('http://localhost:8888/page?query='+req.body['query'])
  .then((response)=>{
    response.json().then((data)=>{
      res.send(data)
    })
  })
})


// var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);
//var httpsServer2 = https.createServer(options,app2);


httpsServer.listen(3100);
//httpsServer2.listen(3101);
console.log('running');

const getTranscribe = async (file_path,model)=>{
  const time = process.hrtime();
  var buffer = fs.readFileSync(file_path);
  var translation = model.stt(buffer);
  const diff = process.hrtime(time);
  console.log(diff);
  return translation;
}

