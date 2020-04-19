//executes when the dom is ready
var p1_colour = ["red", "#4ecca3", "#4c586f"];
var p2_colour = ["blue", "#ee562b", "#3e3e3b"];
var background_colour = ["#fff", "#232931", "#a2aab0"];
var wrapper_colour = ["#fff", "#232931", "#a2aab0"];
var box_colour = ["#444", "#696e76", "white"];
var valid_move_colour = ["#777", "#9ca1a9", "#cbc5c1"];
var font_colour = ["black", "white", "black"];

$(function(){
    var socket = io();
    let cookies = document.cookie;

    

    let theme = getCookie("theme");
    if(theme == ""){
        console.log("No theme cookie");
        document.cookie = `theme=0`;
        theme = getCookie("theme");
        console.log(`theme = ${theme} is type ${typeof(theme)}`);
    }else{
        console.log(`theme Cookie found: ${theme}.`);
    }

    //checks what theme is saved.
    $('input:radio[name=theme_group]')[Number(theme)].checked = true;



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
    let p1_username = window.localStorage.getItem("player1_username");
    let p2_username = window.localStorage.getItem("player2_username");
    let opponenet_username = "";
    let player_username = "";
    

    $(".box").click(function(){
        //returns what column was selected.
        let column_choice = this.id.split("_")[1];
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

    $(".theme_button").click(function(){
        document.cookie = `theme=${this.value}`;
        theme = getCookie("theme");
        display_board(gamestate, p1ID, p2ID, theme);
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

    if(uid === p1ID){
        opponenet_username = p2_username;
        player_username = p1_username;
    }else{
        opponenet_username = p1_username;
        player_username = p2_username;
    }
    
    if(uid === window.localStorage.getItem("player_turn")){
        turn = 1;
        $(".turn_indicator").text(`It's your turn ${player_username}.`);
    }else{
        turn = 0;
        $(".turn_indicator").text(`Waiting on ${opponenet_username} to make a move.`);
    }

    display_board(gamestate, p1ID, p2ID, theme);

    socket.on("game_update", function(gid, gs, playerTurn){
        if(gid === game_id){
            gamestate = gs;
            display_board(gamestate, p1ID, p2ID, theme);
            console.table(gamestate);
            console.log(playerTurn);
            if(uid === playerTurn){
                turn = 1;
                $(".turn_indicator").text(`It's your turn ${player_username}.`);
            }else{
                $(".turn_indicator").text(`Waiting on ${opponenet_username} to make a move.`);
            }
        } 
    });

    socket.on("game_over", function(gid, winnerID, gs){
        if(gid === game_id){
            gamestate = gs;
            display_board(gamestate, p1ID, p2ID, theme);
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
function display_board(gs, player1ID, player2ID, theme){
    console.log(`the theme cookie is ${theme}`);
    $(".wrapper").css("background-color", `${wrapper_colour[Number(theme)]}`);
    $("html").css("background-color", `${background_colour[Number(theme)]}`);
    $("div").css("color", `${font_colour[Number(theme)]}`);
    $("input").css("color", `${font_colour[Number(theme)]}`);
    for(let i = 0; i<gs.length; i++){
        for(let j = 0; j<gs[i].length; j++){
            let div_id = i.toString() + "_" + j.toString();
            if(gs[i][j] === player1ID){
                $(`#${div_id}`).css("background-color", `${p1_colour[Number(theme)]}`);
                $(`#${div_id}`).css("border", `2px solid ${font_colour[Number(theme)]}`);
            }else if(gs[i][j] === player2ID){
                $(`#${div_id}`).css("background-color",`${p2_colour[Number(theme)]}`);
                $(`#${div_id}`).css("border", `2px solid ${font_colour[Number(theme)]}`);
            }else if(i === 0 && gs[i][j] === 0){
                $(`#${div_id}`).css("background-color",`${valid_move_colour[Number(theme)]}`);
                $(`#${div_id}`).css("border", `2px solid ${font_colour[Number(theme)]}`);
            }else{
                $(`#${div_id}`).css("background-color",`${box_colour[Number(theme)]}`);
                $(`#${div_id}`).css("border", `2px solid ${font_colour[Number(theme)]}`);
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