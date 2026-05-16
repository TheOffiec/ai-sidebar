
var audioRecorder = null;
class AudioRecorder {
    constructor( sendResponse ) {
      this.sendResponse = sendResponse;
      this.stream = null;
      this.mediaRecorder = null;
      this.chunks = [];
      if( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
        console.log("getUserMedia supported.");
        navigator.mediaDevices.getUserMedia( { audio: true } )
          .then( this.loadStream.bind( this ) )
          .catch( this.error.bind( this ) )
      }
      else  this.error("getUserMedia not supported on your browser!")
    }
    error( error ) {
      this.respond( error );
    }
    respond( message ) {
      var sendResponse = this.sendResponse
      console.log( "sendResponse", sendResponse )
      sendResponse( message );
    }
    loadStream( stream ) {
      this.stream = stream;
      this.mediaRecorder = new MediaRecorder( stream );
      this.mediaRecorder.start();
      this.mediaRecorder.onerror = this.onerror.bind( this );
      this.mediaRecorder.ondataavailable = this.ondataavailable.bind( this );
      this.mediaRecorder.onstop = this.onstop.bind( this );
    }
    ondataavailable( event ){
      this.chunks.push( event.data );
    }
    onstop( event ) {
      const blob = new Blob( this.chunks, { type: this.mediaRecorder.mimeType } );
      const reader = new FileReader();
      var respond = this.respond.bind( this )
      reader.onloadend = () => respond( { "text": reader.result,  "blob": blob } );
      reader.readAsDataURL( blob );
    }
    onerror( event ) {
      this.respond( event.error );
    }
    stop( sendResponse ) {
      this.sendResponse = sendResponse
      try{
        this.mediaRecorder.stop();
        this.stream.getTracks() // get all tracks from the MediaStream
          .forEach( track => track.stop() ); // stop each of them
        this.mediaRecorder.requestData();
      }
      catch(e){ console.log( e ) }
    }
}

class ElevenLabs {
    constructor( apiKey ) {
        this.apiKey = apiKey;
        this.baseUrl = "https://api.elevenlabs.io/v1";
        this.voices = [];
    }
    async getVoices() {
        const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
            "xi-api-key": this.apiKey,
        },
        });
        if ( !response.ok ) {
            throw new Error(`Error fetching voices: ${response.statusText}`);
        }
        const data = await response.json();
        this.voices = data.voices
        return this.voices;
    }
    async textToSpeech( voiceId, text ) {
        const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": this.apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                outputFormat: 'mp3_44100_128',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8
                }
            }),
        })
        if (!response.ok) {
            const data = await response.json();
            throw new Error( data.detail.message );
        }
        const audioBlob = await response.blob();
        return URL.createObjectURL( audioBlob );
    }
    async speechToText(audioBlob) {
        // audioBlob: Blob or File containing audio data (e.g. from MediaRecorder)
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model_id', 'scribe_v1');
        // The endpoint for ElevenLabs speech-to-text is /v1/speech-to-text
        const response = await fetch(`${this.baseUrl}/speech-to-text`, {
            method: "POST",
            headers: {
                "xi-api-key": this.apiKey
                // Do not set Content-Type for FormData; browser will set it with boundary
            },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error( data.detail.message );
        }
        // The API should return a JSON with the transcription result
        return data.text || data.transcription || data;
    }
}