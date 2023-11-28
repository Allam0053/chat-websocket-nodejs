const app = require("express")();

// const PORT_CLIENT = 8080;
const PORT_SERVER = 8081;

// app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"));
// app.listen(PORT_CLIENT, () =>
//     console.log("Client listening on port " + PORT_CLIENT)
// );

const express = require("express");
const http = require("http");
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(PORT_SERVER, () =>
    console.log("Server listening on port " + PORT_SERVER)
);

const clients = {};

/*
rooms = {
    roomId: {
        clients: []
    }
    ...
}
*/
const rooms = {};

/**
latestResultClients = {
    roomId: {
        clientId: {class Player from controller.js},
        {otherClientId}: {...}
    },
    {otherRoomId}: {...}
    sender: latestSenderId
}

becareful of sender
 */

const globalRoom = {
    clients: new Set(),
    messages: []
}

const latestResultClients = {};

const wsServer = new websocketServer({
    httpServer: httpServer,
});

let connectionObjectFromRequestCallback

wsServer.on("connect", (conn) => console.log('new connection', conn == connectionObjectFromRequestCallback));
wsServer.on("close", (conn) => console.log('someone disconnected'));
wsServer.on("request", (request) => {

    console.log('new request')

    // connect
    const connection = request.accept(null, request.origin);
    connectionObjectFromRequestCallback = connection;

    // generate a new clientId (always run in first connection)
    const generatedId = guidUser();
    clients[generatedId] = {
        connection: connection,
    };

    const payLoad = {
        clientId: generatedId,
        method: "connect-to-server",
        message: `welcome to server, ${generatedId}. you are in global room.`
    };
    globalRoom.clients.add(generatedId);

    //send back the client connect
    connection.send(JSON.stringify(payLoad));

    function currentConnectionHandlerFactory() {
        const clientId = generatedId;
        let roomId = '';
        return (message) => {
            const result = JSON.parse(message.utf8Data);
    
            //#region ============= chat handler ==========
            console.log(`${result.method}:${clientId}`)
    
            if (result.method === 'chat-connect') {
                const payLoad = {
                    method: "connect-to-server",
                    message: `welcome to server, ${clientId}. you are in global room.`
                };
                const con = clients[clientId].connection;
                con.send(JSON.stringify(payLoad));
                return;
            }
    
            if (result.method === 'chat-create') {
                roomId = guidRoom();
                rooms[roomId] = {
                    id: roomId,
                    clients: [
                        {
                            clientId: clientId,
                        },
                    ],
                    messages: [],
                };
                const room = rooms[roomId];
    
                const payLoad = {
                    method: "join",
                    room: room,
                    message: `welcome to room ${roomId}, ${clientId}`
                };
                console.log(clientId + " has created #" + roomId);
                globalRoom.clients.delete(clientId);
                // console.log(payLoad);
    
                const con = clients[clientId].connection;
                con.send(JSON.stringify(payLoad));
                return;
            }
    
            if (result.method === 'chat-join') {
                roomId = result.roomId;
                const room = rooms[roomId];
    
                if (!isRoomExist(roomId)) {
                    const payLoad = {
                        method: "error",
                        messages: {
                            sender: "client",
                            message: "Room does not exist",
                        },
                    };
                    clients[clientId].connection.send(JSON.stringify(payLoad));
                    return;
                }
                if (!isPlayerJoined(roomId, clientId)) {
                    room.clients.push({
                        clientId: clientId,
                    });
                }
    
                const payLoad = {
                    method: "join",
                    room: room,
                };
                console.log(clientId + " has joined #" + roomId);
                // console.log(payLoad);

                globalRoom.clients.delete(clientId);
    
                // loop through all clients and tell them that people has joined
                room.clients.forEach((c) => {
                    clients[c.clientId].connection.send(JSON.stringify(payLoad));
                });
                return;
            }
    
            if (result.method === 'chat-log') {
                let clientRoom = {};
                let clientRoomId = '';
                Object
                    .entries(rooms)
                    .forEach(
                        ([roomIdIter, roomIter]) => Object
                            .entries(roomIter)
                            .forEach(([clientIdIter, clientIter]) => {
                                if (clientIdIter === clientId) {
                                    clientRoom = roomIter;
                                    clientRoomId = roomIdIter;
                                }
                            })
                    )
                const payload = {
                    method: "log",
                    messages: `${clientId} is in ${clientRoomId}`,
                    client: {
                        clientId,
                    },
                    room: clientRoom,
                }
                clients[clientId].connection.send(JSON.stringify(payload))
                return;
            }
    
            if (result.method === "message") {
                const room = rooms[roomId];
                const target = result.target;

                if (!roomId && !target) {
                    globalRoom.messages.push({
                        sender: clientId,
                        message: result.message
                    });
                    // Sent back the messages to all client in the same room
                    const payLoad = {
                        method: "message",
                        messages: {
                            sender: clientId,
                            receiver: 'global',
                            message: result.message,
                        },
                    };
                    globalRoom.clients.forEach((globalRoomClientId) => {
                        console.log('broadcasting to', globalRoomClientId)
                        clients[globalRoomClientId].connection.send(
                            JSON.stringify(payLoad)
                        );
                    })
                    return;
                }
    
                // Sent back the messages to all client in the same room
                const payLoad = {
                    method: "message",
                    messages: {
                        sender: clientId,
                        message: result.message,
                    },
                };
    
                room.clients.forEach((c) => {
                    // Send only to the target
                    if (target.includes(c.clientId)) {
                        clients[c.clientId].connection.send(
                            JSON.stringify(payLoad)
                        );
                    }
                });
                return;
            }

            if (result.method === 'get-global-message') {
                clients[clientId].connection.send(
                    JSON.stringify({messages: globalRoom.messages})
                )
                return;
            }
            //#endregion ========== chat handler ==========
        }
    }

    connection.on("open", () => console.log("opened!"));
    connection.on("close", () => console.log("closed!"));
    connection.on("message", currentConnectionHandlerFactory());
});

function isRoomExist(roomId) {
    return typeof rooms[roomId] !== "undefined";
}

/**
 *
 * @param {*} roomId | number
 * @param {*} clientId | number
 * @returns true if player exists in the room | boolean
 */
function isPlayerJoined(roomId, clientId) {
    const room = rooms[roomId];
    if (
        typeof room.clients.find((o) => o.clientId === clientId) === "undefined"
    ) {
        return false;
    }
    return true;
}

function updateRoomState() {
    for (const g of Object.keys(rooms)) {
        const room = rooms[g];
        const payLoad = {
            method: "update",
            room: room,
        };

        room.clients.forEach((c) => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad));
        });
    }

    setTimeout(updateGameState, 500);
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guidRoom = () => ("R" + S4()).toUpperCase();
const guidUser = () => "User" + S4().toLowerCase();
// const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

/**
 * Helper : Anything
 */
const charSize = 70;
const stageH = 700;
const stageW = 1100;

function randomY() {
    return Math.random() * (stageH - charSize * 2) + charSize;
}

function randomX() {
    return Math.random() * (stageW - charSize * 2) + charSize;
}

function randomRotation() {
    return Math.random() * 360;
}

//#region ============= messaging json ==========
/**
 * 
1. user1 connect server, retrieve clientId
{
    "method": "chat-connect"
}

2. user1 create room
{
    "clientId": "user1",
    "method": "chat-create"
}

3. user2 join room
{
    "clientId": "user1",
    "method": "chat-join"
}

4. user2 
 */
//#endregion ========== messaging json ==========