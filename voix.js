const fs = require('fs');
// read ssl certificate
var privateKey = fs.readFileSync('/etc/ssl/private/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/ssl/certs/fullchain.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };

var https = require('https');

//pass in your credentials to create an https server
var httpsServer = https.createServer(credentials);
httpsServer.listen(1338);

var WebSocket = require('ws');
var wss = new WebSocket.Server({
  server: httpsServer
});

firstChunks = [];

wss.on('connection', function(ws) {
  console.log('Nouvelle connexion : '+ ws);
  
  if (firstChunks.length > 0){
    ws.send(JSON.stringify({
      type: "firstchunks",
      data: firstChunks
    }));
  }

  ws.on('message', function(msg) {
    parsed = JSON.parse(msg);
    if (parsed.type == "firstchunks") firstChunks = parsed.data[0].concat(parsed.data[1]); // Fusion 1er et 2eme paquets données audio
    else{
      wss.clients.forEach(function(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
          //console.log("B: "+ this +" || "+ msg);
        }
      });
    }
  });
});

console.log("websocketserver listening on port 1338 " + new Date());