$(function(){
    var socket = io();
    let cookies = document.cookie;


    //will add user to the random game queue
    $("#random_button").click(function(){
        socket.emit("random_game_request", uid);
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


    socket.on("setup_ui", function(new_username, welcome_message, custom_game_id){
        $("#username_entry").attr("value", new_username);
        $("#username_message").text(welcome_message);
        $("#generated_gid").text(custom_game_id);
    });

    //will change the username for the user
    $("#username_input").submit(function(input_field){
        input_field.preventDefault();
        console.log($("#username_entry").val());
        socket.emit("username_change_request", uid, $("#username_entry").val());
    });

    $("#username_input").keydown(function(input_field){
        $("#username_change_error").text("");
    });

    $("#gid_input").keydown(function(input_field){
        $("#game_does_not_exist").text("");
        $("#game_is_full").text("");
    });


    //will send the gid to server and attempt to start the game. 
    $("#gid_input").submit(function(input_field){
        input_field.preventDefault();
        console.log($("#gid_entry").val());
        socket.emit("game_join_request", uid, $("#gid_entry").val());
    });

    socket.on("game_start", function(game_ID, player1_ID, player2_ID, player_turn, player1_username, player2_username){
        //moves us to a new page...........................
        if(uid === player1_ID || uid === player2_ID){
            window.localStorage.setItem("game_ID", game_ID);
            window.localStorage.setItem("player1_ID", player1_ID);
            window.localStorage.setItem("player2_ID", player2_ID);
            window.localStorage.setItem("player_turn", player_turn);
            window.localStorage.setItem("player1_username", player1_username);
            window.localStorage.setItem("player2_username", player2_username);
            window.location.replace("https://connect-4-aidan.herokuapp.com/game_board.html");
        }
    });

    socket.on("my_error", function(error_text, error_css_id){
        $(error_css_id).text(error_text);
    });
});




//Functions ----------------------------------------------------------------------------------------

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