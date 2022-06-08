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
const latestResultClients = {};

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
                score: [],
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

            let sendScoreInterval = setInterval(() => {
                sendScore(roomId);
            }, 500);
            let sendLastUpdateInterval = setInterval(() => {
                sendLastUpdateFromServer(roomId);
            }, 20);

            setTimeout(() => {
                gameOver(roomId, sendScoreInterval, sendLastUpdateInterval);
            }, 60000);
        }

        // a client want to join
        if (result.method === "join") {
            const clientId = result.clientId;
            const roomId = result.roomId;
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
            const senderKey = result.clients["sender"];
            if (typeof latestResultClients[roomId] === "undefined") {
                latestResultClients[roomId] = result.clients;
            }
            latestResultClients[roomId][senderKey] = result.clients[senderKey];
        }
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

function gameOver(roomId, sendScoreInterval, sendLastUpdateInterval) {
    clearInterval(sendScoreInterval);
    clearInterval(sendLastUpdateInterval);

    const room = rooms[roomId];
    const ranking = rankingMaker(roomId);
    const payLoad = {
        method: "gameover",
        roomId: roomId,
        ranking: ranking,
    };
    room.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
    console.log("gameover in: " + roomId);
}

function sendScore(roomId) {
    const room = rooms[roomId];
    const ranking = rankingMaker(roomId);
    const payLoad = {
        method: "score",
        scores: ranking,
    };

    room.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
}

function sendLastUpdateFromServer(roomId) {
    const room = rooms[roomId];

    const payLoad = {
        method: "update",
        clients: latestResultClients[roomId],
    };

    room.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
}

function rankingMaker(roomId) {
    /**
    [
        {
            playerId: string,
            score: number
        }
    ]
     */
    const scoreByPlayer = [];

    for (const key in latestResultClients[roomId]) {
        if (key === "sender") continue;
        latestResultClients[roomId][key].detailScore.forEach((d) => {
            if (
                scoreByPlayer.length === 0 ||
                typeof scoreByPlayer.find(
                    (playerScore) => playerScore.playerId === d.playerId
                ) === "undefined"
            ) {
                scoreByPlayer.push({ playerId: d.playerId, score: d.score });
            } else {
                scoreByPlayer.find(
                    (playerScore) => playerScore.playerId === d.playerId
                ).score += d.score;
            }
        });
    }

    scoreByPlayer.sort((a, b) => b.score - a.score);

    return Object.assign({}, scoreByPlayer);
}

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
