import $ from "jquery";
import Konva from "konva";
import { showIncomingChat, showSendingChat } from "./chat";
import { messageToServer } from "./client";

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
const angularvelocity = 100;
let keydowns = [];
let atkGun = null;
let atkSword = null;

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
    char = new Konva.Group({
      x: players[id].x,
      y: players[id].y,
      offsetX: charSize/2,
      offsetY: charSize/2,
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
      x: charSize/2-15,
      y: charSize,
      text: players[id].name,
      fontSize: 10,
      fontFamily: 'Inter',
      fill: 'white',
    });

    char.add(imgChar);
    char.add(txtChar);

    players[id].obj = char;

    baseLayer.add(char);

  };
}

players[myID] = new Player(myID, "Sisuka", 1)
players['ID2'] = new Player('ID2', "Sasuke", 2)

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
var anim = new Konva.Animation(function (frame) {
  updatePlayers(myID)

  var angleDiff = (frame.timeDiff * angularvelocity) / 100;

  if(atkSword){
    players[myID].rotation += angleDiff;
  }
  if(atkGun){

  }
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

  let player = players[myID];
  
  let s = Math.sin(player.rotation * Math.PI / 180)
  let c = Math.cos(player.rotation * Math.PI / 180)
  // console.log(player.x, player.y, stage.width(), stage.height())

  if(player.x < stage.width() && player.x > 0 && player.y > 0 && player.y < stage.height()) {

    if(keydowns['w']){
      player.x = player.x + velocity * s ;
      player.y = player.y - velocity * c ;
    }
    if(keydowns['s']){
      player.x = player.x - velocity * s ;
      player.y = player.y + velocity * c ;
    }
    if(keydowns['a'])
      player.rotation-=velocity;
    if(keydowns['d'])
      player.rotation+=velocity;

  }else{
    // Jika nabrak, respawn di tempat random
    player.x = randomX();
    player.y = randomY(); 
  }

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

  // Muter selama 1 detik 
  atkSword = true;
  setTimeout(() => {
    atkSword = false
  }, 1000);
});

/**
 * Chat : Send and receive message
 */
$('#btnSend').click(function () {
  sendMsg();
});
$('#chat-input').on('keypress', (e)=>{
  if(e.key == 'Enter'){
    e.preventDefault();
    sendMsg();
  }
})

function sendMsg() {
  let msg = $('#chat-input').val();
  $('#chat-input').val('');
  showSendingChat(msg);

  messageToServer(msg);
}