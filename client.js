//I think this works as a 2d array
//later on we will recieve gs from server instead of making our own here. 
let gamestate =     [[0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0]];

//executes when the dom is ready
$(function(){
    var socket = io();
    let cookies = document.cookie;

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

    //here we will add the client logic for the game
    display_board(gamestate);
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
                console.table(gs);
                return gs;
            }
        }

    //move is not valid
    }else{
        return gs;
    }
}

//this function updates the divs to match the gamestate
function display_board(gs){
    for(let i = 0; i<gs.length; i++){
        for(let j = 0; j<gs[i].length; j++){
            let div_id = i.toString() + "_" + j.toString();
            if(gs[i][j] === 1){
                $(`#${div_id}`).css("background-color","red");
            }else if(gs[i][j] === 2){
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