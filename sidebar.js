var configure = document.getElementById("configure")
var configure_open = document.getElementById("configure_open")
var files = document.getElementById('files-list') 
var files_open = document.getElementById("files_open")
var create_config_template = document.getElementById('create_config_template')
var remove_config_template = document.getElementById('remove_config_template')
var timer = document.getElementById("timer")
var button = document.getElementById("ask")
var answer = document.getElementById("answer")
var audio_auto_play_response_option = document.getElementById("audio_auto_play_response_option")
var audio_voice_section = document.getElementById("audio_voice_section")
var audio_key_section = document.getElementById("audio_key_section")
var record = document.getElementById("record")
var ask_ai_form = document.forms.ask_ai
var ai_model = ask_ai_form.model
var api_key = ask_ai_form.API_key
var ai_model_version = ask_ai_form.model_version
var template = ask_ai_form.template
var question = ask_ai_form.question
var audio = ask_ai_form.audio
var audio_key = ask_ai_form.audio_key
var audio_voice = ask_ai_form.audio_voice
var audio_auto_play_response = ask_ai_form.audio_auto_play_response
var add_page_contents = ask_ai_form.add_page_contents
var add_instruction_template = ask_ai_form.add_instruction_template
var response_display = ask_ai_form.response_display
var select_configuration_template = ask_ai_form.select_configuration_template

class Clock{
    constructor(){
        this.count = 0
        this.interval = setInterval( this.update.bind(this), 100 )
    }
    update(){
        timer.innerText = ( this.count++ / 10 ) + "s"
    }
    stop(){
        clearInterval( this.interval )
    }
}
class Entry{
    constructor( dict, contentKey = "content", roleKey = "role", type = "text", file = null ){
        this.type = type
        this.file = file
        this._dict = {}
        this.roleKey = roleKey
        this._dict[ this.roleKey ] = dict[ this.roleKey ]
        this.contentKey = contentKey
        this._dict[ this.contentKey ] = dict[ this.contentKey ]
        this.audio = null
    }
    get role(){ return this._dict[ this.roleKey ] }
    get content(){ return this._dict[ this.contentKey ] }
    set role( value ){ console.log("aaaaaaaaaaaa");this.dict[ this.roleKey ] = value }
    get dict(){ return this._dict }
}
class OpenAI{
    constructor(){
        this.url = "https://api.openai.com/v1/responses";
        this.conversation = []
    }
    command( role, content, audio = null, type = "text" ){
        var entry = new Entry( { role: role, content: content } )
        entry.audio = audio
        this.conversation.push( entry )
    }
    file( role, file){
        var entry = new Entry( { "role": role, "content":  file.data }, "content", "role", "input_file", file )
        this.conversation.push( entry )
    }
    data(){
        return {
            "model": ai_model_version.value,
            "input": this.conversation.map( ( entry ) => entry.dict )
        }
    }
    getXHR(){
        var xhr = new XMLHttpRequest();
        xhr.open( "POST", this.url );
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + api_key.value );
        return xhr
    }
    recive( data ){
        var op = data.output
        for( var i = 0; i < op.length; i++ ){
            if( op[i].type == "message" ){
                var resp = op[i].content[0]
                this.command( "assistant", resp.text )
                user_config.response( this.conversation )
                return
            }
        }
    }
    async ask( question, audio = null ){
        var xhr = this.getXHR()
        var ai = this;
        var clock = new Clock()
        this.command( "user", question, audio )
        var send = JSON.stringify( this.data() )
        xhr.onreadystatechange = function () {
            if ( xhr.readyState === 4 ) {
                clock.stop()
                var data = JSON.parse( xhr.responseText )
                console.log( "AI answer", send, data )
                if( data.error ){
                    answer.innerHTML = "<b style='color:red'>Error:</b> " + data.error.message
                    return
                }
                else ai.recive( data )
            }
        }
        xhr.send( send )
    }
}
OpenAI.versions = ["gpt-4", "gpt-4-turbo", "gpt-5"]
class GeminiEntry extends Entry{
    constructor( dict, contentKey = "text", type = "text", file = null ){
        super( dict, contentKey, "role", type, file );
    }
    get dict(){
        var dict = {}
        dict[ this.contentKey ] = this._dict[ this.contentKey ]
        return dict
    }
}
class Gemini extends OpenAI{
    constructor(){
        super()
        this.url = "https://generativelanguage.googleapis.com/v1beta/models/"
    }
    command( role, text, audio = null, type = "text" ){
        var role = role == "model" ? "model":"user"
        var entry =  new GeminiEntry( { "role": role, "text": text }, "text", type )
        entry.audio = audio
        this.conversation.push( entry )
    }
    file( role, file ){
        var role = role == "model" ? "model":"user"
        var entry = new GeminiEntry( { "role": role, "inline_data": { "mime_type": file.type, "data": file.base64 } }, "inline_data", "file", file )
        this.conversation.push( entry )
    }
    data(){
        let data = []
        let role = null
        for( var i = 0; i < this.conversation.length; i++ ){
            if( !role || role != this.conversation[ i ].role ){
                role = this.conversation[ i ].role
                data.push( { "role": role, "parts": [] } )
            }
            data[ data.length - 1 ].parts.push( this.conversation[ i ].dict )
        }
        return { "contents": data }
    }
    getXHR(){
        var xhr = new XMLHttpRequest();
        xhr.open( "POST", this.url + ai_model_version.value +":generateContent" );
        xhr.setRequestHeader( "Content-Type", "application/json" );
        xhr.setRequestHeader( "x-goog-api-key", api_key.value );
        return xhr
    }
    recive( data ){
        var msg = data.candidates[0].content.parts[0]
        var text = msg.text
        var html = text.indexOf( "```html" )
        if( html >= 0 ) {
            text = "<div markdown=1 style='white-space:pre-wrap;'>" + ( text.slice( 0, html ) ) + "</div>" + ( text.slice( html + 7 ) )
            html = text.indexOf( "```", html )
            if( html + 3 == text.length ) text = text.slice( 0, text.length - 3 )
            else if( html >= 0 ) text = ( text.slice( 0, html ) ) + "<div markdown=1 style='white-space:pre-wrap;'>" + ( text.slice( html + 3 ) ) + "</div>"
        }
        this.command( "model", text )
        user_config.response( this.conversation )
    }
}
Gemini.versions = [
    "gemini-2.5-flash",          // Sprawdzony, stabilny, szybki (Twój default)
    "gemini-3.1-flash-lite-preview", // Prawdopodobnie najszybszy obecnie dostępny
    "gemini-2.5-pro",            // Do bardzo skomplikowanych CV
    "gemini-3-pro-preview",      // Najnowsza "inteligencja" w testach
    "deep-research-preview-04-2026" // Opcja "Atomowa" do researchu (jeśli klucz pozwoli)
];
function openclose( div ){
    var open = div.className.indexOf('open')
    div.className = open > -1 ? div.className.replace( 'open', 'closed' ): div.className.replace( 'closed', 'open' )
    return false
}
configure_open.onclick = function(){ return openclose( configure ) }
files_open.onclick = function(){ return openclose( files ) }

class Audio{
    constructor(){
        this.createModel()
    }
    audio_play_response_button( conversationIndex, className = "", text = chrome.i18n.getMessage("read") ){
        var responseBotton = this.playBotton( conversationIndex )
        responseBotton.innerText = text
        responseBotton.className = className
        responseBotton.onclick = function(){return false}
        responseBotton.disabled = responseBotton.className != "" && text == chrome.i18n.getMessage("read") ? "disabled": false
    }
    change(){
        this.createModel()
    }
    destroyModel(){
        this.model = null
    }
    createModel(){
        this.destroyModel()
        if( audio.value && audio_key.value ){
            switch( audio.value ){
                case "ElevenLabs":
                    this.model = new ElevenLabs( audio_key.value )
                    this.loadVoices()
                    break;
            }
        }
    }
    loading(){
        audio_voice.innerHTML = "<option>" + chrome.i18n.getMessage("loading_response") + "</option>"
    }
    error( conversationIndex, type,  error ){
        switch( type ){
            case "Error loading voices":
                audio_voice.innerHTML = "<option>" + type + ": " + error.message + "</option>";
                break;
            case "Error generating speech":
                this.audio_play_response_button( conversationIndex, "error", error.message )
                break;
        }
        console.error( type, error );
    }
    disable(){
        ask_ai_form.className = "audio-off"
        audio_auto_play_response.disabled = "disabled"
        audio_auto_play_response_option.style.display = "none"
        audio_voice_section.style.display = "none"
        audio_key_section.style.display = "none"
        record.style.display = "none"
        if( user_config && user_config.api ) user_config.response( user_config.api.conversation, false )
    }
    enable(){
        ask_ai_form.className = "audio-on"
        audio_auto_play_response_option.style.display = "block"
        audio_voice_section.style.display = "block"
        audio_key_section.style.display = "block"
        record.style.display = "inline-block"
        audio_auto_play_response.disabled = false
        localStorage.setItem( "audio", audio.value )
        localStorage.setItem( audio.value + "audio_key", audio_key.value )
        if( user_config && user_config.api ) user_config.response( user_config.api.conversation, false )
    }
    playBotton( conversationIndex ){
        return document.getElementById( "audio-conversation-" + conversationIndex + "-botton" )
    }
    playAudio( conversationIndex ){
        return document.getElementById( "audio-conversation-" + conversationIndex )
    }
    async loadVoices() {
        this.loading()
        try {
            const voices = await this.model.getVoices()
            var options = []
            voices.forEach( voice => {
                var lang = []
                for( var i = 0; i < voice.verified_languages.length; i++ ){ if( lang.indexOf( voice.verified_languages[i].language ) == -1 ) lang.push( voice.verified_languages[i].language ) }
                options.push( "<option value='" + voice.voice_id + "'>" + voice.name + ": " + lang.join(", ").toLocaleUpperCase() + "</option>" )
            });
            audio_voice.innerHTML = options.join("\n")
            var voice = localStorage.getItem( audio.value + "audio_voice")
            if( voice ) audio_voice.value = voice
            this.enable()

        } catch ( error ) {
            this.error( 0, "Error loading voices", error );
        }
    }
    async play( conversationIndex = null ){
        if( this.model && audio_voice.value && answer.innerText ){
            if( conversationIndex === null ) conversationIndex = user_config.lastMessageIndex()
            try {
                this.audio_play_response_button( conversationIndex, "", chrome.i18n.getMessage("loading_audio") )
                var item = user_config.api.conversation[ conversationIndex ]
                var text = document.getElementById( "message-" + conversationIndex )
                item.audio = await this.model.textToSpeech( audio_voice.value, text.innerText );
                user_config.response( user_config.api.conversation, true )
                document.getElementById( "audio-conversation-" + conversationIndex ).play()

            } catch ( error ) {
                this.error( conversationIndex, "Error generating speech", error );
            }
        }
    }
    async listen( blob, text ){
        if( this.model && blob ){
            try {   
                const response = await this.model.speechToText( blob );
                question.value = response
                
            } catch ( error ) {
                question.value = "Error generating from speech: " + error;
                return
            }
            askAI( text )
        }
    }
    async autoplay(){
        if( !audio_auto_play_response.disabled ){
            if( audio_auto_play_response.checked ) this.play()
        } 
    }
}
defaultConfigTemplates = {}
defaultConfigTemplates[ chrome.i18n.getMessage("simple_question_label") ] = {
    "template": chrome.i18n.getMessage("simple_question_instruction"),
    "question": chrome.i18n.getMessage("simple_question"),
    "add_instruction_template": true,
    "add_page_contents": false,
    "files":[]
}
defaultConfigTemplates[ chrome.i18n.getMessage("article_question_label") ] = {
    "template": chrome.i18n.getMessage("article_question_instruction"),
    "question": chrome.i18n.getMessage("article_question"),
    "add_instruction_template": true,
    "add_page_contents": true,
    "files":[]
}
defaultConfigTemplates[ chrome.i18n.getMessage("job_offer_question_label") ] = {
    "template": chrome.i18n.getMessage("job_offer_question_instruction"),
    "question": chrome.i18n.getMessage("job_offer_question"),
    "add_instruction_template": true,
    "add_page_contents": true,
    "files":[chrome.i18n.getMessage("job_offer_required_attachment")]
}
class ConfigTemplates {
    fields = [ template, question, add_instruction_template, add_page_contents ]
    default = defaultConfigTemplates
    storageKey = "config-templates"
    constructor(){
        this.templateSelect = select_configuration_template
        this.createTemplate = create_config_template
        this.removeTemplate = remove_config_template
        this.templateSelect.onchange = this.apply.bind( this )
        this.createTemplate.onclick = this.create.bind( this )
        this.removeTemplate.onclick = this.remove.bind( this )
        this.apply()
    }
    get current(){
        var key = localStorage.getItem( this.storageKey + "-current" ) || Object.keys( this.default )[0]
        return key
    }
    set current( name ){
        return localStorage.setItem( this.storageKey + "-current", name )
    }
    get templates(){
        var templates = JSON.parse( localStorage.getItem( this.storageKey ) || JSON.stringify( this.default ) )
        var options = []
        var value = this.templateSelect.value || this.current
        for( var name in templates ) {
            options.push( "<option>" + name + "</option>" )
            if( !value ) value = name
        }
        this.templateSelect.innerHTML = options
        this.templateSelect.value = value
        return templates
    }
    set templates( config ){
        return localStorage.setItem( this.storageKey, JSON.stringify( config ) )
    }
    async create(){
        var key = prompt( "Provide template name", this.templateSelect.value );
        var config = {};
        for( var i = 0; i< this.fields.length; i++ ) config[ this.fields[i].name ] = this.fields[i].type == "checkbox" ? this.fields[i].checked: this.fields[i].value;
        if( window.documentManager ) {
            config.files = []
            var files = await window.documentManager.selected()
            for( var f = 0; f < files.length; f++ ){
                config.files.push( files[ f ].id )
            }
        }
        var templates = this.templates;
        templates[ key ] = config;
        this.templates = templates;
        if( this.templates[ key ] ) {
            this.templateSelect.value = key
            this.templateSelect.onchange()
        }
        return false
    }
    async apply( ){
        var templates = this.templates
        var key = this.templateSelect.value
        this.current = key
        var config = templates[ key ]
        for( var i = 0; i< this.fields.length; i++ ) {
            if( this.fields[i].type == "checkbox" ) this.fields[i].checked = config[ this.fields[i].name ]
            else this.fields[i].value = config[ this.fields[i].name ]
        }
        if( config.files && window.documentManager ){
            await window.documentManager.selected()
            //if( config.files.length && files.className.indexOf("open") < 0 || config.files.length == 0 && files.className.indexOf("closed") < 0 ) openclose( files )
            setTimeout( function(){
                for( var f = 0; f < config.files.length; f++ ) {
                    var inpt = document.getElementById( config.files[ f ] )
                    if( inpt ){
                        inpt.checked = true
                        inpt.onclick({target:inpt})
                    }
                    else{
                        window.alert( chrome.i18n.getMessage("error_missing_template_file") + ": " + config.files[ f ] + "\n" + chrome.i18n.getMessage("error_add_missing_template_file") )
                    }
                }
            }, 200 )
        }
    }
    remove( ){
        var existing = this.templates
        var key = this.templateSelect.value
        var templates = {}
        for( var name in existing ) {
            if( name != key ) templates[ name ] = existing[ name ]
        }
        this.templates = templates
        this.templateSelect.value = Object.keys( this.templates )[0]
        this.apply()
        return false
    }
}
class Config {
    constructor(){
        this.api = null
        this.page = null
        this.model = localStorage.getItem("model");
        this.api_key = localStorage.getItem( this.model + "api_key" );
        this.model_version = localStorage.getItem("model_version");
        this.template = localStorage.getItem("template");
        this.audio = localStorage.getItem("audio");
        this.audio_key = localStorage.getItem( this.audio + "audio_key" );
        this.voice = localStorage.getItem( this.audio + "audio_voice");
        this.auto_play = localStorage.getItem( "audio_auto_play_response" )
        this.response_display = localStorage.getItem( "response_display" )
        if( this.model ) ai_model.value = this.model
        if( this.api_key ) api_key.value = this.api_key
        else configure.className = 'open'

        if( this.model_version ) ai_model_version.value = this.model_version
        if( this.template ) template.value = this.template
        if( this.response_display ) response_display.value = this.response_display
        if( this.audio ) audio.value = this.audio
        else audio.value = ""
        if( this.audio_key ) audio_key.value = this.audio_key
        if( this.voice ) audio_voice.value = this.voice
        if( this.auto_play == "true" ) audio_auto_play_response.checked = true
        this.audio_configuration = new Audio()
        this.model_change()
        this.audio_provider_change()
        this.configTemplates = new ConfigTemplates()
    }
    load(){
        this.model = ai_model.value
        this.audio = audio.value
        this.api_key = api_key.value
        this.model_version = ai_model_version.value
        this.template = template.value
        this.response_display = response_display.value
        localStorage.setItem( "model", ai_model.value )
        localStorage.setItem( this.model + "api_key", api_key.value )
        localStorage.setItem( "model_version", ai_model_version.value )
        localStorage.setItem( "template", template.value )
        localStorage.setItem( "response_display", response_display.value )
        localStorage.setItem( this.audio + "audio_key", audio_key.value )
        localStorage.setItem( this.audio + "audio_voice", audio_voice.value );
        localStorage.setItem( "audio_auto_play_response", audio_auto_play_response.checked )
    }
    model_change(){
        var versions = []
        switch( ai_model.value ){
            case "GPT":
                versions = OpenAI.versions
                break;
            case "Gemini":
                versions = Gemini.versions
                break;
        }
        ai_model_version.innerHTML = ""
        for( var i = 0; i < versions.length; i++ ){
            ai_model_version.innerHTML += "<option>" + versions[i] + "</option>"
        }
        api_key.value = localStorage.getItem( ai_model.value + "api_key" );
        this.api_key = api_key.value
        this.model_version = versions[0]
        this.load_model()
    }
    load_model(){
        if( api_key.value ){
            switch( ai_model.value ){
                case "GPT":
                    this.api = new OpenAI()
                    break;
                case "Gemini":
                    this.api = new Gemini()
                    break;
                default:
                    answer.innerHTML = "<b>" + chrome.i18n.getMessage("error_pick_AI_model") + "</b>"
                    this.api = null
            }
        }
    }
    audio_provider_change(){
        this.audio = audio.value
        if( this.audio ){
            audio_key.value = localStorage.getItem( this.audio + "audio_key" )
            this.audio_key = audio_key.value
            this.audio_configuration.destroyModel()
            this.audio_configuration.disable()
            audio_key_section.style.display = "block"
            if( this.audio_key ) this.audio_configuration.createModel()
        }
        else{
            audio_key.value = ""
            this.audio_key = ""
            localStorage.setItem( "audio", "" )
            this.audio_configuration.destroyModel()
            this.audio_configuration.disable()
        }
    }
    audio_key_change(){
        this.audio_key = audio_key.value
        this.audio_configuration.disable()
        if( this.audio_key ) this.audio_configuration.createModel()
    }
    audio_voice_change(){
        this.audio_voice = audio_voice.value
        localStorage.setItem( audio.value + "audio_voice", audio_voice.value );
    }
    audio_auto_play_change(){
        localStorage.setItem( "audio_auto_play_response", audio_auto_play_response.checked )
    }
    response( conversation, UIonly = false ){
        if( conversation.length ){
            var last = conversation[ conversation.length - 1 ]
            answer.innerHTML = ""
            this.page = null
            switch( response_display.value ){
                case "conversation":
                    conversation.forEach( this.message )
                    answer.scrollTop = answer.scrollHeight - answer.clientHeight
                    break;
                case "message":
                default:
                    this.message( last, conversation.length - 3 )
                    break;
            }
            if( !UIonly && last.role == "model" ) auto_play()
        }
    }
    lastMessageIndex(){
        return this.api.conversation.length - 1
    }
    message( entry, index ){
        var d = document.createElement("div")
        d.className = "message_role_" + entry.role
        
        var p = document.createElement("div")
        p.id = "message-" + index
        p.className = "message_role_" + entry.role

        var span = document.createElement("span")
        span.className = "message_header"
        span.innerText = entry.role
        d.appendChild( span )
        d.appendChild( p )
        answer.appendChild( d )
        
        switch( entry.type ){
            case "file":
                p.innerText = entry.file.name
                p.style.cursor = "pointer"
                p.click = function( event ){ entry.file.download() }
                break
            case "page":
                p.innerText = chrome.i18n.getMessage("page_context") + " " + entry.content.split("\n",1);
                user_config.page = entry
                break
            default:
                p.innerHTML = entry.content
                if( entry.audio == null && user_config.audio_configuration.model != null ){
                    var audio = document.createElement("button")
                    audio.id = "audio-conversation-" + index + "-botton"
                    audio.innerHTML = chrome.i18n.getMessage("audio")
                    audio.title = chrome.i18n.getMessage("load_audio")
                    span.appendChild( audio )
                    audio.onclick = function(){ return read( index ) }
                }
                else if( entry.audio ){
                    var audio = document.createElement("audio")
                    audio.controls = true
                    audio.id = "audio-conversation-" + index
                    audio.className = "audioPlayer"
                    audio.src = entry.audio
                    span.appendChild( audio )
                }
                if( entry.role == "model" ){
                    var download = document.createElement("a")
                    download.className = "download-conversation"
                    download.innerHTML = chrome.i18n.getMessage("download")
                    download.title = chrome.i18n.getMessage("download_title")
                    if( user_config.page ){
                        var meta = user_config.page.content.split( "\n",2 )
                        download.href = 'data:text/html;charset=utf-8,' + encodeURIComponent( "<html><head><meta charset=\"UTF-8\"></head><body>" + "<a href='" + meta[1] + "'>" + meta[0] + "</a></br></br>" + entry.content + "</body></html>" );
                        download.download = meta[0] + ".html"
                    }
                    else{
                        download.href = 'data:text/html;charset=utf-8,' + encodeURIComponent( "<html><head><meta charset=\"UTF-8\"></head><body>" + entry.content + "</body></html>" );
                        download.download = "response.html"
                    }
                    d.prepend( download )
                    break
                }

        }
        if( index == user_config.lastMessageIndex() && entry.role == "user" ) {
            var d = document.createElement("div")
            d.className = "message_role_" + entry.role
            var message_role_model_header = document.createElement("span")
            message_role_model_header.className = "message_header"
            message_role_model_header.innerText = chrome.i18n.getMessage("model_chat_header")
            var message_role_model_loader = document.createElement("div")
            message_role_model_loader.className = "message_role_model"
            message_role_model_loader.innerText = chrome.i18n.getMessage("loading_response")
            d.appendChild( message_role_model_header )
            d.appendChild( message_role_model_loader )
            answer.appendChild( d )
        }
    }
}
var user_config = new Config()
var ai_model_change = user_config.model_change.bind( user_config )
var audio_provider_change = user_config.audio_provider_change.bind( user_config )
var audio_key_change = user_config.audio_key_change.bind( user_config )
var audio_auto_play_change = user_config.audio_auto_play_change.bind( user_config )
var ai_model_api_key_change = user_config.load_model.bind( user_config )
for( var i = 0; i < audio.length; i++ ) { audio[i].onclick = audio_provider_change }
audio_auto_play_response.onclick = audio_auto_play_change
audio_key.onchange = audio_key_change
api_key.onchange = ai_model_api_key_change
for( var i = 0; i < ai_model.length; i++ ) { ai_model[i].onclick = ai_model_change }
var audio_play = function(){ user_config.audio_configuration.play(); return false; }
var auto_play = function(){ user_config.audio_configuration.autoplay(); return false; }

function askAI( audio = null ){
    chrome.tabs.query( { active: true, currentWindow: true }, async ( tabs ) => { 
        if( user_config.api != null ){
            user_config.load()
            if( add_instruction_template.checked ) {
                user_config.api.command( "developer", template.value )
                add_instruction_template.checked = false
            }
            if( add_page_contents.checked ) {
                user_config.api.command( "developer", await chrome.tabs.sendMessage( tabs[0].id, { type: "content" } ), null, "page" )
                add_page_contents.checked = false
            }
            if( window.documentManager ) {
                var files = await window.documentManager.selected()
                for( var s = 0; s < files.length; s++ ){
                    user_config.api.file( "developer", files[s]  )
                }
            }
            user_config.api.ask( question.value, audio )
            user_config.response( user_config.api.conversation, true )
        }
        else answer.innerHTML = "<b style='color:red'>" + chrome.i18n.getMessage("error") + ":</b> "  + chrome.i18n.getMessage("error_AI_model_and_key")
    })
    return false
}
function recordQuestion(){

    if( audioRecorder == null ){
        audioRecorder = new AudioRecorder( function(error){
            console.log("Error:", error);
            record.className = ""
            question.value = chrome.i18n.getMessage("allow_audio")
            chrome.tabs.create({ url: 'popup-audio.html', windowId: null });
        })
        record.className = "red"
        question.value = chrome.i18n.getMessage("loading_question_audio")
    }
    else{
        audioRecorder.stop( function( response ){
            user_config.audio_configuration.listen( response.blob, response.text )
            question.value = response.text
            audioRecorder = null;
            record.className = ""
        })
    }
    return false
}
function read( conversationIndex ){
    if( user_config.audio_configuration ) user_config.audio_configuration.play( conversationIndex )
    return false

}
button.onclick = function (){ 
    let ret = askAI( null )
    setTimeout( function(){question.value = ""}, 200 )
    return ret
}
question.onkeydown = function( event ){ 
    if( event.key == "Enter" ) {
        if( event.altKey ) {
            question.value += "\n"
        }
        else {
            askAI( null )
            setTimeout( function(){question.value = ""}, 200 )
        }
    }
}
record.onclick = recordQuestion
for( var i = 0; i < response_display.length; i++ ) { response_display[i].onclick = function(){ if( user_config.api ) { user_config.response( user_config.api.conversation ) } } }
