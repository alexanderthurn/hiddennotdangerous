var networkIdLocal = sessionStorage.getItem('networkId') 
if (!networkIdLocal) {
  networkIdLocal = crypto.randomUUID()
  sessionStorage.setItem('networkId', networkIdLocal)
}
var networkIndexLocal = -1
const MAX_NETWORK_INDEX = 255
var networkIndexes = {}
var dtPingPong = -1
var peer = undefined
var tlog = undefined
var peerIdDefault = undefined
var dataReceivedMethod = undefined

const PEERMESSAGEID_TELL_NETWORKINDEXES = 0
const PEERMESSAGEID_WANT_NETWORKINDEXES = 1
const PEERMESSAGEID_TEXT = 2
const PEERMESSAGEID_PING = 3
const PEERMESSAGEID_PONG = 4

const MessageTitles = {
}
MessageTitles[PEERMESSAGEID_TELL_NETWORKINDEXES] = 'TellIndexes'
MessageTitles[PEERMESSAGEID_WANT_NETWORKINDEXES] = 'WantIndexes'
MessageTitles[PEERMESSAGEID_TEXT] = 'Text'
MessageTitles[PEERMESSAGEID_PING] = 'Ping'
MessageTitles[PEERMESSAGEID_PONG] = 'Pong'

function getMessageTitleByType(messageId) {
  if (MessageTitles[messageId]) {
    return MessageTitles[messageId]
  } else {
    return messageId
  }
}

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
  var index = networkIndexes[networkId]
  if (index && index >= 0) {
    return index
  } else {
    return -1
  }
}

function getNetworkIdForNetworkIndex(networkIndex) {
  return Object.keys(networkIndexes).find( key => networkIndexes[key] === networkIndex)
}

function getFreeNetworkIndex() {
  var found = -1
  for (var i=0;i<=MAX_NETWORK_INDEX;i++) {
     if (!getNetworkIdForNetworkIndex(i)) {
      found = i
      break
     }
  } 
  return found
}

function setNetworkIndex(networkId, networkIndex) {
  networkIndexes[networkId] = networkIndex
  return networkIndex
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


// Funktion zum Schreiben eines Strings in den Buffer
function writeTextToBuffer(buffer, offset, str) {
  const encoder = new TextEncoder();
  const stringBytes = encoder.encode(str);
  const view = new DataView(buffer);

  // Schreibe die Länge des Strings an den Offset
  view.setUint16(offset, stringBytes.length);
  offset += 2;

  // Schreibe die String-Bytes in den Buffer
  new Uint8Array(buffer, offset, stringBytes.length).set(stringBytes);

  // Erhöhe den Offset um die Länge des Strings
  offset += stringBytes.length;

  // Rückgabe des neuen Offsets
  return offset;
}

function getTextBufferLength(str) {
  const encoder = new TextEncoder();
  const stringBytes = encoder.encode(str);
  return 2 + stringBytes.length; // 2 Bytes für die Länge des Strings + String-Bytes
}

function readTextFromBuffer(buffer, offset) {
  const view = new DataView(buffer);

  // Lese die Länge des Strings (2 Bytes)
  const length = view.getUint16(offset);
  offset += 2;

  // Lese die String-Bytes
  const stringBytes = new Uint8Array(buffer, offset, length);
  const decoder = new TextDecoder();
  const resultString = decoder.decode(stringBytes);

  // Erhöhe den Offset um die gelesene Länge
  offset += length;

  // Rückgabe des Strings und des neuen Offsets
  return { text: resultString, offset: offset };
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

function getConnectedPeers() {
  return !peer ? [] : Object.keys(peer.connections).map(p => peer.connections[p]).map( p=> p.length > 0 ? p[0] : null).filter(p => p && p.peerConnection.connectionState !== 'failed')
}

function sendMessageBufferToPeers(messageBuffer, peers) {
  tlog('sending msg "'+getMessageTypeTitle(messageBuffer)+'" ('+ messageBuffer.byteLength+ ' bytes) to ' + peers.length + ' peer(s)');
  peers.forEach((k) => {k.send(messageBuffer)});
}

function sendMessageBufferToAllPeers(messageBuffer) {
  sendMessageBufferToPeers(messageBuffer, getConnectedPeers())
}

function handleMessageBufferTellNetworkIndexes(messageBuffer, peer, conn) {
   const view = new DataView(messageBuffer);
   var offset = 1
   var length = view.getUint8(offset);
   offset+=1
   for (var i = 0;i<length;i++) {
      var textAndOffset = readTextFromBuffer(messageBuffer, offset)
      var networkId = textAndOffset.text
      offset=textAndOffset.offset
      var networkIndex = view.getUint8(offset);
      offset+=1
      setNetworkIndex(networkId, networkIndex)
      if (networkId === networkIdLocal) {
        networkIndexLocal = networkIndex
      }
    }

   return 'received index: ' + networkIndexLocal
}

function getMessageBufferTellNetworkIndexes() {
  let payloadLength = 1 + 1 // message type and length of keys
  var keys = Object.keys(networkIndexes)
  keys.forEach( key => {
    payloadLength += getTextBufferLength(key)
    payloadLength += 1 // networkIndex
  })

  let buffer = new ArrayBuffer(payloadLength)
  let view = new DataView(buffer)
  var offset = 0

  // message id
  view.setUint8(0, PEERMESSAGEID_TELL_NETWORKINDEXES)
  offset+=1

  // length of keys
  view.setUint8(1, keys.length)
  offset+=1

  // add string and index
  keys.forEach( key => {
    offset = writeTextToBuffer(buffer, offset, key)
    view.setUint8(offset, networkIndexes[key])
    offset+=1
  })

  return buffer
}

//TODO: only keys work not values/entries?

function handleMessageBufferWantNetworkIndexes(messageBuffer, peer, conn) {
  // assignNetworkIndexAndSend(conn.peer, peer, conn)
  const view = new DataView(messageBuffer);
  var offset = 1
  var textAndOffset = readTextFromBuffer(messageBuffer, offset)
  var networkId = textAndOffset.text
  offset = textAndOffset.offset
  const networkIndex = view.getUint8(offset);

  var reply = getMessageBufferTellNetworkIndexes()

  // check if user is already known and if not, add it
  var index = getNetworkIndex(networkId)
  if (index < 0) {
    setNetworkIndex(networkId, getFreeNetworkIndex())
    reply = getMessageBufferTellNetworkIndexes()
    sendMessageBufferToAllPeers(reply)
  } else {
    sendMessageBufferToPeers(reply, [conn])
  }

  return 'todo'

}

function getMessageBufferWantNetworkIndexes() {
  var networkId = networkIdLocal
  var networkIndex = networkIndexLocal

  let payloadLength = 1 + getTextBufferLength(networkId) + 1
  let buffer = new ArrayBuffer(payloadLength)
  let view = new DataView(buffer)
  let offset = 0

  view.setUint8(0, PEERMESSAGEID_WANT_NETWORKINDEXES)
  offset += 1

  offset = writeTextToBuffer(buffer,offset, networkId)

  view.setUint8(offset, networkIndex)
  offset += 1
 
  return buffer
}

function handleMessageBufferText(messageBuffer, peer, conn) {
  var textAndOffset = readTextFromBuffer(messageBuffer, 1)
  var text = textAndOffset.text
  return text
}

function getMessageBufferText(text) {
    let payloadLength = 1 + getTextBufferLength(text)
    let buffer = new ArrayBuffer(payloadLength)
    let view = new DataView(buffer)
    let offset = 0
    view.setUint8(0, PEERMESSAGEID_TEXT)
    offset += 1
    writeTextToBuffer(buffer,offset, text)
    offset += 4
  return buffer
}


function handleMessageBufferPing(messageBuffer, peer, conn) {
  
  let view = new DataView(messageBuffer)
  var timestamp = view.getBigUint64(1, false)
  
  var pongMessage = getMessageBufferPong(timestamp)
  sendMessageBufferToPeers(pongMessage, [conn])
  return timestamp
}

function getMessageBufferPing() {
    let payloadLength = 1 + 8
    let messageBuffer = new ArrayBuffer(payloadLength)
    let view = new DataView(messageBuffer)
    let offset = 0
    view.setUint8(0, PEERMESSAGEID_PING)
    offset += 1
    view.setBigUint64(offset, BigInt(Date.now()), false)
    offset += 8
  return messageBuffer
}


function handleMessageBufferPong(messageBuffer, peer, conn) {
  let view = new DataView(messageBuffer)
  var timestamp = view.getBigUint64(1, false)
  dtPingPong = Date.now() - Number(timestamp)
  return 'pong response: sent:' + timestamp + ' now: ' + Date.now() + ' dt: ' + dtPingPong
}

function getMessageBufferPong(timestamp) {
    let payloadLength = 1 + 8
    let buffer = new ArrayBuffer(payloadLength)
    let view = new DataView(buffer)
    let offset = 0
    view.setUint8(0, PEERMESSAGEID_PONG)
    offset += 1
    view.setBigUint64(offset, timestamp, false)
    offset += 8
    return buffer
}



function getMessageType(messageBuffer) {
  const view = new DataView(messageBuffer);
  const messageType = view.getUint8(0);
  return messageType
}

function getMessageTypeTitle(messageBuffer) {
  return getMessageTitleByType(getMessageType(messageBuffer))
}
function internalDataReceivedMethod(messageBuffer, peer, conn) {
  const messageType = getMessageType(messageBuffer)
  var result = 'unknown'
  try {
    switch (messageType) {
      case PEERMESSAGEID_TELL_NETWORKINDEXES:
        result = handleMessageBufferTellNetworkIndexes(messageBuffer, peer, conn)
        break
      case PEERMESSAGEID_WANT_NETWORKINDEXES:
        result = handleMessageBufferWantNetworkIndexes(messageBuffer, peer, conn)
        break
      case PEERMESSAGEID_TEXT:
        result = handleMessageBufferText(messageBuffer, peer, conn)
        break
      case PEERMESSAGEID_PING:
        result = handleMessageBufferPing(messageBuffer, peer, conn)
        break
      case PEERMESSAGEID_PONG:
        result = handleMessageBufferPong(messageBuffer, peer, conn)
        break
      default:
        if (dataReceivedMethod) {
          result = dataReceivedMethod(messageBuffer, peer, conn)
        }
        break
    }
  } catch(e) {
    result = 'error internalDataReceivedMethod: ' + e.message + ' ' + getMessageTypeTitle(messageBuffer)
  }
 // tlog('received message('+messageType+'): '+ result)

  return result
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
  peer.on('open', function (id) { tlog('peer open: ' + id); networkIndexLocal = setNetworkIndex(networkIdLocal, getFreeNetworkIndex()) });
  peer.on('connection', function (conn) {
    tlog('peer connection: ' + conn.peer);
    conn.on('close', () => tlog('conn('+conn.peer+') closed'))
    conn.on('open', () => tlog('conn('+conn.peer+') opened'))
    conn.on('error', (err) => tlog('conn('+conn.peer+') error:' + err))
    conn.on('data', (data) => {tlog('conn('+conn.peer+') received msg "'+getMessageTypeTitle(data)+'" ('+data.byteLength+'): ' + internalDataReceivedMethod(data, peer, conn)) /* sendJsonToPeers(data, getConnectedPeers(peer).filter(p => p.peer !== conn.peer))*/})
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
        conn.on('close', () => {tlog('conn('+conn.peer+') closed'); initNetwork(roomName, options)})
        conn.on('open', () => {tlog('conn('+conn.peer+') opened'); sendMessageBufferToPeers(getMessageBufferWantNetworkIndexes(), [conn])})
        conn.on('error', () => tlog('conn('+conn.peer+') error' + data))
        conn.on('data', (data) => {tlog('conn('+conn.peer+') received msg "'+getMessageTypeTitle(data)+'" ('+data.byteLength+'): ' + internalDataReceivedMethod(data, peer, conn))
        })
      });

    } else {
      tlog('peer error: ' + err.type);
    }
  });
}


