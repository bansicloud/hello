# About Hello
Hello is a 100% peer-to-peer video communication solution that does not have any signaling server. In other words, the server is purely for serving the HTML page & its assets and the video communication is 100% peer-to-peer using WebRTC.

## Why is there a manual step involved?
WebRTC is a peer-to-peer protocol for the web, but it does not have any mechanism for peer discovery. So there is a manual step involved to exchange your details, so that you can connect with your peer directly.

## What details am I exchanging with my peer?
You will be exchanging your [SDP](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate) & [ICE Candidates](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate) which is necessary for your peer to connect to you. We share this details by converting it to a base64 encoded string, so that it can be transmitted through URL.

### For trying out locally
Run the following commands
```
git clone https://github.com/vasanthv/hello.git

cd hello

npm install

npm start
```

Point your browser to http://localhost:3000/