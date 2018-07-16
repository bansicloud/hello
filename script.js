const peerConfig = {
    'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun.stunprotocol.org:3478'},
        {'urls': 'stun:stun.sipnet.net:3478'},
        {'urls': 'stun:stun.ideasip.com:3478'},
        {'urls': 'stun:stun.iptel.org:3478'}
    ]
};
let peerConnection, signalChannel, localStream, signal, isPeer;
const remoteMessage = {sdp: null, ice: []};
const isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

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
const signalMsgHandler = async event => {
    console.log(event);
    signal = JSON.parse(event.data);
    isPeer && peerConnection.addStream(localStream);
    await setPeerDescription(signal);
    await setPeerIceCandidates(signal);
}
const msgHandler = event => {};

const setUpPeerConnection = () => {
    peerConnection = new RTCPeerConnection(peerConfig);
    peerConnection.onicecandidate = (event) => {
        if(event.candidate != null) remoteMessage.ice.push(event.candidate);
        else {
            // Completed the gathering of ICE candidate.
            if(signalChannel){
                if(signalChannel.readyState === 'open'){
                    signalChannel.send(JSON.stringify(remoteMessage));
                    return;
                }
            }
            const signalHash = LZString.compressToBase64(JSON.stringify(remoteMessage));
            //TODO: create URL here
            //TODO: set it as room URL
            if(isPeer){
                console.log(signalHash);                    
            }else{
                console.log(window.location.href+'#'+signalHash);
            }
        }
    }
    peerConnection.ontrack = (event) => {
        console.log('got remote stream');
        console.log(event.streams[0]);
        document.getElementById('callerVideo').srcObject = event.streams[0];
    };
    peerConnection.ondatachannel = (event) => {
        console.log(event);
        const channel = event.channel;
        if(channel.label == 'signal'){
            signalChannel = event.channel;
            signalChannel.onmessage = signalMsgHandler;
        }else if(channel.label == 'messages'){
            msgChannel = event.channel;
            msgChannel.onmessage = msgHandler;
        }
    };
}
const addStream = (stream) => peerConnection.addStream(stream);
const createOffer = async () => {
    const description = await peerConnection.createOffer({offerToReceiveAudio: 1});
    await setLocalDescription(description);
}

const createDataChannel = (name, msgHandler) => {
    if(name === "signal"){
        signalChannel = peerConnection.createDataChannel(name); 
        signalChannel.onmessage = msgHandler;
    }else if (name === "messages"){
        msgChannel = peerConnection.createDataChannel(name);
        msgChannel.onmessage = msgHandler;
    }
}
const sendMsgDataChannel = (channel, msg) => channel.send(msg);

const setLocalDescription = async (description) => {
    await peerConnection.setLocalDescription(description);
    remoteMessage.sdp = peerConnection.localDescription;
};

const setPeerDescription = async (signal) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    // Only create answers in response to offers
    console.log(peerConnection);
    if(signal.sdp.type == 'offer') {
        const description = await peerConnection.createAnswer();
        isSafari && setTimeout(() => peerConnection.onicecandidate({candidate: null}), 1000);
        await setLocalDescription(description);
    }
};

const setPeerIceCandidates = async (signal) => {
    const addIceCandidatePromises = signal.ice.map(ice => peerConnection.addIceCandidate(new RTCIceCandidate(ice)));
    await Promise.all(addIceCandidatePromises);
}

const onPeerSignal = async (signalMsg) => {
    signal = JSON.parse(LZString.decompressFromBase64(signalMsg));
    await setPeerDescription(signal);
    await setPeerIceCandidates(signal);
    peerConnection.addStream(localStream);
    // createDataChannel('messages', msgHandler);
    await createOffer();
    isSafari && setTimeout(() => peerConnection.onicecandidate({candidate: null}), 1000);
}

const startApp = async () => {
    peerConnection || setUpPeerConnection();

    if(!isPeer){
        createDataChannel('signal', signalMsgHandler);
        await createOffer();
        isSafari && setTimeout(() => peerConnection.onicecandidate({candidate: null}), 1000);
    }else{
        await setPeerDescription(signal);
        await setPeerIceCandidates(signal);
    }
}

/* 

peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
    // Only create answers in response to offers
    if(signal.sdp.type == 'offer') {
        peerConnection.createAnswer().then(setLocalDescription).catch(errorHandler);
    }
}).catch(errorHandler);



signal.ice.forEach(ice => peerConnection.addIceCandidate(new RTCIceCandidate(ice)).then(errorHandler).catch(errorHandler))

*/

// if the location.hash is present, treat as peer
if(window.location.hash.length > 1){
    signal = JSON.parse(LZString.decompressFromBase64(window.location.hash.substring(1)));
    isPeer = true;
}
startApp();