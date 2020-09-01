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

  // Envoi des first chunks uniquement si un appel a déjà été commencé (pas de msg start)
  if (firstChunks.length > 0 && appelDejaCommence()){
    ws.send(JSON.stringify({
      type: "firstchunks",
      data: firstChunks
    }));
  }

  ws.on('message', function(msg) {
    parsed = JSON.parse(msg);
    if(parsed.type == "start") ws.start = 1;
    if(parsed.type == "stop") ws.start = 0;

    switch (parsed.type) {
      case 'newuser':
        ws.name = parsed.name;
        break;

      case 'firstchunks':
        // (firstChunks.length == 0 ) => Ajout seulement si aucun first chunks n'a été sauvegardé. Ensuite, plus besoin de les changer.
        if(firstChunks.length == 0 ) firstChunks = parsed.data[0].concat(parsed.data[1]); // Fusion 1er et 2eme paquets données audio
          
        // Si un qqun est connecté sur le serveur Websocket, et n'a pas encore entré de pseudo (considéré comme ayant "name = undefined") et que quelqu'un lance un appel (réception msg start)
        wss.clients.forEach(function(client) {
          if(client.name == undefined){
            client.send(JSON.stringify({
              type: "firstchunks",
              data: firstChunks
            }));
          }
        });
        break;

      default:
        wss.clients.forEach(function(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msg);
            //console.log("B: "+ this +" || "+ msg);
          }
        });
    }
  });

  ws.on('close', function() {
    // Si la personne qui se déconnecte a oublié d'arrêter un appel qu'elle a lancé, envoi d'un stop aux autres personnes pour mettre à jour leur objet audio
    if(ws.start == 1){
      wss.clients.forEach(function(client) {
        client.send(JSON.stringify({ type: "stop" }));
      });
    }
  });

  function appelDejaCommence(){
    var res = 0;
    wss.clients.forEach(function(client) {
      if(client.start == 1) res = 1;
    });
    return res;
  }
});

console.log("websocketserver listening on port 1338 " + new Date());