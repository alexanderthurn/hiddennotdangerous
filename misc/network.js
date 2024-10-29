var peer;
var tlog
var peerIdDefault

const iceServers = [
    {
      urls: 'stun:stun.relay.metered.ca:80',
    },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'edd2a0f22e4c5a5f1ccc546a',
      credential: 'bW5ZvhYwl1tPH6o0',
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'edd2a0f22e4c5a5f1ccc546a',
      credential: 'bW5ZvhYwl1tPH6o0',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'edd2a0f22e4c5a5f1ccc546a',
      credential: 'bW5ZvhYwl1tPH6o0',
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'edd2a0f22e4c5a5f1ccc546a',
      credential: 'bW5ZvhYwl1tPH6o0',
    },
  ]

/* https://peerjs.com/docs/#start */

function isMaster() {
  return isMaster(peer)
}

function getPeerId() {
  return peer.id
}

function isMaster(peer) {
  return peer && peer.open && peer.id === peerIdDefault
}

function getConnectedPeers(peer) {
  return Object.entries(peer.connections)
  .map((k) => k[1][0]).filter(p => p && p.peerConnection.connectionState !== 'failed')
}

function sendJsonToPeers(jsonObject, peers) {
  tlog('sending msg to ' + peers.length + ' peer(s): ' + JSON.stringify(jsonObject));
  peers.forEach((k) => {k.send(jsonObject)});
}

function sendJsonToAllPeers(jsonObject) {
  sendJsonToPeers(jsonObject, getConnectedPeers(peer))
}

function initNetwork(roomName, options) {
  logMethod = options.logMethod
  dataReceivedMethod = options.dataReceivedMethod

  peerIdDefault = roomName
  tlog = logMethod
  tlog('starting peer: ' + peerIdDefault);
  peer = new Peer(peerIdDefault, {debug: 3, config: {iceServers: iceServers,}});
  peer.on('close', () => tlog('peer closed'))
  peer.on('disconnected', () => tlog('peer disconnected'))
  peer.on('open', function (id) { tlog('peer open: ' + id); });
  peer.on('connection', function (conn) {
    tlog('peer connection: ' + conn.peer);
    conn.on('close', () => tlog('conn('+conn.peer+') closed'))
    conn.on('open', () => tlog('conn('+conn.peer+') opened'))
    conn.on('error', (err) => tlog('conn('+conn.peer+') error:' + err))
    conn.on('data', (data) => {tlog('conn('+conn.peer+') data: ' + JSON.stringify(data)); dataReceivedMethod(data, peer, conn); /* sendJsonToPeers(data, getConnectedPeers(peer).filter(p => p.peer !== conn.peer))*/})
  });

  peer.on('error', function (err) {
    if (err.type === 'unavailable-id') {
      tlog(`peer ${peerIdDefault} already started `);
      peer = new Peer(null, {debug: 3, config: {iceServers: iceServers,}});
      peer.on('close', () => tlog('peer closed'))
      peer.on('disconnected', () => tlog('peer disconnected'))
      peer.on('error', (err) => tlog('peer error: ' + err.type))
      peer.on('open', function (id) {
        tlog('new peer: ' + id);
        tlog(`connecting to peer ${peerIdDefault} `);
        conn = peer.connect(peerIdDefault, {serialization: 'json',reliable:false});
        conn.on('close', () => {tlog('conn('+conn.peer+') closed'); initNetwork(options)})
        conn.on('open', () => tlog('conn('+conn.peer+') opened'))
        conn.on('error', () => tlog('conn('+conn.peer+') error' + data))
        conn.on('data', (data) => {tlog('conn('+conn.peer+') data: ' + JSON.stringify(data)); dataReceivedMethod(data, peer, conn)})
      });

    } else {
      tlog('peer error: ' + err.type);
    }
  });
}


