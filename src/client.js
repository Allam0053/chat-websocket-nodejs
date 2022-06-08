import $ from "jquery";
import {
    showIncomingChat,
    showSystemChat,
    addPlayerToList,
    showLeaderboard,
    removeAllPalyerList,
} from "./chat";
import { addPlayer, updateOtherPlayers } from "./controller";

/**
 * File for configuring connection between client and server
 */

// USERNAME != CLIENTID
let clientId = null;
let username = null;
let roomId = null;
let playerColor = null;

let messages = [];

const PORT_SERVER = 8081;

let ws = new WebSocket("ws://localhost:" + PORT_SERVER);
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtRoomId = document.getElementById("txtRoomId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");

// wiring events
btnJoin.addEventListener("click", (e) => {
    if (roomId === null) roomId = txtRoomId.value;

    const payLoad = {
        method: "join",
        clientId: clientId,
        roomId: roomId,
    };

    // console.log(payLoad);

    ws.send(JSON.stringify(payLoad));
    updateCanvasState(true);
});

function createRoom() {
    const payLoad = {
        method: "create",
        clientId: clientId,
    };

    ws.send(JSON.stringify(payLoad));
    updateCanvasState(true);
}
btnCreate.addEventListener("click", createRoom);

function messageToServer(msg, target) {
    const payLoad = {
        method: "message",
        clientId: clientId,
        roomId: roomId,
        message: msg,
        target: target,
    };

    ws.send(JSON.stringify(payLoad));
}

$("#room-id").on("click", function () {
    navigator.clipboard.writeText(roomId);
    // alert("Copied text: " + roomId);
});

// $('#room-id').on('mouseover', function() {
//     if(roomId != 'Not Joined'){
//         if(roomId)
//             this.value = "Copy RoomID";
//     }
// });
// $('#room-id').on('mouseout', function() {
//     if(roomId != 'Not Joined'){
//         if(roomId)
//             this.value = roomId;
//         else
//             this.value = 'Not Joined'
//     }
// });

$("#username").on("change", function () {
    username = this.value;
});

function updateCanvasState(shown) {
    $("#canvascontainer").toggleClass("hidden");
    $("#splash").toggleClass("hidden");

    $("#btnSend").prop("disabled", !shown);
    $("#chat-input").prop("disabled", !shown);
}

ws.onmessage = (message) => {
    // message.data
    const response = JSON.parse(message.data);

    // connect
    if (response.method === "connect") {
        clientId = response.clientId;
        $("#username").val(clientId);
        username = clientId;
    }

    // create
    if (response.method === "create") {
        roomId = response.room.id;
        $("#room-id").prop("disabled", false);
        $("#room-id").val(roomId);
    }

    // update
    if (response.method === "update") {
        // Update players GUI based oon received pose
        // console.log("DARI SERVER: ", response.clients);
        updateOtherPlayers(response.clients);
    }

    // join
    if (response.method === "join") {
        roomId = response.room.id;
        $("#room-id").prop("disabled", false);
        $("#room-id").val(roomId);

        let roomClients = response.room.clients;
        let newPlayer = roomClients[roomClients.length - 1];

        // Setiap menerima join baru, update UI player list
        removeAllPalyerList();
        removeAllPalyerList();
        roomClients.forEach((client) => {
            addPlayerToList(client.clientId);
        });
        // addPlayerToList(newPlayer.clientId);

        // Draw notification of new player has joined
        showSystemChat(newPlayer.clientId + " has joined the room");

        // Gambar ulang semua player
        addPlayer(roomClients, clientId);
    }

    // chat
    if (response.method === "message") {
        messages = response.messages;
        if (messages.sender != clientId) {
            showIncomingChat(messages.sender, messages.message);
        }
    }

    // error msg
    if (response.method === "error") {
        messages = response.messages;
        showIncomingChat(messages.sender, messages.message);
    }

    // incoming updated score
    if (response.method === "score") {
        // console.log(response.scores);
        showLeaderboard(response.scores);
    }
};

function sendDataToServer(clients) {
    const payLoad = {
        method: "update",
        roomId: roomId,
        clients: clients,
    };

    // console.log("DARI CLIENT", payLoad);
    ws.send(JSON.stringify(payLoad));
}

export { messageToServer, sendDataToServer };
