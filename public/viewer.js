const remoteVideo = document.getElementById('remoteVideo');
const statusText = document.getElementById('status');

let socket;
let peerConnection;

const iceServers = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

function connectSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

  socket = new WebSocket(`${protocol}//${location.host}`);

  socket.onopen = () => {
    statusText.textContent = 'Connected. Waiting for phone...';
  };

  socket.onclose = () => {
    statusText.textContent = 'Connection closed.';
  };

  socket.onmessage = async event => {
    const message = JSON.parse(event.data);

    if (message.type === 'offer') {
      await handleOffer(message.offer);
    }

    if (message.type === 'candidate') {
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(message.candidate);
        } catch (error) {
          console.error(error);
        }
      }
    }
  };
}

async function handleOffer(offer) {
  peerConnection = new RTCPeerConnection(iceServers);

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
    statusText.textContent = 'Live camera connected.';
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({
          type: 'candidate',
          candidate: event.candidate,
        }),
      );
    }
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  socket.send(
    JSON.stringify({
      type: 'answer',
      answer,
    }),
  );
}

connectSocket();
