var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require ('path');
var port = process.env.PORT || 8000; // connection heroku

/**
 * Gestion des requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
 */
 let roomArray=[]
 let usersList = [];
 let playerOne ='';
 let playerTwo = '';

let board = new Array(8);

for(let i = 0; i < 8; i++){
  board[i] = new Array(8);
  for(let j = 0; j < 8; j++){
    if (i < 3) {
      if (((i + j) % 2) == 0) {
        board[i][j] = 'black pawn';
        continue;
      }
    }
    else if (i > 4) {
      if (((i + j) % 2) == 0) {
        board[i][j] = 'white pawn';
        continue;
      }
    }
    board[i][j] = '';
  }
}

let colNames= ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function moveIt(data) {
  let column_origin = colNames.indexOf(data.playerMove.substring(0, 1));
  let row_origin = data.playerMove.substring(1, 2) - 1;
  if((data.playerNumber && board[row_origin][column_origin].includes('white')) || (!data.playerNumber && board[row_origin][column_origin].includes('black')))
    return true;
  return false;
}

function possibleMoves(row, column, color, isQueen) {

  let legalMove = [];
  let moveUpperLeft = colNames[column - 1] + (row);
  let moveUpperRight = colNames[column + 1] + (row);
  let moveLowerLeft = colNames[column - 1] + (row + 2);
  let moveLowerRight = colNames[column + 1] + (row + 2);

  if(((column > 0) && (row < 7) && (board[row + 1][column - 1] === '' ) && (color === 'black' || isQueen)) || ((color === 'black' || isQueen) && (column > 1) && (row < 6) && (board[row + 1][column - 1].split(' ', 1)[0] !== color) && (board[row + 2][column - 2] === ''))){
    if(board[row + 1][column - 1] === '')
      legalMove.push(moveLowerLeft);

    else
      legalMove.push(colNames[column - 2] + (row + 3));
  }

  if(((column < 7) && (row < 7) && (board[row + 1][column + 1] === '' ) && (color === 'black' || isQueen)) || ((color === 'black' || isQueen) && (column < 6) && (row < 6) && (board[row + 1][column + 1].split(' ', 1)[0] !== color) && (board[row + 2][column + 2] === ''))){
    if(board[row + 1][column + 1] === '')
      legalMove.push(moveLowerRight);

    else
      legalMove.push(colNames[column + 2] + (row + 3));
  }

  if(((column > 0) && (row > 0) && (board[row - 1][column - 1] === '' ) && (color === 'white' || isQueen)) || ((color === 'white' || isQueen) && (column > 1) && (row > 1) && (board[row - 1][column - 1].split(' ', 1)[0] !== color) && (board[row - 2][column - 2] === ''))){
    if(board[row - 1][column - 1] === '')
      legalMove.push(moveUpperLeft);

    else
      legalMove.push(colNames[column - 2] + (row - 1));
  }

  if(((column < 7) && (row > 0) && (board[row - 1][column + 1] === '' ) && (color === 'white' || isQueen)) || ((color === 'white' || isQueen) && (column < 6) && (row > 1) && (board[row - 1][column + 1].split(' ', 1)[0] !== color) && (board[row - 2][column + 2] === ''))){
    if(board[row - 1][column + 1] === '')
      legalMove.push(moveUpperRight);

    else
      legalMove.push(colNames[column + 2] + (row - 1));
  }
  return legalMove;
}

app.use(express.static(path.join(__dirname, 'public')));
 app.get('/', function(req, res){
  res.sendFile(__dirname + '/socket-client/public/index.html');
});

 io.on('connection', function (socket) {
  console.log('user connected ', socket.id);
  console.log(board[1][1]);
  var loggedUser; // Utilisateur connecté a la socket
  let roomID;
  let playerNumber = false;
  
  /**
   * Connexion d'un utilisateur via le formulaire :
   *  - sauvegarde du user
   */
   socket.on('user-login', function (user) {
    loggedUser = user;

    //console.log('user connected : ' + loggedUser.username);
    socket.emit('login', {userName: loggedUser.username});
    var message = {message: loggedUser.username + " joined the room"}
    
    socket.to(roomID).broadcast.emit('chat-message', message);
    
    io.emit('room-list', roomArray)
  });
   /**
   * Réception de l'événement 'room-service' et réémission vers tous les utilisateurs
   */
   socket.on('createRoom', function(data){
    socket.leave(roomID);
    playerOne = data.user;
    roomID = data.roomName;
    //console.log('[socket]','join room :',roomID);
    socket.join(roomID);

    if(roomArray.indexOf(roomID) === -1){roomArray.push(roomID)};
    //console.log('array check', roomArray)
    // console.log('playerNumber before change',playerNumber)
    playerNumber =true;
    
    socket.emit('room-service', [roomID, playerOne, playerTwo]);
    
    socket.emit('playerNumber', playerNumber);
    console.log('player',playerNumber)

    socket.on('move', function(data){
      let column_origin = colNames.indexOf(data.playerMove.substring(0, 1));
      let row_origin = data.playerMove.substring(1, 2) - 1;
      if(moveIt(data)){
        let column_dest = colNames.indexOf(data.playerMove.substring(2, 3));
        let row_dest = data.playerMove.substring(3, 4) - 1;
        
        board[row_dest][column_dest] = board[row_origin][column_origin];
        
        board[row_origin][column_origin] = '';
        
        if (Math.abs(row_origin - row_dest) > 1) {
            board[(row_origin + row_dest) / 2][(column_origin + column_dest) / 2] = '';
          }
        io.to(roomID).emit('move', data);
      }
      
    })
   
  });
  /**
   * Réception de l'événement 'joinRoom-service' et réémission vers tous les utilisateurs
   */
   socket.on('joinRoom', function(data){
    playerTwo = data.user;
      // console.log('joinRoom', data, playerOne, playerTwo)
    socket.leave(roomID);
    roomID = data.roomName;
    // console.log(roomID)
    socket.join(roomID)
    
    io.emit('room-service', [roomID, playerOne, playerTwo]);
    
    socket.emit('playerNumber', playerNumber)
    console.log('player',playerNumber)
    
    clientsInRoom = io.nsps['/'].adapter.rooms[roomID].length;
    if(clientsInRoom === 2){ 
      roomArray.splice(roomArray.indexOf(roomID),1)
      //console.log('room complet')
    }

    socket.on('move', function(data){
      let column_origin = colNames.indexOf(data.playerMove.substring(0, 1));
      let row_origin = data.playerMove.substring(1, 2) - 1;
      
      if(moveIt(data)){
        let column_dest = colNames.indexOf(data.playerMove.substring(2, 3));
        let row_dest = data.playerMove.substring(3, 4) - 1;
        
        board[row_dest][column_dest] = board[row_origin][column_origin];
        
        board[row_origin][column_origin] = '';
        
        if (Math.abs(row_origin - row_dest) > 1) {
            board[(row_origin + row_dest) / 2][(column_origin + column_dest) / 2] = '';
          }
        
        io.to(roomID).emit('move', data);
      }
      
    })

  });
  /**
   * Réception de l'événement 'romm-list' et réémission vers tous les utilisateurs
   */
   socket.on('leaveRoom', function(data){
    roomID = data.roomName;
    clientsInRoom = io.nsps['/'].adapter.rooms[roomID].length;
    
    if(clientsInRoom >1){ 
      if(roomArray.indexOf(roomID) === -1)  {
        roomArray.push(roomID)
        
      }
    }

    else if(clientsInRoom ===1)  {
      roomArray.splice(roomArray.indexOf(roomID),1)

    }
    socket.leave(data.roomName);
    io.emit('room-list', roomArray)

  })

   /**
   * Réception de l'événement 'chat-message' et réémission vers tous les utilisateurs
   */
   socket.on('chat-message', function (message) {
    //console.log('chat-message', message);
    //console.log('roomID', roomID);
    message.username = loggedUser.username + " says : ";
    io.to(roomID).emit('chat-message', message);

  });

  /**
   * Déconnexion d'un utilisateur : broadcast d'un 'service-message'
   */
   socket.on('disconnect', function () {
    if(loggedUser !== undefined){
      console.log('user disconnected : ' + loggedUser.username);
      var serviceMessage = {
        text: 'User "' + loggedUser.username + '" disconnected',
        type: 'logout'
      };
      socket.broadcast.emit('service-message', serviceMessage);
    }
  });

 });

/**
 * Lancement du serveur en écoutant les connexions arrivant sur le port 3000
 */
 http.listen(port, function(){
  console.log('listening on ${ port }');
});