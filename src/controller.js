import $ from "jquery";
import Konva from "konva";
import { showIncomingChat, showSendingChat } from "./chat";

/**
 * Global Variables
 */
class Player {
  constructor(id, name, num){
    this.id = id;
    this.name = name;
    this.num = num;
    this.x = randomX();
    this.y = randomY();
    this.rotation = randomRotation();
    this.obj = initPlayer(this.id, this.num);
  }
}
const myID = 'ID1';
let players = [];
const charSize = 70;
const velocity = 5;
let keydowns = [];

/**
 * Stage : Ukuran canvas dan propertinya
 */
var stage = new Konva.Stage({
  container: 'canvascontainer',
  width: 1100,
  height: 700
});

/**
 * Base Layer : Tembok
 */
var baseLayer = new Konva.Layer();

Konva.Image.fromURL('/assets/tembok.png', function (tembok) {
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
  charObj.src = '/assets/char'+num+'.png';
  charObj.onload =  function () {
    char = new Konva.Image({
      x: players[id].x,
      y: players[id].y,
      offsetX: charSize/2,
      offsetY: charSize/2,
      rotation: players[id].rotation,
      image: charObj,
      width: charSize,
      height: charSize,
    });

    players[id].obj = char;

    baseLayer.add(char);

  };
}

players[myID] = new Player(myID, "Sisuka", 1)

/**
 * Stage Adder : Tambahkan layer ke stage
 */
stage.add(baseLayer);


/**
 * Helper : Anything
 */
function randomY() {
  return Math.random() * (stage.height()-charSize*2) + charSize;
}

function randomX() {
  return Math.random() * (stage.width()-charSize*2) + charSize;
}

function randomRotation() {
  return Math.random() * (360);
}

/**
 * Animator : Loop and update the canvas
 */
var anim = new Konva.Animation(function () {
  updatePlayers(myID)
}, baseLayer);
anim.start();

function updatePlayers(id) {
  let player = players[id];
  if(player.obj != null) {
    player.obj.x(player.x);
    player.obj.y(player.y);
    player.obj.rotation(player.rotation);
  }
}

/**
 * Event Listener : Keyboard
 */
$(document.body).keydown(function (ev) {
  // console.log(ev.key)
  if((ev.key == ' ' || ev.key == 'ArrowRight' || ev.key == 'ArrowLeft' ) && ev.target == document.body) {
    ev.preventDefault();
  }

  if(ev.key == 'w')
    keydowns['w'] = true;
  if(ev.key == 's')
    keydowns['s'] = true;
  if(ev.key == 'a')
    keydowns['a'] = true;
  if(ev.key == 'd')
    keydowns['d'] = true;

  let s = Math.sin(players[myID].rotation * Math.PI / 180)
  let c = Math.cos(players[myID].rotation * Math.PI / 180)

  if(keydowns['w']){
    players[myID].x = players[myID].x + velocity * s ;
    players[myID].y = players[myID].y - velocity * c ;
  }
  if(keydowns['s']){
    players[myID].x = players[myID].x - velocity * s ;
    players[myID].y = players[myID].y + velocity * c ;
  }
  if(keydowns['a'])
    players[myID].rotation-=velocity;
  if(keydowns['d'])
    players[myID].rotation+=velocity;

});

$(document.body).keyup(function (ev) {
  keydowns[ev.key] = false;  
});

/**
 * Event Listener : Click
 */
stage.on('click', function () {
  var pos = stage.getRelativePointerPosition();
  console.log(pos)
});

/**
 * Chat : Send and receive message
 */
$('#btnSend').click(function () {
  sendMsg();
});

function sendMsg() {
  let msg = $('#chat-input').val();
  $('#chat-input').val('');
  showSendingChat(msg);

  // TODO: Send message to server
}