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

btnCreate.addEventListener("click", e => {

    const payLoad = {
        "method": "create",
        "clientId": clientId
    }

    ws.send(JSON.stringify(payLoad));

})

function messageToServer(msg) {
    const payLoad = {
        "method": "message",
        "clientId": clientId,
        "message": msg
    }

    ws.send(JSON.stringify(payLoad));
}

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
        console.log("Room successfully created with id " + response.room.id)  
    }


    // update
    if (response.method === "update"){
        
        // not implemented

    }

    // join
    if (response.method === "join"){
        console.log(response)
    }
}

export { messageToServer };