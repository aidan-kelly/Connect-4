var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var port = 3000;
let user_list = new Object();
var game_list = new Object();
var match_making_queue = [];

var COLUMN_COUNT = 7;
var ROW_COUNT = 6;

http.listen(port, function(){
    console.log(`Listening on port ${port}.`);
});

//send index.html on connection
app.get("/", function(req, res){
    res.sendFile(__dirname + "/homepage.html");
});

//serve the css
app.get('/home_style.css', function(req, res) {
    res.sendFile(__dirname + "/" + "home_style.css");
});

//serve the client js
app.get('/home.js', function(req, res) {
    res.sendFile(__dirname + "/" + "home.js");
});

//serve the client js
app.get('/game_board.html', function(req, res) {
    res.sendFile(__dirname + "/" + "game_board.html");
});

//serve the client js
app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + "/" + "style.css");
});

//serve the client js
app.get('/game_client.js', function(req, res) {
    res.sendFile(__dirname + "/" + "game_client.js");
});




//a new connection from a socket
io.on("connection", function(socket){
    let new_user = new User();
    let new_custom_game = new Game();
    new_custom_game.gameID = generate_game_id();

    //my on connection code
    //client sends a uid stored as a cookie on the client.
    socket.on("connection_made", function(uid){

        //a user reconnects
        if(user_list[uid] !== undefined){
            //update the user's object with proper socket id
            user_list[uid].socketID = socket.id;
            new_user = user_list[uid];

            //check if the previous nickname was stolen
            if(!checkIfUniqueNickname(user_list[uid].userNickname, user_list)){
                //check if someone made their nickname the client's uid
                user_list[uid].userNickname = randomUsername();
            }

            //mark user as online and update online user list
            user_list[uid].status = true;
            console.log(`A user reconnected. ID = ${user_list[uid].userNickname}.`);
            let game_id = new_custom_game.gameID;

            for(let key in game_list){
                if(game_list[key].player1ID === new_user.userID && game_list[key].player2ID === undefined){
                    game_id = key;
                }
            }

            if(game_id !== new_custom_game.gameID){
                socket.emit("setup_ui", new_user.userNickname, "Welcome back", game_id);
            }else{
                new_custom_game.player1ID = new_user.userID;
                new_custom_game.playerTurn = new_user.userID;
                game_list[new_custom_game.gameID] = new_custom_game;
                socket.emit("setup_ui", new_user.userNickname, "Welcome back", new_custom_game.gameID);
            }
            
            

        //a new user
        }else{
            //create a new user with uid and socket id
            new_user = new User(uid, socket.id);
            user_list[new_user.userID] = new_user;
            console.log(`A user connected. ID = ${user_list[uid].userNickname}.`);
            new_custom_game.player1ID = new_user.userID;
            new_custom_game.playerTurn = new_user.userID;
            game_list[new_custom_game.gameID] = new_custom_game;
            socket.emit("setup_ui", new_user.userNickname, "We created a nickname for you", new_custom_game.gameID);
        }
    });

    socket.on("disconnect", function(){
        console.log("User disconnected!");
        //this is where we would update their status in the users list

        //NEED TO REMOVE USER FROM THE GAME QUEUE
        try{
            user_list[new_user.userID].status = false;
            match_making_queue = remove_from_queue(new_user.userID, new_user.userID);
        }catch(err){
            console.log("Weird error from last assignment lol.")
        }
    });

    socket.on("game_move", function(game_id, playerID, move){
        let game = game_list[game_id];
        add_to_gamestate(game.gamestate, playerID, move);
        if(check_for_winning_move(game.gamestate, playerID)){
            io.emit("game_over", game_id, playerID, game.gamestate);
            delete game_list[game_id];
        }else{
            if(playerID === game.player1ID){
                game.playerTurn = game.player2ID;
            }else{
                game.playerTurn = game.player1ID;
            }
            io.emit("game_update", game_id, game.gamestate, game.playerTurn);
        }
    });


    //usernames are pretty much finished.
    //needs some error handling. 
    socket.on("username_change_request", function(user_id, requested_nickname){
        let old_username = user_list[user_id].userNickname;
        if(checkIfUniqueNickname(requested_nickname, user_list)){
            user_list[user_id].userNickname = requested_nickname;
            console.log(`UID = ${user_id} changed their nickname to ${requested_nickname}.`);
        }else{
            socket.emit("my_error", "That nickname is already taken.", "#username_change_error");
        }
    });


    
    socket.on("game_join_request", function(user_id, requested_gid){
        let requested_game = game_list[requested_gid];
        if(requested_game !== undefined){
            if((requested_game.player1ID === undefined && (requested_game.player2ID !== undefined && requested_game.player2ID !== user_id)) || ((requested_game.player1ID !== undefined && requested_game.player1ID !== user_id) && requested_game.player2ID === undefined)){
                
                //add the user to the game.
                if(requested_game.player1ID === undefined){
                    game_list[requested_gid].player1ID = user_id;
                    //start the game by sending out a game_start message
                    io.emit("game_start", game_list[requested_gid].gameID, game_list[requested_gid].player1ID, game_list[requested_gid].player2ID, game_list[requested_gid].playerTurn, user_list[game_list[requested_gid].player1ID].userNickname, user_list[game_list[requested_gid].player2ID].userNickname);
                    match_making_queue = remove_from_queue(game_list[requested_gid].player1ID, game_list[requested_gid].player2ID);
                }else{
                    game_list[requested_gid].player2ID = user_id;
                    //start the game by sending out a game_start message
                    io.emit("game_start", game_list[requested_gid].gameID, game_list[requested_gid].player1ID, game_list[requested_gid].player2ID, game_list[requested_gid].playerTurn, user_list[game_list[requested_gid].player1ID].userNickname, user_list[game_list[requested_gid].player2ID].userNickname);
                    match_making_queue = remove_from_queue(game_list[requested_gid].player1ID, game_list[requested_gid].player2ID);
                }
            }else{
                socket.emit("my_error", "Game is full.", "#game_is_full");
            }
        }else{
            socket.emit("my_error", "The game does not exist.", "#game_does_not_exist");
        }
    });


    //add the user to the matchmaking queue
    socket.on("random_game_request", function(user_id){
        if(!match_making_queue.includes(user_list[user_id])){
            match_making_queue.push(user_list[user_id]);
            console.log(`UID = ${user_id} has been added to the matchmaking queue.`);
        }else{
            socket.emit("my_error", "You are already in the matchmaking queue.", "#user_already_in_queue");
        }
        

        //check if there is enough people in queue to start up a match
        if(match_making_queue.length >= 2){
            let p1 = match_making_queue.shift();
            let p2 = match_making_queue.shift();
            console.log(`We can start a match with ${p1.userNickname} and ${p2.userNickname}.`);
            let new_game = new Game(generate_game_id(), p1.userID, p2.userID);
            game_list[new_game.gameID] = new_game;

            //game_start message. 
            //gameID, gamestate, player1ID, player2ID, firstPlayerID
            io.emit("game_start", new_game.gameID, new_game.player1ID, new_game.player2ID, new_game.playerTurn, user_list[new_game.player1ID].userNickname, user_list[new_game.player2ID].userNickname);
        }

    });


});

//Functions ----------------------------------------------------------------------------------------

//Returns a random username for new users
//used a Shakespearean insult chart for the names
function randomUsername() {
	let parts = [];
    parts.push(["Artless","Bawdy","Beslubbering","Bootless","Churlish","Cockered","Clouted","Craven","Currish","Dankish","Dissembling","Droning","Errant","Fawning","Fobbing","Froward","Frothy","Gleeking","Goatish","Gorbellied","Impertinent","Infectious","Jarring","Loggerheaded","Lumpish","Mammering","Mangled","Mewling","Paunchy","Pribbling","Puking","Puny","Qualling","Rank","Reeky","Roguish","Ruttish","Saucy","Spleeny","Spongy","Surly","Tottering","Unmuzzled","Vain","Venomed","Villainous","Warped","Wayward","Weedy","Yeasty"]);
    parts.push(["Base-court","Bat-fowling","Beef-witted","Beetle-headed","Boil-brained","Clapper-clawed","Clay-brained","Common-kissing","Crook-pated","Dismal-dreaming","Dizzy-eyed","Doghearted","Dread-bolted","Earth-vexing","Elf-skinned","Fat-kidneyed","Fen-sucked","Flap-mouthed","Fly-bitten","Folly-fallen","Fool-born","Full-gorged","Guts-griping","Half-faced","Hasty-witted","Hedge-born","Hell-hated","Idle-headed","Ill-breeding","Ill-nurtured","Knotty-pated","Milk-livered","Motley-minded","Onion-eyed","Plume-plucked","Pottle-deep","Pox-marked","Reeling-ripe","Rough-hewn","Rude-growing","Rump-fed","Shard-borne","Sheep-biting","Spur-galled","Swag-bellied","Tardy-gaited","Tickle-brained","Toad-spotted","Unchin-snouted","Weather-bitten"]);
    parts.push(["Apple-john","Baggage","Barnacle","Bladder","Boar-pig","Bugbear","Bum-bailey","Canker-blossom","Clack-dish","Clotpole","Coxcomb","Codpiece","Death-token","Dewberry","Flap-dragon","Flax-wench","Flirt-gill","Foot-licker","Fustilarian","Giglet","Gudgeon","Haggard","Harpy","Hedge-pig","Horn-beast","Hugger-mugger","Joithead","Lewdster","Lout","Maggot-pie","Malt-worm","Mammet","Measle","Minnow","Miscreant","Moldwarp","Mumble-news","Nut-hook","Pigeon-egg","Pignut","Puttock","Pumpion","Ratsbane","Scut","Skainsmate","Strumpet","Varlot","Vassal","Whey-face","Wagtail"]);

    username = "";

    username+=parts[0][Math.floor(Math.random()*parts[0].length)] + "_";
    username+=parts[1][Math.floor(Math.random()*parts[1].length)] + "_";
    username+=parts[2][Math.floor(Math.random()*parts[2].length)];
    return username;
}

//checks if a nickname is in use
function checkIfUniqueNickname(proposed_nickname, user_list){
    for(let user in user_list){
        if(user_list[user].userNickname === proposed_nickname && user_list[user].status === true){
            return false;
        }else{
            continue;
        }
    }
    return true;
}


//adds a move to a gamestate
//would like to eventually return or set the lastRow and lastColumn of the move
function add_to_gamestate(gs, player, postition){
    //check if the move is valid
    if(gs[0][postition] === 0){
        //loop from bottom up.
        for(let i = gs.length-1; i >= 0; i--){
            //if that position is empty, piece would fall there
            if(gs[i][postition] === 0){
                gs[i][postition] = player;
                return gs;
            }
        }

    //move is not valid
    }else{
        return gs;
    }
}

function remove_from_queue(p1_id, p2_id){
    let new_array = [];
    for(let i = 0; i<match_making_queue.length; i++){
        if(match_making_queue[i].userID === p1_id || match_making_queue[i].userID === p2_id){
            console.log(match_making_queue[i].userID + " was caught.");
        }else{
            new_array.push(match_making_queue[i]);
        }
    }
    return new_array;
}


//checks to see if a player has won the game
function check_for_winning_move(gs, player){
    //check horizontals
    for(let i = 0; i<gs.length; i++){
        for(let j = 0; j<(gs[i].length)-3; j++){
            if(gs[i][j] === player && gs[i][j+1] === player && gs[i][j+2] === player && gs[i][j+3] === player){
                console.log("Horizontal Win!");
                return true;
            }
        }
    }

    //check verticals
    for(let i = 0; i<(gs.length)-3; i++){
        for(let j = 0; j<gs[i].length; j++){
            if(gs[i][j] === player && gs[i+1][j] === player && gs[i+2][j] === player && gs[i+3][j] === player){
                console.log("Vertical Win!");
                return true;
            }
        }
    }

    //check slash
    for(let i = gs.length-1; i>=(gs.length)-3; i--){
        for(let j = 0; j<(gs[i].length)-3; j++){
            if(gs[i][j] === player && gs[i-1][j+1] === player && gs[i-2][j+2] === player && gs[i-3][j+3] === player){
                console.log("Slash Win!");
                return true;
            }
        }
    }

    //check backslash
    for(let i = 0; i<(gs.length)-3; i++){
        for(let j = 0; j<(gs[i].length)-3; j++){
            if(gs[i][j] === player && gs[i+1][j+1] === player && gs[i+2][j+2] === player && gs[i+3][j+3] === player){
                console.log("Backslash Win!");
                return true;
            }
        }
    }

    for(let i = 0; i<gs.length; i++){
        for(let j = 0; j<gs[i].length; j++){
            if(gs[i][j] !== 0){
                return false
            }
        }
    }

    console.log("We have a draw....");
    return true;
}

function generate_game_id(){
    return (Math.floor(Math.random() * 100000000000) + 1);
}

//Classes ------------------------------------------------------------------------------------------

//constructor for a User object
function User(userID ,socketID){
    this.userID = userID;
    this.socketID = socketID;
    this.userNickname = randomUsername();
    this.userColour = "000000";
    this.status = true;
}

function Game(gameID, player1ID, player2ID){
    this.gameID = gameID;
    this.player1ID = player1ID;
    this.player2ID = player2ID;
    //for now player one always starts
    this.playerTurn = player1ID;
    this.gamestate =        [[0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0]];
}