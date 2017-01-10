var maxCALLERS = 3;
function connect() {
  easyrtc.dontAddCloseButtons();
  easyrtc.joinRoom(getRoomName());
  easyrtc.setRoomOccupantListener(callEverybodyElse);
  easyrtc.easyApp("easyrtc.multiparty", "selfVideo", ["callerVideo1", "callerVideo2", "callerVideo3"], connectionSuccess, connectionFailure);
  document.getElementById('copyURL').addEventListener('click', function(){
    setClipboardText(location.href);
  });
}
function callEverybodyElse(roomName, otherPeople) {
  easyrtc.setRoomOccupantListener(null); 
  var list = [];
  var connectCount = 0;
  for(var easyrtcid in otherPeople ) {
    list.push(easyrtcid);
  }
  function establishConnection(position) {
    function callSuccess() {
      connectCount++;
      if( connectCount < maxCALLERS && position > 0) {
        establishConnection(position-1);
      }
    }
    function callFailure(errorCode, errorText) {
      easyrtc.showError(errorCode, errorText);
      if( connectCount < maxCALLERS && position > 0) {
        establishConnection(position-1);
      }
    }
    easyrtc.call(list[position], callSuccess, callFailure);
  }
  if( list.length > 0) {
    establishConnection(list.length-1);
  }
}
function connectionSuccess(easyrtcid) {
  document.getElementById('selfVideo').style.visibility = 'visible';
  setTimeout(function(){
    var videoHeight = document.getElementById('selfVideo').offsetHeight;
    console.log(videoHeight);
    for (var i = 0; i < document.getElementsByClassName('callerVideo').length; i++) {
      document.getElementsByClassName('callerVideo')[i].style.height = videoHeight+'px';
    }
  }, 100);
}
function connectionFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}
function getRoomName(){
  var roomName = location.pathname.substring(1);
  if(roomName == '') {
    var roomName = randomRoom();
    var newurl = location.href +'/'+ roomName;
    window.history.pushState({url: newurl}, roomName, newurl);
  }
  return roomName;
}
var randomRoom = function () {
  return Math.random().toString(36).substr(2, 10);
};
function setClipboardText(text){
    var id = "mycustom-clipboard-textarea-hidden-id";
    var existsTextarea = document.getElementById(id);
    if(!existsTextarea){
        var textarea = document.createElement("textarea");
        textarea.id = id;
        textarea.style.position = 'fixed';
        textarea.style.top = 0;
        textarea.style.left = 0;
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.padding = 0;
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        document.querySelector("body").appendChild(textarea);
        existsTextarea = document.getElementById(id);
    }
    existsTextarea.value = text;
    existsTextarea.select();
    try {
        var status = document.execCommand('copy');
        if(!status){
            console.error("Cannot copy text");
        }else{
            console.log("URL copied to clipboard");
        }
    } catch (err) {
        console.log('Unable to copy.');
    }
}