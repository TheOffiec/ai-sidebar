console.log("Inject script allowing to recive page content and audio");

(function(){

  chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.type === "content") sendResponse( document.title + "\n" + window.location.href + "\n\n" + document.body.innerText )
      }
  )
})()
