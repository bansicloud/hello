var maxCALLERS = 7;
var isInIFrame = (window.location != window.parent.location);
var protocol = 'http'+((location.hostname == 'localhost') ? '' : 's')+'://';
var appURL = protocol+location.hostname + ((location.hostname == 'localhost') ? ':3000' : '') +'/'; 
var urlvars = {};
var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
  function(m,key,value) { urlvars[key] = value; });

function connect() {
  if(isInIFrame && urlvars.backgroundColor){
    var allBoxes = document.getElementsByClassName('divHolder');
    allBoxes = [].slice.call(allBoxes);
    allBoxes.map(function(item, key){
      item.style.backgroundColor = urlvars.backgroundColor;
    });
  }

  easyrtc.dontAddCloseButtons();
  easyrtc.joinRoom(getRoomName());
  easyrtc.setRoomOccupantListener(callEverybodyElse);
  easyrtc.easyApp("easyrtc.multiparty", "selfVideo", ["callerVideo1", "callerVideo2", "callerVideo3", "callerVideo4", "callerVideo5", "callerVideo6", "callerVideo7"], connectionSuccess, connectionFailure);
  setRoomName();
  document.getElementById('copyURL').addEventListener('click', function(){
    setClipboardText(appURL+getRoomName());
    easyrtc.showError('','URL copied.');
  });
  document.getElementById('closeintro').addEventListener('click', function(){
    document.getElementById('fixed').style.display = 'none';
  });
  if(urlvars.key){
    getRoomDetails('room='+getRoomName()+'&key='+urlvars.key, function(response){
      if(response.status == true && response.roomStatus){
        var lockbtn = document.getElementById('lockBtn');
        lockbtn.style.display = 'block';
        if(response.roomStatus == 'locked'){
          lockbtn.className = 'locked';
        }else if(response.roomStatus == 'unlocked'){
          lockbtn.className = 'unlocked';
        }
        lockbtn.addEventListener('click', function(e){
          var currentstatus = lockbtn.className;
          if(currentstatus == 'locked') var newLockStatus = 'unlocked';
          else var newLockStatus = 'locked';
          console.log(newLockStatus);
          lockbtn.className = newLockStatus;
          var r = new XMLHttpRequest();
          r.open('GET', '/private/lock?room='+getRoomName()+'&key='+urlvars.key+'&lock='+newLockStatus, true);
          r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
          r.send();  

        });
      }
    });
  }
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
  if(isInIFrame === false)
  document.getElementById('fixed').style.display = 'block';
}
function connectionFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}
function getRoomName(){
  var roomName = location.pathname.substring(1);
  if(roomName == '') {
    var roomName = randomRoom();
    var newurl = appURL + roomName;
    window.history.pushState({url: newurl}, roomName, newurl);
  }
  return roomName;
}
var randomRoom = function () {
  return Math.random().toString(36).substr(2, 10);
};
function setRoomName(){
  document.getElementById('roomURL').innerHTML = 'itshello.herokuapp.com/'+getRoomName();
  document.getElementById('roomID').innerHTML = '/'+getRoomName();
}
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
function getRoomDetails(queryParam, cb){
  var r = new XMLHttpRequest();
  r.open('GET', '/private/check?'+queryParam, true);
  r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  r.onreadystatechange = function () {
    if (r.readyState != 4 || r.status != 200) return;
    var response = (JSON.parse(r.responseText));
    cb(response);
  };
  r.send();  
}
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

var roomAvailable = false;
if(document.getElementById('formRoomName')){
  document.getElementById('formRoomName').addEventListener('keyup', function(e){
    var roomId = document.getElementById('formRoomName').value;
    var validRoom = roomId.match(/^[a-zA-Z0-9\-_]+$/);
    if(validRoom && validRoom.length > 0){
      getRoomDetails('room='+document.getElementById('formRoomName').value, function(response){
        var roomPrivateURL = document.getElementById('roomPrivateURL');
        if(response.status == false) {
          roomPrivateURL.style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABXElEQVRIS7WUOU7DQBSG/zd2REWPQgscACpEwyIjgRASNheAUCG4CwXQslSIIpKb2CmwXcMJKLhDqG3PoIniAN5iT+wpR6Pve/M2QsuHWuajUcGWfby4EIU9z3JuksAbE0h4JwqHBGwK4DawnGspaUTwF/6bcrr3zcHV3IJ8+EQjxN1cgjI4B+caaRfKgipwzxw8KAmqwpWKPAtOoF5guY+ZNt19PVoWWmwT45feyfA9bwDrwqc/mMADACsc+NYY309LVOBjgWEb3TjSAwGsJlFLiQ5hvFnuh7xThY8FO/0DHwLbmZRwPhKkGWFH/0wmNP1GtiIJOg9O3aeinUZ7/cO1KBY+Y+jmScDYF4ANFfi0BqWSnNCqRJ7poqoSCWfEznzTea6y6v8N2ixJXXjuoBVJVOCFk5yWqMJLV0UiAeNLdXKerkvpspOSGHw9MN2XKgXNe6O0TevIWhf8AATd5n2g7pqQAAAAAElFTkSuQmCC)';
          roomAvailable = true;
        }else{
          roomPrivateURL.style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAgCAYAAAAIXrg4AAABcElEQVRIS+2WTXKCQBCFX3OBZC+eJXiSoCeIJqlKKn8ak2jl9wbgTcSziHuTAzgpqAJnZJhuFrqSHczwvu6efg2EPV+0Z30cAWyFD1+iVdCbboB1O4mmbHjahlUQTpSiP38RT/T3jAyWnfCdFF1nGxToVgrJxUE3uTCpO38+eysgJWAZdD8IuNLpEoghvn353k/i15xXPEuD7ieAy92yuCA14pnEg5/ELwYgu0nPel8gNZBAJOIVgBRSK67o0V9E49pDLsvVOf+G8vq2TDxsTsoDNQ6sKm7NgIPYWpcIT615/Gxdc/V6GoQ/AF249rjEnRlsu6seQlDDVjIbOQPg3OroFpEZnbPIJV4ExpmxFiARl0CsAJeJAJw2cXwFIHFoE8cbgCYOlUJKQBNxzoz6wWvTtNrvnIny2WUZK7o/jBLpzpWI28yoQKN2Eg0rHxx9MwFrzqG7Bs2CU/B+dXHRqOCczq0f/q+Ci6jp+jEDtmL/e0fSIeny4ewAAAAASUVORK5CYII=)';
          roomAvailable = false;
        }
      });
    }else{
      roomPrivateURL.style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAgCAYAAAAIXrg4AAABcElEQVRIS+2WTXKCQBCFX3OBZC+eJXiSoCeIJqlKKn8ak2jl9wbgTcSziHuTAzgpqAJnZJhuFrqSHczwvu6efg2EPV+0Z30cAWyFD1+iVdCbboB1O4mmbHjahlUQTpSiP38RT/T3jAyWnfCdFF1nGxToVgrJxUE3uTCpO38+eysgJWAZdD8IuNLpEoghvn353k/i15xXPEuD7ieAy92yuCA14pnEg5/ELwYgu0nPel8gNZBAJOIVgBRSK67o0V9E49pDLsvVOf+G8vq2TDxsTsoDNQ6sKm7NgIPYWpcIT615/Gxdc/V6GoQ/AF249rjEnRlsu6seQlDDVjIbOQPg3OroFpEZnbPIJV4ExpmxFiARl0CsAJeJAJw2cXwFIHFoE8cbgCYOlUJKQBNxzoz6wWvTtNrvnIny2WUZK7o/jBLpzpWI28yoQKN2Eg0rHxx9MwFrzqG7Bs2CU/B+dXHRqOCczq0f/q+Ci6jp+jEDtmL/e0fSIeny4ewAAAAASUVORK5CYII=)';
    }
  });
}
if(document.getElementById('payButton')){
  document.getElementById('payButton').addEventListener('click', function(e){
    var email = document.getElementById('formEmail').value;
    var roomId = document.getElementById('formRoomName').value;
    if(validateEmail(email)){
      var validRoom = roomId.match(/^[a-zA-Z0-9\-_]+$/);
      if(validRoom && validRoom.length > 0 && roomAvailable == true){
        document.getElementById('formError').innerHTML = '';
        document.getElementById('formPrivate').submit();
      }else{
        document.getElementById('formError').innerHTML = 'Invalid Room';
      }
    }else{
      document.getElementById('formError').innerHTML = 'Invalid Email address';
    }
  });
}