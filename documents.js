

class StorageFile {
    /**
     * Creates storable file for DocumentManager.
     * @param {DocumentManager} manager
     * @param {dict} file
     * @param {string} description
     */
    constructor( manager, file, description = null ) {
        this.manager = manager
        this.file = file;
        this.blob = null;
        this.base64 = null
        this.loaded = null
        this.error = null
        this._description = file.description ? file.description: description;
        this._id = file.id ? file.id: this.description + "-" + this.name + ( new Date().toISOString() );
    }
    /**
     * Downloads file.
     * @param {StorageFile} file
     */
    download( file = null ){
        if( !file ) file = this
        if( file.blob ) chrome.downloads.download({
            url: URL.createObjectURL( file.blob ),
            filename: file.name
        })
        else file.load( file.download )
    }
    /**
     * Saves file.
     * @param {Blob|File} blob
     */
    save( blob = null ){
        let id = this.id
        if( !blob ) blob = this.blob
        else this.blob = blob
        this.database.transaction("files", "readwrite")
            .objectStore("files").put( { id, blob } );
    }
    load( callback ){
        let id = this.id
        let file = this
        var loaded = async function( event ){
            file.blob = event.target.result.blob
            file.base64 = file.blob.split(',')[1];
            file.loaded = true;
            callback( file )
        }
        this.database.transaction("files", "readonly")
            .objectStore("files").get( id ).onsuccess = loaded
    }
    get database() { return this.manager.database }
    get name() { return this.file.name }
    set name( name ) { this.file.name = name }
    get description() { return this._description }
    set description( description ) { this._description = description }
    get type() { return this.file.type }
    get size() { return this.file.size }
    get data() { return this.blob }
    get id() { return this._id }
    get dict() { 
        return {
            "name": this.name,
            "type": this.type,
            "id": this.id,
            "description": this.description,
            "size": this.size
        }
    }
}

/**
 * documents.js
 * Simple library for receiving and handling files in a Chrome extension context.
 * Usage: Import and use DocumentManager to handle file uploads and processing.
 */

class DocumentManager {
    DBname = "DocumentManager"
    DBstorage = "files"
    DBkeyPath = "id"
    headers = {
        "description": chrome.i18n.getMessage("file_description_defaut"), 
        "name": chrome.i18n.getMessage("file_name_defaut")
    } // placeholder="e.g. HR manager"
    /**
     * Creates DocumentManager that manages file manager ui placed in the contenair passed as the argument.
     * @param {HTMLDivElement} filesList
     */
    constructor( filesList, newFile ) {
        this.filesList = filesList
        this.files = []
        let loadDatabase = this.loadDatabase.bind( this )
        let DBkeyPath = this.DBkeyPath
        let DBstorage = this.DBstorage
        this._headers = Object.keys( this.headers )
        this._selected = {}
        newFile.onchange = function( event ){
            //let fileDescription = document.getElementById( "file-new-description" )
            window.documentManager.receiveFiles( Array.from( event.target.files ), null );
        }
        let request = indexedDB.open( this.DBname, 1);
        request.onupgradeneeded = (event) => {
            event.target.result.createObjectStore( DBstorage, { keyPath: DBkeyPath });
            loadDatabase( event.target.result );
        };
        request.onsuccess = ( event ) => {
            loadDatabase( event.target.result );
        };
        
    }
    /**
     * Removes files by id.
     * @param {string} id
     */
    remove( id ){
        console.log("remove", id)
        for( var i = 0; i< this.files.length; i++ ){
            if( this.files[i].id == id ){
                console.log("remove existing", id)
                this.files.splice( i, 1 )
                this.saveIndex()
                try{
                    this.database.deleteObjectStore( id )
                }
                catch( error ){
                    console.log( error )
                }
                break
            }
        }
    }
    /**
     * Updates files by id.
     * @param {string} id
     */
    update( id ){
        console.log("update", id)
        for( var i = 0; i< this.files.length; i++ ){
            if( this.files[i].id == id ){
                console.log("update existing", id)
                var file = this.files[i]
                file.description = document.getElementById( "file-" + id + "-description" ).value
                this.saveIndex()
                break
            }
        }
        return false
    }
    /**
     * Loads files by id.
     * @param {string} id
     */
    load( id ){
        console.log("load", id)
        if( this._selected[ id ] ) this._selected[ id ] = null
        else{
            for( var i = 0; i< this.files.length; i++ ){
                if( this.files[i].id == id ){
                    console.log("load existing", id)
                    this._selected[ id ] = this.files[i]
                    this._selected[ id ].load( console.log )
                    break
                }
            }
        }
    }
    /**
     * Get selected fields.
     * @returns {Array[StorageFile]}
     */
    async selected(){
        var selected = []
        for( var id in this._selected ){
            if( this._selected[ id ] ) {
                selected.push( this._selected[ id ] )
                var box = document.getElementById( id )
                box.checked = false
                box.parentElement.className = ""
            }
        }
        this._selected = {}
        return selected
    }
    /**
     * Renders UI.
     */
    render(){
        let prev = this.filesList.getElementsByClassName("file-checked")
        let check = []
        for( var p = 0; p < prev.length; p++ ){
            if( prev[p].checked ) check.push( prev[p].value )
        }
        this.filesList.innerHTML = ""
        // headers
        //this.file( Object.fromEntries( this._headers.map( item => [ item, item.toLocaleUpperCase() ] ) ) )
        // files
        for( var i = 0; i < this.files.length; i++ ) this.file( this.files[i] )
        // add new file
        /*var headers = this.headers
        var formated = Object.fromEntries( this._headers.map( item => [ item, headers[ item ] ] ) )
        formated.id = "new"
        this.file( formated ) */
        for( var c = 0; c < check.length; c++ ){
            document.getElementById( check[c] ).click()
        }
    }
    /**
     * Renders file UI.
     * @param {StorageFile} file
     */
    file( file ){
        let check = document.createElement("div");
        this.filesList.appendChild( check )
        let header = document.createElement("div");
        if( "DESCRIPTION" == file.description ) {
            header.innerText = chrome.i18n.getMessage("file_description" )
        }
        else {
            let input = document.createElement("input");
            input.type =  "text"
            input.value = file.description
            input.name = "file[" + file.id + "][description]"
            input.id = "file-" + file.id + "-description"
            input.onchange = function( event ){ window.documentManager.update( file.id ) }
            header.appendChild( input )
        }
        this.filesList.appendChild( header )
        let actions = document.createElement("div");
        this.filesList.appendChild( actions )

        if( file.id && file.id != "new" ){

            let checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.name = "queryFiles"
            checkbox.value = file.id
            checkbox.id = file.id
            checkbox.className = "file-checked"
            checkbox.onclick = function( event ){ 
                if( event.target.checked ){
                    event.target.parentElement.className = "selected"
                    window.documentManager.load( event.target.value )
                }
                else{
                    event.target.parentElement.className = ""
                }
            }
            check.appendChild( checkbox )

            let remove = document.createElement("button")
            remove.innerText = "-"
            remove.value = file.id
            remove.title = "remove"
            remove.onclick = function( event ){ window.documentManager.remove( event.target.value ) }
            actions.appendChild( remove )

        }
    }
    /**
     * Loads File storage.
     * @param {IDBDatabase} database
     */
    loadDatabase( database ){
        this.database = database
        this.files = JSON.parse( localStorage.getItem( this.DBname ) || '[]' );
        for( var i = 0; i < this.files.length; i++ ){
            this.files[ i ] = new StorageFile( this, this.files[ i ] )
        }
        this.render()
    }
    
    saveIndex( clickId = null ){
        localStorage.setItem( this.DBname, JSON.stringify( this.files.map( value => value.dict ) ) )
        this.render()
        if( clickId ) document.getElementById( clickId ).click()
    }
    
    /**
     * Receives files from an input element or drag-and-drop event.
     * @param {FileList|Array<File>} fileList
     */
    receiveFiles( fileList, description = null ) {
        if (!fileList) return;
        const filesArray = Array.from(fileList);
        filesArray.forEach(file => {
            let fileOb = new StorageFile( this, {
                name: file.name,
                type: file.type
            }, description == null ? file.name: description )
            const reader = new FileReader();
            reader.onload = e => {
                fileOb.save( e.target.result )
                fileOb.manager.files.push( fileOb );
                fileOb.manager.saveIndex(fileOb.id)
            }
            reader.readAsDataURL(file);
        });
    }


    /**
     * Clears all stored files.
     */
    clearFiles() {
        this.files = [];
        this.saveIndex()
    }
}

// Export as global for popup.js or content.js usage
window.documentManager = new DocumentManager( document.getElementById('files-list'), document.getElementById('new-file') );
