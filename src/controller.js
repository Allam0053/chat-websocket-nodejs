import $ from "jquery";
import Konva from "konva";
import { client } from "websocket";
import {
    showIncomingChat,
    showSendingChat,
    checkAll,
    getAllChecked,
    showLeaderboard,
} from "./chat";
import { messageToServer, sendDataToServer } from "./client";

/**
 * Global Variables
 */
let players = new Array();

class Player {
    constructor(id, name, num, x, y, rotation, health, score) {
        this.id = id;
        this.name = name;
        this.num = num;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.health = 100;

        /**
         * detailScore = [
         *  { playerId: "", score: 0 },
         *  ...
         * ]
         *
         * exclude this own player ID
         * this player score comulated from others
         *
         * in order to send other player's score they get from our health
         */
        this.detailScore = [];
        this.score = 0;

        this.obj = initPlayer(this.id, this.num);
        this.atkMode = false;
    }
}
let myID = "ID1";
const charSize = 70;
const velocity = 5;
const angularvelocity = 100;
let keydowns = [];
let typing = false;
let atkGun = null;
let atkSword = null;
let swordChar = [
    { x: -5, y: -charSize / 4, rotation: 30 },
    { x: 12, y: -charSize / 2, rotation: 45 },
    { x: -charSize / 2, y: 0, rotation: 0 },
    { x: -charSize / 2 - 5, y: -10, rotation: 0 },
];
let movingTimeout = -1;

/**
 * Stage : Ukuran canvas dan propertinya
 */
var stage = new Konva.Stage({
    container: "canvascontainer",
    width: 1100,
    height: 700,
});

/**
 * Base Layer : Tembok
 */
var baseLayer = new Konva.Layer();

Konva.Image.fromURL("/assets/tembok.png", function (tembok) {
    tembok.setAttrs({
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
    });
    baseLayer.add(tembok);
});

function initPlayer(id, num) {
    let char = null;
    var charObj = new Image();
    var swordObj = new Image();
    swordObj.src = "/assets/sword.png";
    charObj.src = "/assets/char" + num + ".png";
    charObj.onload = function () {
        char = new Konva.Group({
            x: players[id].x,
            y: players[id].y,
            offsetX: charSize / 2,
            offsetY: charSize / 2,
            rotation: players[id].rotation,
            width: charSize,
            height: charSize,
        });

        var imgChar = new Konva.Image({
            x: 0,
            y: 0,
            image: charObj,
            width: charSize,
            height: charSize,
        });

        var txtChar = new Konva.Text({
            // x: charSize / 2 - 15,
            y: charSize,
            text: players[id].name,
            fontSize: 10,
            fontFamily: "Inter",
            fill: "white",
            width: charSize,
            align: "center",
        });

        var txthealth = new Konva.Text({
            y: -10,
            text: players[id].health,
            fontSize: 10,
            fontFamily: "Inter",
            fill: "white",
            width: charSize,
            align: "center",
            id: "healthText",
        });

        var txtscore = new Konva.Text({
            y: 60,
            text: players[id].score,
            fontSize: 10,
            fontFamily: "Inter",
            fill: "white",
            width: charSize,
            align: "center",
            id: "scoreText",
        });

        var imgSword = new Konva.Image({
            x: swordChar[num - 1].x,
            y: swordChar[num - 1].y,
            image: swordObj,
            width: charSize,
            height: charSize,
            rotation: swordChar[num - 1].rotation,
        });

        char.add(imgChar);
        char.add(txtChar);
        char.add(txthealth);
        char.add(txtscore);
        char.add(imgSword);

        players[id].obj = char;

        baseLayer.add(char);
    };
}

/**
 * Stage Adder : Tambahkan layer ke stage
 */
stage.add(baseLayer);

/**
 * Looper sender
 *
 */
setInterval(() => {
    if (Object.keys(players).length > 0) {
        // console.log("DARI CLIENT", players);
        const data = {
            sender: myID,
            ...Object.assign({}, players),
        };
        sendDataToServer(data);
    }
    updateAllScore();
}, 1000 / 30);

/**
 * Animator : Loop and update the canvas
 */
var anim = new Konva.Animation(function (frame) {
    for (const key in players) {
        updatePlayers(players[key].id);
    }

    var angleDiff = (frame.timeDiff * angularvelocity) / 100;

    if (atkSword) {
        players[myID].rotation += angleDiff;
    }

    if (atkGun) {
    }
}, baseLayer);
anim.start();

function updatePlayers(id) {
    let player = players[id];
    if (player) {
        if (player.obj != null) {
            player.obj.x(player.x);
            player.obj.y(player.y);
            player.obj.rotation(player.rotation);
        }
    }
}

function addOtherPlayerScore(key) {
    const otherPlayerScoredInThisPlayer = players[myID].detailScore.find(
        (e) => e.playerId === players[key].id
    );
    if (
        players[myID].detailScore.length === 0 ||
        typeof otherPlayerScoredInThisPlayer === "undefined"
    ) {
        players[myID].detailScore.push({ playerId: players[key].id, score: 1 });
    } else {
        players[myID].detailScore.find(
            (e) => e.playerId === players[key].id
        ).score += 1;
    }
}

function updateAllScore() {
    for (const key in players) {
        players[key].score = 0;
    }
    for (const key in players) {
        players[key].detailScore.forEach((e) => {
            players[e.playerId].score += e.score;
        });
    }
    for (const key in players) {
        players[key].obj
            .getChildren(function (node) {
                return node.getAttr("id") === "scoreText";
            })[0]
            .setAttr("text", players[key].score);
    }
}

function updateOtherPlayers(clients) {
    for (const key in clients) {
        if (key === "sender") {
            continue;
        }
        if (clients[key].id != myID) {
            // console.log("Updating client #" + clients[key].id);
            players[key].x = clients[key].x;
            players[key].y = clients[key].y;
            players[key].rotation = clients[key].rotation;
            players[key].health = clients[key].health;
            players[key].score = clients[key].score;
            players[key].detailScore = clients[key].detailScore;

            if (
                clients[key].health > 0 &&
                clients[key].atkMode &&
                clients[key].atkX < players[myID].x + 50 &&
                clients[key].atkX > players[myID].x - 50 &&
                clients[key].atkY < players[myID].y + 50 &&
                clients[key].atkY > players[myID].y - 50 &&
                players[myID].health > 0
            ) {
                // console.log('AW AKU TERTUSUK JANJI MANISMU!');
                players[myID].health -= 1;
                addOtherPlayerScore(key);
            }
        }
        players[key].obj
            .getChildren(function (node) {
                return node.getAttr("id") === "healthText";
            })[0]
            .setAttr("text", players[key].health);
    }
}

function checkConsoleLog() {
    console.log(players[myID].detailScore);
    console.log(players);
}

/**
 * Helper : Anything
 */
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

/**
 * Event Listener : Keyboard
 */
$(document.body).on("keydown", function (ev) {
    // console.log(ev.key)
    if (
        (ev.key == " " || ev.key == "ArrowRight" || ev.key == "ArrowLeft") &&
        ev.target == document.body
    ) {
        ev.preventDefault();
    }
    if (!typing) {
        if (ev.key == "w") keydowns["w"] = true;
        if (ev.key == "s") keydowns["s"] = true;
        if (ev.key == "a") keydowns["a"] = true;
        if (ev.key == "d") keydowns["d"] = true;
        if (ev.key == "p") attackOtherPlayers();
        if (ev.key == "h") checkConsoleLog();

        let player = players[myID];

        if (player) {
            if (
                player.x < stage.width() &&
                player.x > 0 &&
                player.y > 0 &&
                player.y < stage.height()
            ) {
                startMoving(keydowns);
            } else {
                // Jika nabrak, respawn di tempat random
                player.x = randomX();
                player.y = randomY();
            }
        }
    }
});

function stopMoving() {
    clearTimeout(movingTimeout);
    movingTimeout = -1;
}

function startMoving(keydowns) {
    if (movingTimeout === -1) {
        movingLoop(keydowns);
    }
}

function move(keydowns) {
    const player = players[myID];
    let s = Math.sin((player.rotation * Math.PI) / 180);
    let c = Math.cos((player.rotation * Math.PI) / 180);

    if (keydowns["w"]) {
        player.x = player.x + velocity * s;
        player.y = player.y - velocity * c;
    }
    if (keydowns["s"]) {
        player.x = player.x - velocity * s;
        player.y = player.y + velocity * c;
    }
    if (keydowns["a"]) player.rotation -= velocity;
    if (keydowns["d"]) player.rotation += velocity;
}

function movingLoop(keydowns) {
    move(keydowns);
    movingTimeout = setTimeout(movingLoop, 10, keydowns);
}

$(document.body).on("keyup", function (ev) {
    keydowns[ev.key] = false;
    if (ev.key == "w") keydowns["w"] = false;
    if (ev.key == "s") keydowns["s"] = false;
    if (ev.key == "a") keydowns["a"] = false;
    if (ev.key == "d") keydowns["d"] = false;

    if (!keydowns["w"] && !keydowns["s"] && !keydowns["a"] && !keydowns["d"]) {
        stopMoving();
    }
});

/**
 * Event Listener : Click
 */
stage.on("click", attackOtherPlayers);

function attackOtherPlayers() {
    var pos = stage.getRelativePointerPosition();
    console.log(pos);

    // Muter selama 1 detik
    atkSword = true;
    players[myID].atkMode = true;
    // TODO: adjust attack location to the sword position
    // below code still use the center of the character
    players[myID].atkX = players[myID].x;
    players[myID].atkY = players[myID].y;
    setTimeout(() => {
        atkSword = false;
        players[myID].atkMode = false;
        delete players[myID].atkX;
        delete players[myID].atkY;
    }, 1000);
}

/**
 * Add players by received data
 *
 */
function addPlayer(arr, IDku) {
    if (IDku) myID = IDku;

    let obj = null;
    for (let i in arr) {
        obj = arr[i];
        if (players[obj.clientId] == null) {
            players[obj.clientId] = new Player(
                obj.clientId,
                obj.name,
                obj.num,
                obj.x,
                obj.y,
                obj.rotation,
                obj.health,
                obj.score
            );
        }
    }
}

/**
 * Chat : Send and receive message
 */
$("#chat-input").focus((e) => (typing = true));
$("#chat-input").blur((e) => (typing = false));

$("#btnSend").click(function () {
    sendMsg();
    getAllChecked();
});
$("#chat-input").on("keypress", (e) => {
    if (e.key == "Enter") {
        e.preventDefault();
        sendMsg();
    }
});
$("#checkallbtn").click(function () {
    checkAll();
});

function sendMsg() {
    let msg = $("#chat-input").val();
    $("#chat-input").val("");
    showSendingChat(msg);

    messageToServer(msg, getAllChecked());
}

function receiveMsg(sender, msg) {
    showIncomingChat(sender, msg);
}

export { receiveMsg, addPlayer, updateOtherPlayers };
