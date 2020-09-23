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
        const queryButton = document.querySelector('#getquery')

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
                document.getElementById("query").value = data["transcription"];
                res = data["query_result"];
                if(res["result_code"]===1){
                    document.getElementById("result").value = "No result found";
                }
                else{
                    document.getElementById("result").value = get_result(res);
                }
            })
            .catch(err => console.log(err));
        });


        queryButton.addEventListener('click',async()=>{
            var data = document.getElementById("query").value;
            fd = new FormData();
            fd.append('query',data);
            fetch('https://localhost:3100/query',
            {
                method:'post',
                body: fd
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if(data["result_code"]===1){
                    document.getElementById("result").value = "No result found";
                }
                else{

                    document.getElementById("result").value = get_result(data);
                }
                
            })
            .catch(err => console.log(err));
        })

    const get_result = (data)=>{
        str = ""
        str += data["result_type"];
        if(data["result"].length > 1)str+="s";
        for(i=0;i<data["result"].length;i++)
            str += "\n"+(i+1)+'. '+data["result"][i];
        console.log(data["result_type"]);
        return str;
    }