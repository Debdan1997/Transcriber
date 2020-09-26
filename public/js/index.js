const messages = document.getElementById('messages');
const submitButton = document.getElementById('submit');
//Templates

const messageTemplate = document.getElementById('message-template').innerHTML
const replyTemplate = document.getElementById('reply-template').innerHTML


const updateMessage = (template,insert,scroll,messageText)=>{
    const html = Mustache.render(template,{
        message:messageText
    });
    insert.insertAdjacentHTML('beforeend',html)
    scroll.scrollTop = scroll.scrollHeight;
}



updateMessage(replyTemplate,messages,messages,"Try asking questions like..")
updateMessage(replyTemplate,messages,messages,"Show me balance for account number 128")
updateMessage(replyTemplate,messages,messages,"What are the transactions for account 1024")


const recordAudio = () =>
        new Promise(async resolve => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
                channelCount : 1,
                frameRate: 44100,
                sampleSize: 16
            }});
            var options = {
                audioBitsPerSecond: 128000,
                mimeType: 'audio/webm'
            }
            const mediaRecorder = new MediaRecorder(stream,options);
            let audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            const start = () => {
                audioChunks = [];
                mediaRecorder.start();
            };

            const stop = () =>
                new Promise(resolve => {
                mediaRecorder.addEventListener('stop', () => {
                    const audioBlob = new Blob(audioChunks,{type:'audio/wav'});
                    resolve({audioBlob});
                });

                mediaRecorder.stop();
            });

            resolve({ start, stop });
        });

        const recordButton = document.querySelector('#record');
        const stopButton = document.querySelector('#stop');
        const queryButton = document.querySelector('#submit')

        let recorder;
        let audio;

        recordButton.addEventListener('click', async () => {
            recordButton.setAttribute('disabled', true);
            stopButton.removeAttribute('disabled');
            if (!recorder) {
                recorder = await recordAudio();
            }
            recorder.start();
        });

        stopButton.addEventListener('click', async () => {
            recordButton.removeAttribute('disabled');
            stopButton.setAttribute('disabled', true);
            audio = await recorder.stop();
            var fd = new FormData();
            fd.append('upl', audio.audioBlob, 'blobby.mp3');
            fetch('https://localhost:3100/test',
            {
                method: 'post',
                body: fd
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if(data["transcription"].length > 0)
                    updateMessage(messageTemplate,messages,messages,data["transcription"])
                else
                    updateMessage(replyTemplate,messages,messages,"Sorry, voice not recognised")

                res = data["query_result"];
                if(res["result_code"]===1 && data["transcription"].length > 0){
                    updateMessage(replyTemplate,messages,messages,"Result not found, try again")
                    document.getElementById("result").value = "";
                }
                else if (data["transcription"].length > 0){
                    updateMessage(replyTemplate,messages,messages,"Result found")
                    document.getElementById("result").value = get_result(res);
                }
            })
            .catch(err => console.log(err));
        });


        // queryButton.addEventListener('click',async()=>{
        //     var data = document.getElementById("inputText").value;
        //     if(data.length >0 )
        //     updateMessage(messageTemplate,messages,messages,data)
        //     var prev = data;
            
        //     fd = new FormData();
        //     fd.append('query',data);
        //     fetch('https://localhost:3100/query',
        //     {
        //         method:'post',
        //         body: fd
        //     })
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log(data);
        //         if(data["result_code"]===1 && prev.length>0){
        //             updateMessage(replyTemplate,messages,messages,"Result not found, try again")
        //             document.getElementById("result").value = "";
        //         }
        //         else if(prev.length>0){
        //             updateMessage(replyTemplate,messages,messages,"Result found")
        //             document.getElementById("result").value = get_result(data);
        //         }
        //     })
        //     .catch(err => console.log(err));
        // })

    const get_result = (data)=>{
        str = ""
        str += data["result_type"];
        if(data["result"].length > 1)str+="s";
        for(i=0;i<data["result"].length;i++)
            str += "\n"+(i+1)+'. '+data["result"][i];
        console.log(data["result_type"]);
        return str;
    }

