var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var port = 3000;
let user_list = new Object();

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
    });

    socket.on("disconnect", function(){
        console.log("User disconnected!");
        //this is where we would update their status in the users list
        try{
            user_list[new_user.userID].status = false;
        }catch(err){
            console.log("Weird error from last assignment lol.")
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
    this.gamestate =        [[0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0]];
}