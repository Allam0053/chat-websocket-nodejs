const app = require("express")();

const PORT_CLIENT = 8080
const PORT_SERVER = 8081

// app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"));
app.listen(PORT_CLIENT, () => console.log("Client listening on port " + PORT_CLIENT));

const express = require("express");
const http = require("http");
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(PORT_SERVER, () => console.log("Server listening on port " + PORT_SERVER));

const clients = {};
const rooms = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    // connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        // a client want to create a new room
        if (result.method === "create") {
            const clientId = result.clientId;
            const roomId = guidRoom();
            rooms[roomId] = {
                "id": roomId,
                "clients": [{"clientId":clientId}],
                "messages": []
            }

            const payLoad = {
                "method": "create",
                "room" : rooms[roomId]
            }

            console.log(clientId + ' has created #' + roomId);

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        // a client want to join
        if (result.method === "join") {

            const clientId = result.clientId;
            const roomId = result.roomId;
            const room = rooms[roomId];
            
            room.clients.push({
                "clientId": clientId,
            })

            const payLoad = {
                "method": "join",
                "room": room
            }
            console.log(clientId + ' has joined #' + roomId);

            // loop through all clients and tell them that people has joined
            room.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        // chat
        if (result.method === "message") {
            // console.log(result)
            const clientId = result.clientId;
            const roomId = result.roomId;
            const room = rooms[roomId];
            
            // rooms[roomId].messages.push(
            //     {
            //         "sender": clientId,
            //         "message": result.message
            //     }
            // )

            // Sent back the messages to all client in the same room
            const payLoad = {
                "method": "message",
                "messages": {
                    "sender": clientId,
                    "message": result.message
                }
            }

            room.clients.forEach(c => {
                console.log(c.clientId)
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })

        }
    })

    // generate a new clientId
    const clientId = guidUser();
    clients[clientId] = {
        "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }

    //send back the client connect
    connection.send(JSON.stringify(payLoad))
})


function updateRoomState(){
    for (const g of Object.keys(rooms)) {
        const room = rooms[g]
        const payLoad = {
            "method": "update",
            "room": room
        }

        room.clients.forEach(c=> {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    setTimeout(updateGameState, 500);
}



function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guidRoom = () => ('R' + S4()).toUpperCase();
const guidUser = () => 'User' +( S4() ).toLowerCase();
// const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();