var peer;
const peerIdDefault = 'hiddennotdangerous'
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

function tlog(d) {
  document.getElementById('textAreaLog').value += d + '\n';
}

document.addEventListener('DOMContentLoaded', function (event) {
  tlog('starting peer: ' + peerIdDefault);
  peer = new Peer(peerIdDefault, {debug: 3, config: {iceServers: iceServers,}});
  peer.on('close', () => tlog('peer closed'))
  peer.on('disconnected', () => tlog('peer disconnected'))
  peer.on('open', function (id) {
    tlog('peer open: ' + id);
  });
  peer.on('connection', function (conn) {
    tlog('connected...' + conn.peer);

    conn.on('close', () => tlog('conn closed'))
    conn.on('open', () => tlog('conn opened'))
    conn.on('error', () => tlog('conn error' + data))
    conn.on('data', (data) => tlog('conn data: ' + JSON.stringify(data)))
  });

  peer.on('error', function (err) {
    if (err.type === 'unavailable-id') {
      tlog(`peer ${peerIdDefault} already started `);
      peer = new Peer(null, {debug: 3, config: {iceServers: iceServers,}});
      peer.on('close', () => tlog('closed'))
      peer.on('disconnected', () => tlog('closed'))
      peer.on('error', (err) => tlog('Error: ' + err.type))
      peer.on('open', function (id) {
        tlog('new peer: ' + id);
        tlog(`connecting to peer ${peerIdDefault} `);
        conn = peer.connect(peerIdDefault);
        conn.on('close', () => tlog('conn closed'))
        conn.on('open', () => tlog('conn opened'))
        conn.on('error', () => tlog('conn error' + data))
        conn.on('data', (data) => tlog('conn data: ' + JSON.stringify(data)))
      });

    } else {
      tlog('Error: ' + err.type);
    }
  });

  document
    .getElementById('btnSend')
    .addEventListener('click', function (event) {
      var message = { hallo: document.getElementById('inputSend').value };
      tlog('Sending to peer: ' + JSON.stringify(message));
      Object.entries(peer.connections)
        .map((k) => k[1][0])
        .forEach((k) => {
          k.send(JSON.stringify(message));
        });
      //conn.send();
    });
});
