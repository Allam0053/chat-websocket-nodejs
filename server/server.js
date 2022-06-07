const app = require("express")();

const PORT_CLIENT = 8080;
const PORT_SERVER = 8081;

// app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"));
app.listen(PORT_CLIENT, () =>
    console.log("Client listening on port " + PORT_CLIENT)
);

const express = require("express");
const http = require("http");
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(PORT_SERVER, () =>
    console.log("Server listening on port " + PORT_SERVER)
);

const clients = {};
const rooms = {};

/*
rooms = {
    roomId: {
        clients: []
    }
    ...
}
*/

const wsServer = new websocketServer({
    httpServer: httpServer,
});

wsServer.on("request", (request) => {
    // connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"));
    connection.on("close", () => console.log("closed!"));
    connection.on("message", (message) => {
        const result = JSON.parse(message.utf8Data);
        // a client want to create a new room
        if (result.method === "create") {
            const clientId = result.clientId;
            const roomId = guidRoom();
            rooms[roomId] = {
                id: roomId,
                clients: [
                    {
                        clientId: clientId,
                        x: randomX(),
                        y: randomY(),
                        rotation: randomRotation(),
                        health: 100,
                        detailScore: [],
                        score: 0,
                        num: 1,
                    },
                ],
                messages: [],
            };
            const room = rooms[roomId];

            const payLoad = {
                method: "join",
                room: room,
            };
            console.log(clientId + " has created #" + roomId);
            // console.log(payLoad);

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        // a client want to join
        if (result.method === "join") {
            const clientId = result.clientId;
            const roomId = result.roomId;
            const room = rooms[roomId];

            if (!isPlayerJoined(roomId, clientId)) {
                room.clients.push({
                    clientId: clientId,
                    x: randomX(),
                    y: randomY(),
                    rotation: randomRotation(),
                    health: 100,
                    detailScore: [],
                    score: 0,
                    num: room.clients.length + 1,
                });
            }

            const payLoad = {
                method: "join",
                room: room,
            };
            console.log(clientId + " has joined #" + roomId);
            // console.log(payLoad);

            // loop through all clients and tell them that people has joined
            room.clients.forEach((c) => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            });
        }

        // chat
        if (result.method === "message") {
            const clientId = result.clientId;
            const roomId = result.roomId;
            const room = rooms[roomId];
            const target = result.target;

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
        }

        if (result.method === "update") {
            const roomId = result.roomId;
            const room = rooms[roomId];
            const payLoad = {
                method: "update",
                clients: result.clients,
            };

            room.clients.forEach((c) => {
                if (c.clientId === result.clientId) {
                    return;
                }
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            });
        }

        // if (result.method === "score") {
        //     const roomId = result.roomId;
        //     const room = rooms[roomId];
        //     const clientId = result.clientId;
        //     const score = result.score;

        //     const payLoad = {
        //         method: "score",
        //         score: score,
        //     };

        //     room.clients.forEach((c) => {
        //         if (c.clientId === clientId) {
        //             c.score = score;
        //             c.detailScore.push(score);
        //         }
        //         clients[c.clientId].connection.send(JSON.stringify(payLoad));
        //     });
        // }
    });

    // generate a new clientId
    const clientId = guidUser();
    clients[clientId] = {
        connection: connection,
    };

    const payLoad = {
        method: "connect",
        clientId: clientId,
    };

    //send back the client connect
    connection.send(JSON.stringify(payLoad));
});

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
