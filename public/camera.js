const video = document.getElementById('localVideo');
const statusText = document.getElementById('status');
const startButton = document.getElementById('startCamera');

let socket;
let peerConnection;
let localStream;

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
    statusText.textContent = 'Connected. Ready to start camera.';
  };

  socket.onclose = () => {
    statusText.textContent = 'Connection closed.';
  };

  socket.onmessage = async event => {
    const message = JSON.parse(event.data);

    if (message.type === 'answer') {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.answer),
      );

      statusText.textContent = 'Camera is streaming.';
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

async function startCamera() {
  try {
    statusText.textContent = 'Requesting camera permission...';

    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
      audio: false,
    });

    video.srcObject = localStream;

    peerConnection = new RTCPeerConnection(iceServers);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

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

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    socket.send(
      JSON.stringify({
        type: 'offer',
        offer,
      }),
    );

    statusText.textContent = 'Waiting for PC viewer...';
  } catch (error) {
    console.error(error);

    statusText.textContent =
      'Camera permission was denied or camera is unavailable.';
  }
}

startButton.addEventListener('click', startCamera);

connectSocket();
