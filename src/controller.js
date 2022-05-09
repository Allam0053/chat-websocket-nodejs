import $ from "jquery";
import Konva from "konva";

/**
 * Global Variables
 */
let players = [];
const charSize = 80;

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


/**
 * Game Layer : Player, Enemy, Bullet
 */
var gameLayer = new Konva.Layer();

function initPlayer(name, num) {
  var charObj = new Image();
  charObj.src = '/assets/char'+num+'.png';
  charObj.onload = function () {
    var char = new Konva.Image({
      x: randomX(),
      y: randomY(),
      image: charObj,
      width: charSize,
      height: charSize,
    });

    baseLayer.add(char);
  };
}

initPlayer('Player 1', 1);
initPlayer('Player 2', 2);
initPlayer('Player 3', 3);
initPlayer('Player 4', 4);

/**
 * Stage Adder : Tambahkan layer ke stage
 */

stage.add(baseLayer);
// stage.add(gameLayer)


/**
 * Helper : Anything
 */

function randomY() {
  return Math.random() * (stage.height()-charSize*2) + charSize;
}

function randomX() {
  return Math.random() * (stage.width()-charSize*2) + charSize;
}