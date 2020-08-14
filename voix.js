const fs = require('fs');
// read ssl certificate
var privateKey = fs.readFileSync('/etc/ssl/private/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/ssl/certs/fullchain.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };

var https = require('https');

//pass in your credentials to create an https server
var httpsServer = https.createServer(credentials);
httpsServer.listen(1338);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
  server: httpsServer
});

wss.on('connection', function(ws) {
  console.log('Nouvelle connexion : '+ ws);
  
  ws.on('message', function(msg) {
    wss.clients.forEach(function(client) {
      //if (client !== this && client.readyState === WebSocketServer.OPEN) {
        client.send(msg);
        //console.log("B: "+ this +" || "+ msg);
      //}
    });
  });
});

console.log("websocketserver listening on port 1338 " + new Date());
