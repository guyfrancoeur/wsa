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

firstChunks = [];

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