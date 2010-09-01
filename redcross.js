/****
* v.0.0.2 - 01/09/2010
* redcross.js is under the MIT licence 
*
* redcross.js is a set of util functions for cross.js -> http://harmonicacore.appspot.com/#X
* mostly based on processing.js functions -> http://processingjs.org
*
* 
*/

function RX(){

};

RX.prototype.constrain = function(aNumber, aMin, aMax){
  return aNumber > aMax ? aMax : aNumber < aMin ? aMin : aNumber;
};

RX.prototype.map = function(value, istart, istop, ostart, ostop){
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
};

RX.prototype.dist = function(){
  var dx, dy, dz;
  if (arguments.length === 4) {
    dx = arguments[0] - arguments[2];
    dy = arguments[1] - arguments[3];
    return Math.sqrt(dx * dx + dy * dy);
  } else if (arguments.length === 6) {
    dx = arguments[0] - arguments[3];
    dy = arguments[1] - arguments[4];
    dz = arguments[2] - arguments[5];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

RX.prototype.norm = function(aNumber, low, high){
  return (aNumber - low) / (high - low);
};

RX.prototype.max = function(){
  if (arguments.length === 2) {
    return arguments[0] < arguments[1] ? arguments[1] : arguments[0];
  } else {
    var numbers = arguments.length === 1 ? arguments[0] : arguments; // if single argument, array is used
    if (! ("length" in numbers && numbers.length > 0)) {
      throw "Non-empty array is expected";
    }
    var max = numbers[0],
      count = numbers.length;
    for (var i = 1; i < count; ++i) {
      if (max < numbers[i]) {
        max = numbers[i];
      }
    }
    return max;
  }
};

RX.prototype.min = function(){
  if (arguments.length === 2) {
    return arguments[0] < arguments[1] ? arguments[0] : arguments[1];
  } else {
    var numbers = arguments.length === 1 ? arguments[0] : arguments; // if single argument, array is used
    if (! ("length" in numbers && numbers.length > 0)) {
      throw "Non-empty array is expected";
    }
    var min = numbers[0],
      count = numbers.length;
    for (var i = 1; i < count; ++i) {
      if (min > numbers[i]) {
        min = numbers[i];
      }
    }
    return min;
  }
};

/**
* point : {x, y}
* shape : [ {x, y}, ... ]
*/
RX.prototype.intersectPointShape = function(point, shape){
  // polygon mask
  var c = false;
  var j = shape.length - 1;
  for(var i = 0; i < shape.length; j = i++){
    if ((((shape[i].y <= point.y) && (point.y < shape[j].y)) ||
         ((shape[j].y <= point.y) && (point.y < shape[i].y))) &&
        (point.x < (shape[j].x - shape[i].x) * 
        (point.y - shape[i].y) / (shape[j].y - shape[i].y) + shape[i].x))
      c = !c;
  }
  return c;
};

/**
* point: { x, y }
* circle: {center: { x, y }, radius }
*/
RX.prototype.intersectPointCircle = function(point, circle){
	 return (this.dist(point.x, point.y, circle.centre.x, circle.center.y) <= circle.radius); 
};
