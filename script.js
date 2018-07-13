const peerConfig = {
    'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun.stunprotocol.org:3478'},
        {'urls': 'stun:stun.sipnet.net:3478'},
        {'urls': 'stun:stun.ideasip.com:3478'},
        {'urls': 'stun:stun.iptel.org:3478'}
    ]
};
let peerConnection, localStream;
const remoteMessage = {sdp: null, ice: []};

const onGetUserMediaSuccess = (stream) => document.getElementById('selfVideo').srcObject = stream;
const errorHandler = (error) => console.error(error);

if(navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    })
    .then((stream) => {
        localStream = stream;
        console.log(stream);
        onGetUserMediaSuccess(stream);
    })
    .catch(errorHandler);
} else {
    alert('Your browser does not support getUserMedia API');
}

const setUpPeerConnection = () => {
    peerConnection = new RTCPeerConnection(peerConfig);
    peerConnection.onicecandidate = (event) => {
        if(event.candidate != null) remoteMessage.ice.push(event.candidate);
        else {
            // Completed the gathering of ICE candidate.
            console.log(remoteMessage);
            console.log(JSON.stringify(remoteMessage));
        }
    }
    peerConnection.ontrack = (event) => {
        console.log('got remote stream');
        console.log(event.streams[0]);
        document.getElementById('callerVideo').srcObject = event.streams[0];
    };
    peerConnection.addStream(localStream);
    peerConnection.ondatachannel = errorHandler;
    console.log(peerConnection);
}

const createOffer = () => {
    peerConnection.createOffer().then(setLocalDescription).catch(errorHandler);
    console.log(peerConnection);
}

const createDataChannel = () => {
    const sendChannel = peerConnection.createDataChannel("sendChannel");
    sendChannel.onopen = errorHandler;
    sendChannel.onclose = errorHandler;
    sendChannel.send('Hello');
}

const setLocalDescription = (description) => {
    console.log('got description');
    // Got local description
    peerConnection.setLocalDescription(description).then(function() {
      remoteMessage.sdp = peerConnection.localDescription;
    }).catch(errorHandler);
};


/* 

peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
    // Only create answers in response to offers
    if(signal.sdp.type == 'offer') {
      peerConnection.createAnswer().then(setLocalDescription).catch(errorHandler);
    }
  }).catch(errorHandler);



signal.ice.forEach(ice => peerConnection.addIceCandidate(new RTCIceCandidate(ice)).then(errorHandler).catch(errorHandler))

*/