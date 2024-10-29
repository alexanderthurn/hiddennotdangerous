var networkIdLocal = localStorage.getItem('networkId') 
if (!networkIdLocal) {
  networkIdLocal = crypto.randomUUID()
  localStorage.set(networkIdLocal)
}
var networkIndexLocal = -1


const MAX_NETWORK_INDEX = 255
var networkIndexes = {}

var peer = undefined
var tlog = undefined
var peerIdDefault = undefined
var dataReceivedMethod = undefined


const PEERMESSAGEID_TELL_NETWORKINDEXES = 0
const PEERMESSAGEID_WANT_NETWORKINDEXES = 1

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

function getNetworkIndex(networkId) {
  return networkIndexes[networkId]
}

function getNetworkIdForNetworkIndex(networkIndex) {
  return Object.keys().find( key => networkIndexes[key] === networkIndex)
}

function getFreeNetworkIndex() {
  var found = -1
  for (var i=0;i<=MAX_NETWORK_INDEX;i++) {
     if (!getPeerIdForNetworkId()) {
      found = i
      break
     }
  } 
  return found
}

function setNetworkId(networkId, networkIndex) {
  networkIndexes[networkId] = networkIndex
}

function isMaster(peer) {
  return peer && peer.open && peer.id === peerIdDefault
}

function writeUnitCircleFloatAsInt16(buffer, offset, floatValue) {
  const view = new DataView(buffer);
  view.setInt16(offset, Math.round(floatValue * 32767));
}

function readUnitCircleFloatAsInt16(buffer, offset) {
  const view = new DataView(buffer);
  return view.getInt16(offset) / 32767;
}

// -3000 bis +3000
function write3000erFloatAsInt16(buffer, offset, floatValue) {
  const view = new DataView(buffer);
  
  // Wert um das 10-Fache skalieren, um eine Dezimalstelle Genauigkeit zu speichern
  view.setInt16(offset, Math.round(floatValue * 10));
}

function read3000erFloatAsInt16(buffer, offset) {
  const view = new DataView(buffer);
  
  // Wert zurückskalieren, um den originalen float-Wert zu erhalten
  return view.getInt16(offset) / 10;
}

function writeAngleAsInt16(buffer, offset, angleInRadians) {
  const view = new DataView(buffer);
  
  // Winkel skalieren, um ihn als int16 zu speichern
  // Wertebereich: -3.1415... bis +3.1415... (π)
  const scaledAngle = Math.round(angleInRadians * 10000);
  view.setInt16(offset, scaledAngle);
}

function readAngleAsInt16(buffer, offset) {
  const view = new DataView(buffer);
  
  // Skalierten Wert zurück zum Radiant umrechnen
  const scaledAngle = view.getInt16(offset);
  return scaledAngle / 10000;
}


function writeTwoBooleans(buffer, offset, bool1, bool2) {
  const view = new DataView(buffer);
  let byte = 0;
  byte |= bool1 ? 1 : 0;       // Setzt das erste Bit für bool1
  byte |= (bool2 ? 1 : 0) << 1; // Setzt das zweite Bit für bool2
  view.setUint8(offset, byte);  // Speichert das Byte im Buffer
}

function readTwoBooleans(buffer, offset) {
  const view = new DataView(buffer);
  const byte = view.getUint8(offset);
  const bool1 = (byte & 1) !== 0;    // Prüft das erste Bit
  const bool2 = (byte & (1 << 1)) !== 0; // Prüft das zweite Bit
  return { bool1, bool2 };
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

function assignNetworkIndexAndSend(peerId, peer, conn) {
  var index = getNetworkIndex(peerIndex)
  if (!index) {
    index = getFreeNetworkIndex()
  }

  let buffer = new ArrayBuffer(2)
  let view = new DataView(buffer)
  view.setUint8(0, PEERMESSAGEID_ASSIGN_NETWORKID)
  view.setUint8(1, id)
  conn.send(buffer)
}

function handleMessageTellNetworkIndexes(buffer, peer, conn) {
  let view = new DataView(buffer)
  let networkId = view.getUint8(2)
  networkIdLocal = networkId
}

function handleMessageWantNetworkIndexes(buffer, peer, conn) {
  assignNetworkIndexAndSend(conn.peer, peer, conn)
}

function internalDataReceivedMethod(buffer, peer, conn) {
  const view = new DataView(buffer);
  const messageType = view.getUint8(0);
  var result = 'unknown'
  try {
    switch (messageType) {
      case PEERMESSAGEID_TELL_NETWORKINDEXES:
        result = handleMessageAssignNetworkId(buffer, peer, conn)
      case PEERMESSAGEID_WANT_NETWORKINDEXES:
        result = handleMessageWantNetworkId(buffer, peer, conn)
      default:
        if (dataReceivedMethod) {
          result =  dataReceivedMethod(buffer, peer, conn)
        }
    }
  } catch(e) {
    tlog('error', e)
  }
 
  tlog('message received', messageType, result)

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
    conn.on('data', (data) => {tlog('conn('+conn.peer+') data: ' + JSON.stringify(data)); internalDataReceivedMethod(data, peer, conn); /* sendJsonToPeers(data, getConnectedPeers(peer).filter(p => p.peer !== conn.peer))*/})
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
        conn = peer.connect(peerIdDefault, {serialization: 'binary', reliable:false});
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


