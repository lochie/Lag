var cnvs = {};
var canvas, ctx;

var debug = (function(){
	var fps = {	startTime : 0,	frameNumber : 0,	getFPS : function(){		this.frameNumber++;		var d = new Date().getTime(),			currentTime = ( d - this.startTime ) / 1000,			result = Math.floor( ( this.frameNumber / currentTime ) );		if( currentTime > 1 ){			this.startTime = new Date().getTime();			this.frameNumber = 0;		}		return result;	}	};

	function loop(ctx){
		var string = "";
		string += "FPS: "+fps.getFPS();
		string += " / ";
		string += "HP: "+Math.floor(player.health);
		draw.text( string, 10, 20, "16px" );
	}

	return{
		loop
	}
})();

var scale = 1;

var core = (function(){
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || setTimeout;

	function Canvas(element){
		return {
			canvas:element,
			ctx:element.getContext("2d")
		};
	}

	function init(){
		cnvs['main'] = Canvas( document.getElementById("game") );
		cnvs['render'] = Canvas( document.createElement("canvas") );
		cnvs['fx'] = Canvas( document.createElement("canvas") );

		canvas = cnvs['main'].canvas;
		ctx = cnvs['render'].ctx;

		resize();

		window.addEventListener("resize", resize);
		document.addEventListener('mousemove', MouseMoveHandler, false);
		document.addEventListener('mousedown', MouseDownHandler, false);
		document.addEventListener('mouseup', MouseUpHandler, false);
		canvas.addEventListener('touchstart', canvasDown);
		canvas.addEventListener('touchend', canvasUp);
		canvas.addEventListener('touchmove', canvasMove);

		render();
	}
	function resize(){
		scale = window.innerHeight/1080;

		for (var key in cnvs) {
			var obj = cnvs[key];
			obj.canvas.width = window.innerWidth/scale;
			obj.canvas.height = window.innerHeight/scale;
		}
		
		document.body.style.zoom = scale;

	}

	function render(){
		cnvs['render'].ctx.clearRect(0, 0, cnvs['render'].canvas.width, cnvs['render'].canvas.height);

		game.loop();

		cnvs['main'].ctx.clearRect(0, 0, cnvs['main'].canvas.width, cnvs['main'].canvas.height);
		cnvs['main'].ctx.drawImage(cnvs['render'].canvas, globalOffset.x, globalOffset.y);

		requestAnimationFrame(render);
	}


	function fx(x, y, w, h, drawCall){
		cnvs['fx'].canvas.width = w;
		cnvs['fx'].canvas.height = h;
		cnvs['fx'].ctx.clearRect(0, 0, cnvs['fx'].canvas.width, cnvs['fx'].canvas.height);
		drawCall(cnvs['fx'].ctx);
		ctx.drawImage(cnvs['fx'].canvas, x, y);
	}

	return{
		init,
		fx
	}

})();

function hitTestArea(a, b){
	var p1 = {
		x: (a.offset) ? a.x + a.offset.x : a.x,
		y: (a.offset) ? a.y + a.offset.y : a.y,
		width:a.width,
		height:a.height,
	};
	var p2 = {
		x: (b.offset) ? b.x + b.offset.x : b.x,
		y: (b.offset) ? b.y + b.offset.y : b.y,
		width:b.width,
		height:b.height,
	};
	draw.ref(p1);
	draw.ref(p2, "blue");
	return !(p2.x > p1.x+p1.width || 
			p2.x+p2.width < p1.x || 
			p2.y > p1.y+p1.height ||
			p2.y+p2.height < p1.y);
}
function hitTestPoint(a, b){
	var p1 = {
		x: (a.offset) ? a.x + a.offset.x : a.x,
		y: (a.offset) ? a.y + a.offset.y : a.y,
		width:a.width,
		height:a.height,
	};
	var p2 = {
		x: (b.offset) ? b.x + b.offset.x : b.x,
		y: (b.offset) ? b.y + b.offset.y : b.y,
		width:b.width,
		height:b.height,
	};
	draw.ref(p1);
	draw.ref(p2, "blue");
	return ( (p1.x > p2.x && p1.x < p2.x+p2.width) && (p1.y > p2.y && p1.y < p2.y+p2.height) );
}

var mouse = {
	x: null,
	y: null,
	isDown: false,
	update:function(x,y){
		mouse.x = x/scale;
		mouse.y = y/scale;
	},
	move:function(){
	},
	click:function(){
	},
	isWithin:function(x,y,w,h){
		return ( (mouse.x > x && mouse.x < x+w) && (mouse.y > y && mouse.y < y+h) );
	}
}
function MouseMoveHandler(event) {
	mouse.update(event.clientX, event.clientY);
	if(mouse.isDown) mouse.move();
}
function MouseDownHandler(event) {
	mouse.isDown = true;
	mouse.click();
}
function MouseUpHandler(event) {
	mouse.isDown = false;
}
function canvasMove(e) {
	if(e.touches.length == 1) {
		e.preventDefault();
		mouse.update(e.touches[0].pageX,e.touches[0].pageY);
	}
}
function canvasDown(e) {
	if(e.touches.length == 1) {
		e.preventDefault();
		mouse.update(e.touches[0].pageX,e.touches[0].pageY);
		mouse.isDown = true;
		mouse.click();
	}
}
function canvasUp(e) {
	mouse.isDown = false;
}



var sounds = (function(){
	var muted = false;
	function toggleMute(){ muted = !muted; }

	var audios = {};
	function init(sources, callback){
		loaded = 0;
		var loadedImages = 0;
		var numImages = 0;
		setTimeout(function(){
			if(loadedImages < numImages)callback();
		},1000);
		for(var src in sources) numImages++; // find amount of sources
		for(var src in sources){
			var url = sources[src];
			audios[src] = new Audio();
			audios[src].onloadeddata = function(e){
				console.log("Loaded Audio",e.target.src);
				loaded = (100 / numImages) * (loadedImages+1);
				if(++loadedImages >= numImages) {
					callback();
				}
			}
			audios[src].src = url;
		}
	}
	function play(sfx){ if(audios[sfx] && !muted) audios[sfx].cloneNode().play(); }

	return { init, play, toggleMute };
})();


var draw = (function(){
	function text(txt, x, y, size){
		ctx.save();
			ctx.font = size+" Courier";
			ctx.fillStyle = "black";
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = "1";
			ctx.textAlign = "left";
			ctx.fillText(txt, x, y);
			ctx.strokeText(txt, x, y);
		ctx.restore();
	}
	function line(p1,p2){
		ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = "#ff0000";
			ctx.moveTo(p1.x,p1.y);
			ctx.lineTo(p2.x,p2.y);
			ctx.stroke();
		ctx.restore();
	}
	function ref(a,type){
		if(devMode){
			ctx.save();
				switch (type){
					case 'blue':
						ctx.strokeStyle = "#0000ff";
					break;
					default:
						ctx.strokeStyle = "#ff0000";
					break;
				}
	     		ctx.beginPath();
					ctx.translate(a.x, a.y);
					ctx.rect(0,0,a.width,a.height);
					ctx.lineWidth = 2;
	      			ctx.stroke();
			ctx.restore();
		}
	}
	function rect(a,type){
		ctx.save();
			switch (type){
				case 'red':
					ctx.fillStyle = "#ff0000";
				break;
				case 'blue':
					ctx.fillStyle = "#0000ff";
				break;
				case 'green':
					ctx.fillStyle = "#00ff00";
				break;
				case 'purple':
					ctx.fillStyle = "#4D2746";
				break;
				default:
					ctx.fillStyle = "#ffffff";
				break;
			}
			ctx.translate(a.x, a.y);
				if(a.offset) ctx.translate(a.offset.x, a.offset.y);
			ctx.rotate((a.rotation+90)*Math.PI/180);
			
			ctx.fillRect(0,0,a.width,a.height);
		ctx.restore();
	}
	function circle(a,type){
		ctx.save();
			switch (type){
				case 'red':
					ctx.fillStyle = "#ff0000";
				break;
				case 'blue':
					ctx.fillStyle = "#0000ff";
				break;
				case 'green':
					ctx.fillStyle = "#00ff00";
				break;
				case 'white':
					ctx.fillStyle = "#ffffff";
				break;
				default:
					ctx.fillStyle = "#ffffff";
				break;
			}
			ctx.globalAlpha = 0.75;
     		ctx.beginPath();
				ctx.translate(a.x, a.y);
     	 		ctx.arc(0, 0, a.r, 0, 2 * Math.PI, false);
      		ctx.fill();
		ctx.restore();
	}
	function texture(a, img, flip){
		ctx.save();
    		ctx.translate(a.x, a.y);
    		if(a.rotation) ctx.rotate((a.rotation+90)*Math.PI/180);
    		if(flip){
				ctx.scale(-1, 1);
	    		ctx.translate(-a.width, 0);
			}
			ctx.drawImage(img, 0, 0, a.width,a.height);
		ctx.restore();
	}
	function sprite(a, img, frame, flip){
		ctx.save();
    		ctx.translate(a.x, a.y);
    		if(a.rotation) ctx.rotate((a.rotation+90)*Math.PI/180);
			if(a.offset) ctx.translate(a.offset.x, a.offset.y);
			//ctx.fillStyle = "#ff0000";
			//ctx.fillRect(0,0,a.width,a.height);
			ctx.drawImage(img, a.width*(frame-1), 0, a.width, a.height, 0, 0, a.width, a.height);
		ctx.restore();
	}

	return{
		line,
		rect,
		circle,
		texture,
		sprite,
		text,
		ref,
	}
})();

var sheets = {};
var sprites = (function(){

	function render(name, obj, freshState, flip){
		freshState = freshState || false;
		flip = flip || false;

		if(freshState) sheets[name].current_frame = 0;
		
		if(sheets[name].current_frame >= sheets[name].frames + 1){
			if(sheets[name].loop) sheets[name].current_frame = 1;
		}else{
			sheets[name].current_frame += sheets[name].frame_increase;
		}

		var img = sheets[name].src;
		var frames = sheets[name].frames;
		var width = obj.width || sheets[name].width;
		var height = obj.height || sheets[name].height;
		var current_frame = Math.floor(sheets[name].current_frame);

		var a = {
			x:obj.x,
			y:obj.y,
			width:width/frames,
			height:height,
			rotation:obj.rotation || null,
			offset:{
				x:obj.offset.x || 0,
				y:obj.offset.y || 0,
			}
		};
		// draw
		if(frames != 1){
			draw.sprite(a, img, current_frame, flip);
		}else{
			draw.texture(a, img, flip);
		}
	}

	function init(assets, callback){
		sheets = assets;
		loadImages(sheets, function(images) {
			console.log("Assets loaded");
			loaded = 100;
			callback();
		});
	}
	function loadImages(sources, callback) {
		loaded = 0;
		var images = {};
		var loadedImages = 0;
		var numImages = 0;

		setTimeout(function(){
			if(loadedImages < numImages)callback();
		},1000);

		for(var src in sources) numImages++; // find amount of sources
		for(var src in sources){
			var obj = sources[src];
			for (var prop in obj) {
				if(obj.hasOwnProperty(prop) && prop == 'src'){
					var url = obj[prop];

					images[src] = new Image();
					images[src].onload = function(e) {
						console.log("Loaded Asset",e.target.src);
						loaded = (100 / numImages) * (loadedImages+1);
						//log("Loaded",loaded);
						if(++loadedImages >= numImages) {
							callback(images);
						}
					};
					images[src].src = url;
					obj.src = images[src];
					obj.width = obj.src.width;
					obj.height = obj.src.height;
					obj.current_frame = 1;
					obj.frame_increase = obj.frame_delay || 1;
				}
			}
		}
	}

	return {
		init,
		render,
	}

})();


var AssetManager = (function(){

	var loaded = 0;

	function preload(){

	}
	function loadAudio(){
		var loadedImages = 0;
		var numImages = 0;
		for(var src in sources) numImages++; // find amount of sources
		for(var src in sources){
			var url = sources[src];
			audios[src] = new Audio();
			audios[src].onloadeddata = function(e){
				console.log("Loaded Audio",e.target.src);
				loaded = (100 / numImages) * (loadedImages+1);
				if(++loadedImages >= numImages) {
					callback();
				}
			}
			audios[src].src = url;
		}
	}
	function loadImages(){
		loaded = 0;
		var images = {};
		var loadedImages = 0;
		var numImages = 0;

		for(var src in sources) numImages++; // find amount of sources
		for(var src in sources){
			var obj = sources[src];
			for (var prop in obj) {
				if(obj.hasOwnProperty(prop) && prop == 'src'){
					var url = obj[prop];

					images[src] = new Image();
					images[src].onload = function(e) {
						console.log("Loaded Asset",e.target.src);
						loaded = (100 / numImages) * (loadedImages+1);
						//log("Loaded",loaded);
						if(++loadedImages >= numImages) {
							callback(images);
						}
					};
					images[src].src = url;
					obj.src = images[src];
					obj.width = obj.src.width;
					obj.height = obj.src.height;
					obj.current_frame = 1;
				}
			}
		}

	}
	return{
		preload
	}

})();