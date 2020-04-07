//executes when the dom is ready
$(function(){
    var socket = io();
    let cookies = document.cookie;

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
    let game_id = window.localStorage.getItem("game_ID");
    let p1ID = window.localStorage.getItem("player1_ID");
    let p2ID = window.localStorage.getItem("player2_ID");
    
    $(".box").click(function(){
        //returns what column was selected.
        let column_choice = this.id.split("_")[1];
        console.log(`You clicked on ${typeof(column_choice)}.`);
        console.log(gamestate[0][column_choice]);
        if(gamestate[0][column_choice] === 0){
            console.log("Allowed move.");
        }else{
            alert("Not a valid move.");
            return;
        }

        if(turn === 1){
            //send to server.
            socket.emit("game_move", game_id, uid, column_choice);
            turn = 0;
        }else{
            alert("Not your turn!");
            return;
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

    if(uid === window.localStorage.getItem("player_turn")){
        turn = 1;
        $(".turn_indicator").text("It's your turn.");
    }else{
        turn = 0;
        $(".turn_indicator").text("Waiting on opponent to make a move.");
    }

    if(p1ID === uid){
        $(".player_indicator").text("You are player 1.");
    }else{
        $(".player_indicator").text("You are player 2.");
    }
    display_board(gamestate, p1ID, p2ID);

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
            $("#return_home").css("visibility", "visible");
            window.localStorage.clear();
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
            }else if(i === 0 && gs[i][j] === 0){
                $(`#${div_id}`).css("background-color","#777");
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