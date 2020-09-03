const fs = require('fs');
var privateKey = fs.readFileSync('/etc/ssl/private/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/ssl/certs/fullchain.pem', 'utf8');
var credentials = { key: privateKey, cert: certificate };
var https = require('https');
var httpsServer = https.createServer(credentials);
httpsServer.listen(1338);

var WebSocket = require('ws');
var wss = new WebSocket.Server({
  server: httpsServer
});

const firstChunks = [26,69,223,163,159,66,134,129,1,66,247,129,1,66,242,129,4,66,243,129,8,66,130,132,119,101,98,109,66,135,129,4,66,133,129,2,
  24,83,128,103,1,255,255,255,255,255,255,255,21,73,169,102,153,42,215,177,131,15,66,64,77,128,134,67,104,114,111,109,101,87,65,134,67,104,
  114,111,109,101,22,84,174,107,191,174,189,215,129,1,115,197,135,29,147,61,140,104,96,37,131,129,2,134,134,65,95,79,80,85,83,99,162,147,79,
  112,117,115,72,101,97,100,1,1,0,0,128,187,0,0,0,0,0,225,141,181,132,71,59,128,0,159,129,1,98,100,129,32,31,67,182,117,1,255,255,255,255,
  255,255,255,231,129,0,163,65,0,129,0,0,128,123,131,63,88,11,228,193,54,248,69,93,234,228,51,102,63,81,243,6,188,127,232,12,54,183,4,77,125,
  250,145,7,166,91,194,97,170,64,85,117,46,115,1,58,129,63,33,17,135,72,191,255,254,213,228,186,48,40,197,181,215,51,66,120,109,206,180,0,0,178,
  118,128,90,22,13,114,59,40,83,157,1,33,18,45,238,26,21,81,137,111,182,20,133,59,115,184,62,206,235,208,251,244,9,28,178,33,251,3,226,24,102,253,
  246,194,36,142,67,129,242,108,16,142,136,120,110,228,24,205,17,127,39,157,92,0,210,194,3,234,32,57,230,121,12,152,148,172,59,53,123,52,101,21,74,
  111,84,167,134,29,151,184,161,83,178,234,235,41,158,229,107,50,131,178,234,229,207,56,218,57,11,117,146,64,211,85,99,140,174,97,94,200,191,77,
  164,157,77,244,128,224,100,37,76,142,142,160,160,57,220,85,136,255,149,245,160,67,241,12,171,134,9,60,86,118,62,239,132,66,130,89,251,69,203,
  189,105,252,124,225,128,73,211,93,175,167,110,210,81,226,74,182,70,17,208,119,148,163];

wss.on('connection', function(ws) {
  console.log('Nouvelle connexion : '+ ws);

  // Envoi first chunks dès la connexion
  ws.send(JSON.stringify({
    type: "firstchunks",
    data: firstChunks
  }));

  ws.on('message', function(msg) {
    wss.clients.forEach(function(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) client.send(msg);
    });
  });

  ws.on('close', function() {
    // Si la personne qui se déconnecte a oublié d'arrêter un appel qu'elle a lancé, envoi d'un stop aux autres personnes pour mettre à jour leur objet audio
    if(ws.start == 1){
      wss.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "stop" }));
      });
    }
  });
});

console.log("websocketserver listening on port 1338 " + new Date());
