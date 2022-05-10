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
            const roomId = guid();
            rooms[roomId] = {
                "id": roomId,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "room" : rooms[roomId]
            }

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

            // loop through all clients and tell them that people has joined
            room.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        if (result.method === "message") {
            console.log(result)
        }
    })

    // generate a new clientId
    const clientId = guid();
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
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();