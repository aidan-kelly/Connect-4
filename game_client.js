//I think this works as a 2d array
//later on we will recieve gs from server instead of making our own here. 
let gamestate =     [[0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0]];

//indicates if it is our turn.
//turn = -1 when not in a game.
//turn = 0 if opponent turn.
//turn = 1 if our turn. 
let turn = -1;
let game_id = -1;
let p1ID = -1;
let p2ID = -1;
let valid_moves = [0,0,0,0,0,0,0];

//executes when the dom is ready
$(function(){
    var socket = io();
    let cookies = document.cookie;
    
    $(".box").click(function(){
        //returns what column was selected.
        let column_choice = this.id.split("_")[1];
        console.log(`You clicked on ${column_choice}.`);
        if(turn === 1){
            //send to server.
            socket.emit("game_move", game_id, uid, column_choice);
            turn = 0;
        }else{
            alert("Not your turn!");
        }
    });


    //check to see if we have a uid cookie
    let uid = getCookie("uid");
    if(uid == ""){
        console.log("No uid cookie");
        document.cookie = `uid=${(Math.random() * 100000000000000000).toString()}`;
        uid = getCookie("uid");
    }else{
        console.log(`UID Cookie found: ${uid}.`);
    }

    //once we have created our uid, tell server.
    socket.emit("connection_made", uid);

    socket.on("game_start", function(gid, gs, player1ID, player2ID, firstTurnID){
        //we are in a game
        if(player1ID === uid || player2ID === uid){
            gamestate = gs;
            game_id = gid;
            if(firstTurnID === uid){
                turn = 1;
                $(".turn_indicator").text("It's your turn.");
            }else{
                turn = 0;
                $(".turn_indicator").text("Waiting on opponent to make a move.");
            }
            p1ID = player1ID;
            p2ID = player2ID;

            if(p1ID === uid){
                $(".player_indicator").text("You are player 1.");
            }else{
                $(".player_indicator").text("You are player 2.");
            }

            console.log("IT'S GAME TIME BB.");
            display_board(gamestate);
        //we are not in a game
        }
    });

    socket.on("game_update", function(gid, gs, playerTurn){
        if(gid === game_id){
            gamestate = gs;
            display_board(gamestate, p1ID, p2ID);
            console.table(gamestate);
            console.log(playerTurn);
            if(uid === playerTurn){
                turn = 1;
                $(".turn_indicator").text("It's your turn.");
            }else{
                $(".turn_indicator").text("Waiting on opponent to make a move.");
            }
        } 
    });

    socket.on("game_over", function(gid, winnerID, gs){
        if(gid === game_id){
            gamestate = gs;
            display_board(gamestate, p1ID, p2ID);
            if(uid === winnerID){
                $(".game_over").text("You win!!!");
            }else{
                $(".game_over").text("You lose!!!");
            }
        }
    });
});

//Functions ----------------------------------------------------------------------------------------

//takes in a gamestate, the player that made the move, and the requested move
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

//this function updates the divs to match the gamestate
function display_board(gs, player1ID, player2ID){
    for(let i = 0; i<gs.length; i++){
        for(let j = 0; j<gs[i].length; j++){
            let div_id = i.toString() + "_" + j.toString();
            if(gs[i][j] === player1ID){
                $(`#${div_id}`).css("background-color","red");
            }else if(gs[i][j] === player2ID){
                $(`#${div_id}`).css("background-color","blue");
            }
        }
    }
}

//returns the value of a cookie
function getCookie(cookie_name){
    let name = cookie_name + "=";
    let cookies = document.cookie;
    let split_cookies = cookies.split(";");

    for(let i = 0; i <split_cookies.length; i++) {
        var c = split_cookies[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
}



//Classes ------------------------------------------------------------------------------------------