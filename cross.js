/*****
* v.0.5.6 - 08/09/2010
* cross.js is under MIT license 
*
* cross.js is a tiny event manager for HTML5.canvas
* the main goal is to render canvas only if necessary
* 
* done : we load event listeners only if necessary 
*/

function X(width, height, canvasid, framerate){
  
  // canvas
  this.canvas = document.getElementById(canvasid);
  // canvas's context
  this.context = context = this.canvas.getContext('2d');
  // width
  this.canvas.setAttribute('width', width);
  // height
  this.canvas.setAttribute('height', height);
  // framerate
  this.framerate = framerate;
  // canvasid
  this.canvasid = canvasid;
  
  // shapes
  this.shapes = {};
  
  // event queue
  this.eq = {
    click: {},
    rightclick: {},
    centerclick: {},
    hover: {},
    unhover: {},
    dragg: {},
    release: {},
    keypressed: {},
    keyreleased: {}
  };

  
  // mouse
  this.mouseX = 0;
  this.mouseY = 0;
  this.pmouseX = 0;
  this.pmouseY = 0;
  
  // event management
  this.mousePressed = false;
  this.mouseMoved = false;
  this.mouseDragged = false;
  this.hoveredId = "";
  this.draggedId = "";
  this.rendering = false;
  this.numrend = 0;
  this.keyCode = 0;
  this.keyRCode = 0;
  
  // crappy, id
  this.ident = 2280;
  
  // crappy, for event management
  this.canvas.crossjs = this;
}


/////////////////////////////
// PRIVATE METHODS
/////////////////////////////


/**
* private method dist
* return distance
*/
X.prototype._dist = function() {
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


/**
* private method intersect
* return true if point belongs to shape
*/
X.prototype._intersect = function(point, shape){
	
  if(shape.intersect && typeof shape["intersect"] === "function"){
	  return shape.intersect(point);
  } else {  
	  // no mask defined
	  if(!shape.mask || shape.mask.length <= 0){  // no mask specified
	    return false;
	  }
	  // circle mask
	  if(shape.mask.center && shape.mask.radius){
	    return (this._dist(point.x, point.y, shape.mask.center.x, shape.mask.center.y) <= shape.mask.radius ); 
	  }
	  // polygon mask
	  var c = false;
	  var j = shape.mask.length - 1;
	  for(var i = 0; i < shape.mask.length; j = i++){
	    if ((((shape.mask[i].y <= point.y) && (point.y < shape.mask[j].y)) ||
	         ((shape.mask[j].y <= point.y) && (point.y < shape.mask[i].y))) &&
	        (point.x < (shape.mask[j].x - shape.mask[i].x) * 
	        (point.y - shape.mask[i].y) / (shape.mask[j].y - shape.mask[i].y) + shape.mask[i].x))
	      c = !c;
	  }
	  return c;
  }
};


/**
* private method targetMouse
* find wich shape is under mouse
*/
X.prototype._targetMouse = function(){
  var tt = [];
  for(var id in this.shapes){
    var shape = this.shapes[id];
    if(this._intersect({x:this.mouseX,y:this.mouseY}, shape) == true){
      tt.push(shape);
    }
  }
  // searching for the z >
  if(tt.length >= 1){
    tt.sort(function(a,b){
      return b.z - a.z;
    });
    return tt[0];
  }
  return null;
};


/**
* private method defaultDraw
* basic drawing if shape has no draw method
* TODO : p
*/
X.prototype._defaultDraw = function (elt){
  if(!elt.mask) return;
  
  if(elt.mask.length){
    this.context.beginPath();
    this.context.strokeStyle = 'black';
    for(var i = 0; i < elt.mask.length; i++){
      this.context.lineTo(elt.mask[i].x, elt.mask[i].y);
    }
    this.context.closePath();
    this.context.stroke();
  } else if(elt.mask.center && elt.mask.radius){
    this.context.beginPath();
    this.context.strokeStyle = 'black';
    this.context.arc(elt.mask.center.x, elt.mask.center.y, elt.mask.radius, 0, Math.PI*2, true);
    this.context.closePath();  
    this.context.stroke();
  }
};


/**
* private method drawShapes
* draw all shapes
*/
X.prototype._drawShapes = function(){
  this.numrend++;
  // clean matrix
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // z sort
  var tt = [];
  for(var id in this.shapes){
    tt.push(this.shapes[id]);
  }
  tt.sort(function(a,b){
    return a.z - b.z;
  });
  // drawing
  for(var i in tt){
    if(tt[i].draw)
      tt[i].draw(this.context);
    else this._defaultDraw(tt[i]);
  }      
};


/**
* private methode proceed
* rendering process
*/
X.prototype._proceed = function(){
  for(var ev in this.eq){
    for(var id in this.eq[ev]){
      var step = this.eq[ev][id];
      var sh = this.shapes[id];
      var ret = sh[ev](step, this); // execute the event function of the object
      if(!ret || ret == false){ // end of the event function
        // remove the event from the event queue
        delete this.eq[ev][id];
      } else{ // increase the step of the function
        this.eq[ev][id] = step + 1;
      }
    }
  }
  this._drawShapes();
};


/**
* private method eqIsEmpty
* check if the event queue is empty
*/
X.prototype._eqIsEmpty = function(){
  for(var ev in this.eq){
    for(var id in this.eq[ev]){
      return false;
    }
  }
  return true;
};


/**
* function render
* render 
*/
function _render(force, c){
  if(force == false && c.rendering == false){  // on est pas deja en train de rendre
    var looping = window.setInterval(function(){
      c.rendering = true;
      c._proceed();
      if(c._eqIsEmpty() == true && c.draggedId == ""){
        c.rendering = false; // on sort du rendu
        window.clearInterval(looping);
      }
    }, c.framerate);
  }else{
    c._drawShapes();
  }
}


/**
* private method _hover
* hover management
*/
X.prototype._hover = function(rend){
  var shape = this._targetMouse();
  if(shape != null && shape.hover){
    this.hoveredId = shape.id;
    this.eq.hover[ this.hoveredId ] = 0;  // init with the step
    rend = true;  
  }
  if(rend == true){ // on demande un rendu
    _render(false, this);
  }  
};


/**
* private method _unhover
* unhover management
*/
X.prototype._unhover = function(rend){
  // is the current hover obj still hovered
  var shape = this._targetMouse();

  if(shape == null){ // mouse has left the object & is on no others
    var previous = this.shapes[ this.hoveredId ];
    if(previous && previous.unhover){
      this.eq.unhover[ this.hoveredId ] = 0;  // init with the step
      delete this.eq.hover[ this.hoveredId ]; // create bugs
    }
    this.hoveredId = "";
    rend = true;
  } else if(shape.id != this.hoveredId){ // mouse in a diff shape
    var previous = this.shapes[this.hoveredId];
    if(previous && previous.unhover){
      this.eq.unhover[ this.hoveredId ] = 0;  // init with the step
      delete this.eq.hover[ this.hoveredId ]; // create bugs
      this.hoveredId = "";
      rend = true;    
    }
    if(shape.hover){
      this.hoveredId = shape.id;
      this.eq.hover[ this.hoveredId ] = 0;  // init with the step
      rend = true;    
    }
  } 
  
  if(rend == true){ // on demande un rendu
    _render(false, this);
  }    
};


/**
* private method _dragg
* dragg management
*/
X.prototype._dragg = function(rend){

  if(this.draggedId == ""){
    var shape = this._targetMouse();
    if(shape != null && shape.dragg){
      this.eq.dragg[shape.id] = 0;
      this.draggedId = shape.id;
      rend = true;
    }
  }else{
    this.eq.dragg[this.draggedId] = 0;
    rend = true;
  }

  if(rend == true){ // on demande un rendu
    _render(false, this);
  }
};


/**
* private method _release
* release management
*/
X.prototype._release = function(rend){
  var shape = this.shapes[this.draggedId];
  if(shape.release){
    this.eq.release[ this.draggedId ] = 0;  // init with the step
    rend = true;
  }
  this.draggedId = ""; // erase the draggedId
  if(rend == true){ // on demande un rendu
    _render(false, this);
  }  
};


/**
* private method _click
* click management
*/
X.prototype._click = function(rend, which){
  var shape = this._targetMouse();
  switch (which){
  case 1 : 
	  if(shape != null && shape.click){
		// put the obj in eq.click
		this.eq.click[ shape.id ] = 0;  // init with the step
		rend = true;
	  }
	  break;
  case 2 : 
	  if(shape != null && shape.centerclick){
		// put the obj in eq.centerclick
		this.eq.centerclick[ shape.id ] = 0;  // init with the step
		rend = true;
	  }
	  break;
  case 3 : 
	  if(shape != null && shape.rightclick){
		// put the obj in eq.rightclick
		this.eq.rightclick[ shape.id ] = 0;  // init with the step
		rend = true;
	  }
	  break;	  	  
  }

  if(rend == true){ // on demande un rendu
    _render(false, this);
  }
};

X.prototype._keyPressed = function(keyCode, rend){
  this.keyCode = keyCode;
  for(id in this.shapes){
	var sh = this.shapes[ id ];
	if(sh.keypressed){
		this.eq.keypressed[ sh.id ] = 0;
		rend = true;
	}
  }

  if(rend == true){ // on demande un rendu
    _render(false, this);
  }	
};

X.prototype._keyReleased = function(keyCode, rend){
  this.keyRCode = keyCode;
  for(id in this.shapes){
	var sh = this.shapes[ id ];
	if(sh.keyreleased){
		this.eq.keyreleased[ sh.id ] = 0;
		rend = true;
	}
  }

  if(rend == true){ // on demande un rendu
    _render(false, this);
  }		
};

/**
* function eventManager 
*/
function _eventManager(e){
  if(e.type == "mousemove"){
    
    var element = this;
    var offsetX = 0, offsetY = 0;
    
    this.crossjs.pmouseX = this.crossjs.mouseX;
    this.crossjs.pmouseY = this.crossjs.mouseY;

    if (element.offsetParent) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while (element = element.offsetParent);
    }

    this.crossjs.mouseX = e.pageX - offsetX;
    this.crossjs.mouseY = e.pageY - offsetY;
    
    if(this.crossjs.mousePressed == false){    
      if(this.crossjs.hoveredId == ""){ // check if there is a new hovered obj
        this.crossjs._hover(false);
      }else{
        this.crossjs._unhover(false); // check if the current hovered obj is still hovered
      }
    }else{       
      this.crossjs.mouseDragged = true;
      this.crossjs._dragg(false);
    }
  } else if(e.type == "mousedown"){
      this.crossjs.mousePressed = true;
  } else if(e.type == "mouseup"){
    this.crossjs.mousePressed = false;
    if(this.crossjs.mouseDragged){
      this.crossjs.mouseDragged = false;
      if(this.crossjs.draggedId != ""){
        this.crossjs._release(false);
      }
    }else{
      this.crossjs._click(false, e.which);
    }
  } else if(e.type == "keydown"){
	  for(elt in this.crossjs){
		  this.crossjs[ elt ]._keyPressed(e.keyCode, false); 
	  }
  } else if(e.type == "keyup"){
	  for(elt in this.crossjs){
		  this.crossjs[ elt ]._keyReleased(e.keyCode, false); 
	  }
  }
};


/**
* function mouseOut
* mouse out of the canvas
*/
function _mouseOut(e){
  var rend = false;
  if(this.crossjs.draggedId != ""){
    var ds = this.crossjs.shapes[ this.crossjs.draggedId ];
    if(ds.release){
      this.crossjs.eq.release[ this.crossjs.draggedId ] = 0;
      rend = true;
    }
    this.crossjs.draggedId = "";
  }
  if(this.crossjs.hoveredId != ""){
    var hs = this.crossjs.shapes[ this.crossjs.hoveredId ];
    if(hs.unhover){
      this.crossjs.eq.unhover[ this.crossjs.hoveredId ] = 0;
      rend = true;
    }
    this.crossjs.hoveredId = "";
  }

  this.crossjs.mouseDragged = false;
  this.crossjs.mousePressed = false;
  
  if(rend == true){ // on demande un rendu
    _render(false, this.crossjs);
  }  
  
}


/**
* private method generateId
* generate a shape id
*/
X.prototype._generateId = function(){
  this.ident++;
  return this.ident.toString();
};


////////////////////////////////
// PUBLIC METHODS
////////////////////////////////


/**
* public method addShape
* add a shape in the render circuit
*/
X.prototype.addShape = function(shape){
  if(!shape.z){
    shape.z = 0;
  }
  if(!shape.color){
    shape.color = {r:0,g:0,b:0};
  }
  
  if(!shape.id){
    shape.id = this._generateId();
  }
  this.shapes[shape.id] = shape;
  
  return shape.id;
  
};


/**
* public method removeShape
* remove a shape from the render circuit
*/
X.prototype.removeShape = function(sh, rend){
  // removing from eq
  for(var ev in this.eq){
    for(id in this.eq[ev]){
      if(sh == sh.id){
        delete this.eq[ev][id];
      }
    }
  }
  // removing from shapes
  delete this.shapes[sh.id];
  // rendering
  if(rend == true){
    _render(true, this);
  }
};


/**
* public method getShapeById
* return a shape from the render circuit by its id
*/
X.prototype.getShapeById = function(id){
  return this.shapes[id];
};

/**
* public method getShapes
* return all the shapes
*/
X.prototype.getShapes = function(){
  return this.shapes;
};


/**
* public method triggy
* launch an event in a shape
*/
// for eternal event management
X.prototype.triggy = function(ev,id){
  var rend = false;
  if(this.shapes[id] && this.shapes[id][ev]){
    if(!this.eq[ev]){
      this.eq[ev] = {};
    }
    this.eq[ev][id] = 0;
    rend = true;
  }
  if(rend == true){ // on demande un rendu
    _render(false, this);
  }  
};


/**
* public method reboot
* reboot the X instance
*/
X.prototype.reboot = function(datas){
  this.shapes  = {};
  for(var el in this.eq){
    this.eq[el] = {};
  }
  for(var i = 0; i < datas.length; i++){
    this.addShape(datas[i]);
  }
  // draw a first time all the present shapes
  this.numrend = 0;
  _render(true, this);
};


/**
* function attach 
*
*/
function attach(elem, type, fn) {
  if (elem.addEventListener) {
    elem.addEventListener(type, fn, false);
  } else {
    elem.attachEvent("on" + type, fn);
  }
};


/**
* public method init
* init the X instance
*/
X.prototype.init = function(datas){
  for(var i = 0; i < datas.length; i++){
    this.addShape(datas[i]);
  }

  // event management
  attach(this.canvas, "mousemove", _eventManager);
  attach(this.canvas, "mouseout", _mouseOut);    
  attach(this.canvas, "mouseup", _eventManager);
  attach(this.canvas, "mousedown", _eventManager);   
  
  if(document.crossjs){
	  document.crossjs[ this.canvasid ] = this;
  }else{
	  attach(document, "keyup", _eventManager);
	  attach(document, "keydown", _eventManager);	  
	  document.crossjs = {};
	  document.crossjs[ this.canvasid ] = this;
  }    

  
  // draw a first time all the present shapes
  _render(true, this);
};