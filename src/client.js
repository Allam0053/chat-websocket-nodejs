import $ from "jquery";

/**
 * File for configuring connection between client and server
 */

let clientId = null;
let roomId = null;
let playerColor = null;

const PORT_SERVER = 8081;

let ws = new WebSocket("ws://localhost:" + PORT_SERVER);
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtRoomId = document.getElementById("txtRoomId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");

// wiring events
btnJoin.addEventListener("click", e => {

    if (roomId === null)
        roomId = txtRoomId.value;
    
    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "roomId": roomId
    }

    console.log(payLoad);

    ws.send(JSON.stringify(payLoad));

})

function createRoom() {
    const payLoad = {
        "method": "create",
        "clientId": clientId
    }

    ws.send(JSON.stringify(payLoad));  
}
btnCreate.addEventListener("click", createRoom);

function messageToServer(msg) {
    const payLoad = {
        "method": "message",
        "clientId": clientId,
        "message": msg
    }

    ws.send(JSON.stringify(payLoad));
}

$('#room-id').on('click', function() {
    navigator.clipboard.writeText(roomId);
    alert("Copied text: " + roomId);
});
$('#room-id').on('mouseover', function() {
    if(roomId != 'Not Joined'){
        if(roomId)
            this.innerText = "Click To Copy RoomID";
    }
});
$('#room-id').on('mouseout', function() {
    if(roomId != 'Not Joined'){
        if(roomId)
            this.innerText = roomId;
        else
            this.innerText = 'Not Joined'
    }
});

ws.onmessage = message => {
    // message.data
    const response = JSON.parse(message.data);

    // connect
    if (response.method === "connect"){
        clientId = response.clientId;
        console.log("Client id set successfully " + clientId)
    }

    // create
    if (response.method === "create"){
        roomId = response.room.id;
        $('#room-id').text(roomId);
    }


    // update
    if (response.method === "update"){
        
        // not implemented

    }

    // join
    if (response.method === "join"){
        roomId = response.room.id;
        $('#room-id').text(roomId);
    }
}

export { messageToServer };