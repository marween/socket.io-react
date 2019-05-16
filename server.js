var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require ('path');
var port = process.env.PORT || 8000; // connection heroku

/**
 * variables globales
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
/*
* fonctions jeu des dames----------------------------------
*-----------------------------------------------------------
*/

function verifpiece(data) {
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

function mandatoryMoves(row, column, color, isQueen) {

  let obligedMoves = [];

  if((column > 1) && (row < 6) && (color === 'black' || isQueen) && (board[row + 1][column - 1] !== '') && (board[row + 1][column - 1].split(' ', 1)[0] !== color) && (board[row + 2][column - 2] === ''))
    obligedMoves.push(colNames[column - 2] + (row + 3));

  if((column < 6) && (row < 6) && (color === 'black' || isQueen) && (board[row + 1][column + 1] !== '') && (board[row + 1][column + 1].split(' ', 1)[0] !== color) && (board[row + 2][column + 2] === ''))
    obligedMoves.push(colNames[column + 2] + (row + 3));

  if((column > 1) && (row > 1) && (color === 'white' || isQueen) && (board[row - 1][column - 1] !== '') && (board[row - 1][column - 1].split(' ', 1)[0] !== color) && (board[row - 2][column - 2] === ''))
    obligedMoves.push(colNames[column - 2] + (row - 1));

  if((column < 6) && (row > 1) && (color === 'white' || isQueen) && (board[row - 1][column + 1] !== '') && (board[row - 1][column + 1].split(' ', 1)[0] !== color) && (board[row - 2][column + 2] === ''))
    obligedMoves.push(colNames[column + 2] + (row - 1));

  return obligedMoves;
}

function gameOver(player) {
  for(let i = 0; i < 8; i++){
    for(let j = 0; j < 8; j++){
      if(board[i][j].includes(player) && possibleMoves(i, j, player, board[i][j].includes('queen')).length !== 0)
        return false;
    }
  }
  return true;
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
   * Réception de l'événement 'room-service' et 'move' 
   * et réémission vers tous les utilisateurs connectés à la room
   */
   socket.on('createRoom', function(data){
    socket.leave(roomID); // on quitte une room
    playerOne = data.user; // premier connecté = premier joueur
    roomID = data.roomName; // nom de la room
    //console.log('[socket]','join room :',roomID);
    socket.join(roomID);

    if(roomArray.indexOf(roomID) === -1){roomArray.push(roomID)}; // compte le nombre de joueurs à la room
    //console.log('array check', roomArray)
    // console.log('playerNumber before change',playerNumber)
    playerNumber =true;
    
    socket.emit('room-service', [roomID, playerOne, playerTwo]);
    
    socket.emit('playerNumber', playerNumber);
    console.log('player',playerNumber)

    // jeu de dame -> mouvement
    socket.on('move', function(data){
      let column_origin = colNames.indexOf(data.playerMove.substring(0, 1));
      let row_origin = data.playerMove.substring(1, 2) - 1;
      
      if(verifpiece(data)){
        let column_dest = colNames.indexOf(data.playerMove.substring(2, 3));
        let row_dest = data.playerMove.substring(3, 4) - 1;
        let obligedMoves = [];

        for(let i = 0; i < 8; i++){
          for(let j = 0; j < 8; j++){
            if(board[i][j].includes('white'))
              obligedMoves = mandatoryMoves(row_origin, column_origin, 'white', board[row_origin][column_origin].includes('queen'))
          }
        }
        if((obligedMoves.length === 0) || (obligedMoves.indexOf(data.playerMove.substring(2, 4)) !== -1)) {


          if(possibleMoves(row_origin, column_origin, 'white', board[row_origin][column_origin].includes('queen')).indexOf(data.playerMove.substring(2, 4) !== -1)){
            
            board[row_dest][column_dest] = board[row_origin][column_origin];
            board[row_origin][column_origin] = '';
          
            if (Math.abs(row_origin - row_dest) > 1) {
                board[(row_origin + row_dest) / 2][(column_origin + column_dest) / 2] = '';
            }
            io.to(roomID).emit('move', data);

            if(gameOver('black') === true){
              console.log('Jamal a gagné');
            }

            io.to(roomID).emit('gameOver', 'white won')  

          }
        }
       }
    })
   
  });

  /**
   * Réception de l'événement 'joinRoom-service' et 'move' 
   * et réémission vers tous les utilisateurs connectés à la room
   */
   socket.on('joinRoom', function(data){
    // joueur qui rejoint la room = joueur 2
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

    // jeu de dame -> mouvement joueur 2
    socket.on('move', function(data){
      let column_origin = colNames.indexOf(data.playerMove.substring(0, 1));
      let row_origin = data.playerMove.substring(1, 2) - 1;
      
      if(verifpiece(data)){
        let column_dest = colNames.indexOf(data.playerMove.substring(2, 3));
        let row_dest = data.playerMove.substring(3, 4) - 1;
        let obligedMoves = [];

        for(let i = 0; i < 8; i++){
          for(let j = 0; j < 8; j++){
            if(board[i][j].includes('black'))
             obligedMoves = mandatoryMoves(row_origin, column_origin, 'black', board[row_origin][column_origin].includes('queen'))
          }
        }
        if((obligedMoves.length === 0) || (obligedMoves.indexOf(data.playerMove.substring(2, 4)) !== -1)){
          
          if(possibleMoves(row_origin, column_origin, 'black', board[row_origin][column_origin].includes('queen')).indexOf(data.playerMove.substring(2, 4) !== -1)){
            
            console.log('possibleMoves',possibleMoves(row_origin, column_origin, 'black', board[row_origin][column_origin].includes('queen')))
            board[row_dest][column_dest] = board[row_origin][column_origin];
            board[row_origin][column_origin] = '';
          
            if (Math.abs(row_origin - row_dest) > 1) {
                board[(row_origin + row_dest) / 2][(column_origin + column_dest) / 2] = '';
            }
            io.to(roomID).emit('move', data);
          }
        }
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