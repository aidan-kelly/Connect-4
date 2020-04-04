var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var port = 3000;
let user_list = new Object();
let game_list = new Object();
let match_making_queue = [];

var COLUMN_COUNT = 7;
var ROW_COUNT = 6;

http.listen(port, function(){
    console.log(`Listening on port ${port}.`);
});

//send index.html on connection
app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

//serve the css
app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + "/" + "style.css");
});

//serve the client js
app.get('/client.js', function(req, res) {
    res.sendFile(__dirname + "/" + "client.js");
});


//a new connection from a socket
io.on("connection", function(socket){
    console.log("User connected!");
    let new_user = new User();

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

        //a new user
        }else{
            //create a new user with uid and socket id
            new_user = new User(uid, socket.id);
            user_list[new_user.userID] = new_user;
            console.log(`A user connected. ID = ${user_list[uid].userNickname}.`);
        }

        //check if we can start a game.
        match_making_queue.push(new_user);
        if(match_making_queue.length >= 2){
            let p1 = match_making_queue.shift();
            let p2 = match_making_queue.shift();
            console.log(`We can start a match with ${p1.userNickname} and ${p2.userNickname}.`)
            let new_game = new Game(generate_game_id(), p1.userID, p2.userID);
            game_list[new_game.gameID] = new_game;
            console.log(game_list);
            console.log(user_list);

            //game_start message. 
            //gameID, gamestate, player1ID, player2ID, firstPlayerID
            io.emit("game_start", new_game.gameID, new_game.gamestate, new_game.player1ID, new_game.player2ID, new_game.playerTurn);

            
        }

    });

    socket.on("disconnect", function(){
        console.log("User disconnected!");
        //this is where we would update their status in the users list

        //NEED TO REMOVE USER FROM THE GAME QUEUE
        try{
            user_list[new_user.userID].status = false;
        }catch(err){
            console.log("Weird error from last assignment lol.")
        }
    });

    socket.on("game_move", function(game_id, playerID, move){
        let game = game_list[game_id];
        add_to_gamestate(game.gamestate, playerID, move);
        if(check_for_winning_move(game.gamestate, playerID)){
            io.emit("game_over", game_id, playerID, game.gamestate);
        }else{
            if(playerID === game.player1ID){
                game.playerTurn = game.player2ID;
            }else{
                game.playerTurn = game.player1ID;
            }
            io.emit("game_update", game_id, game.gamestate, game.playerTurn);
        }
    });


});

//Functions ----------------------------------------------------------------------------------------

//Returns a random username for new users
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
                console.table(gs);
                return gs;
            }
        }

    //move is not valid
    }else{
        return gs;
    }
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

    return false;

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