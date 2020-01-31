var player = {
	strength:100,
	health:100,
	hurt: false,
	hurtFade:0,
};

var devMode = false;
var loaded = 0;

var globalOffset = {
	x:0,
	y:0
}


var game = (function(){

	var currency = 0;
	var difficulty = 1; //higher = harder


	//sounds.toggleMute();

	var paused = false;
	var gameState = "loading";

	var spritesheets = {
		bg:{
			src:"assets/bg.jpg",
			frames:1,
			loop:true,
		},
		bg_expand:{
			src:"assets/bg-expand.jpg",
			frames:1,
			loop:true,
		},
		bg_blue:{
			src:"assets/bg-blue.jpg",
			frames:1,
			loop:true,
		},
		bg_purple:{
			src:"assets/bg-purple.jpg",
			frames:1,
			loop:true,
		},

		flame:{
			src:"assets/sprites/flame.png",
			frames:46,
			frame_delay:0.6,
			loop:true,
		},
		lag_blue:{
			src:"assets/sprites/lag-blue.png",
			frames:16,
			frame_delay:0.2,
			loop:true,
		},
		lag_purple:{
			src:"assets/sprites/lag-purple.png",
			frames:16,
			frame_delay:0.75,
			loop:true,
		},
		medkit:{
			src:"assets/sprites/medkit.png",
			frames:2,
			frame_delay:0.05,
			loop:true,
		},
		gem_blue:{
			src:"assets/sprites/gem-blue.png",
			frames:1,
			loop:true,
		},
		gem_purple:{
			src:"assets/sprites/gem-purple.png",
			frames:1,
			loop:true,
		},
	};

	var audio = {
		laser1:"assets/sfx/laser1.mp3",
		laser2:"assets/sfx/laser2.mp3",
		laser3:"assets/sfx/laser3.mp3",
		laser4:"assets/sfx/laser4.mp3",
		laser5:"assets/sfx/laser5.mp3",
		laser6:"assets/sfx/laser6.mp3",
		laser7:"assets/sfx/laser7.mp3",
		laser8:"assets/sfx/laser8.mp3",
		laser9:"assets/sfx/laser9.mp3",
		powerUp8:"assets/sfx/powerUp8.mp3",
		zap2:"assets/sfx/zap2.mp3",
		bg:"assets/sfx/bg.mp3",
	};

	function init(){
		core.init();
		document.body.style.cursor = 'none';
		gameState = "loading-audio";
		sounds.init(audio, function(){
			gameState = "loading-sprites";
			sprites.init(spritesheets, function(){
				//sounds.play("bg");
				gameState = "game";
			});
		});
	}

	function loop(){
		switch (gameState){
			case "loading":
				string = "LOADING: "+loaded+"%";
				draw.text( string, canvas.width/2, canvas.height/2, "16px" );
				break;
			case "loading-audio":
				string = "LOADING AUDIO: "+loaded+"%";
				draw.text( string, canvas.width/2, canvas.height/2, "16px" );
				break;
			case "loading-sprites":
				string = "LOADING SPRITES: "+loaded+"%";
				draw.text( string, canvas.width/2, canvas.height/2, "16px" );
				break;
			case "game":
				city.loop();
				enemy.loop();
				flame.loop();
				collectable.loop();
				hud.loop();
				break;

		}
		drawCursor();
		debug.loop();
	}

	var cursorSize = 40;
	var cursor = {
		x:mouse.x,
		y:mouse.y,
		width:cursorSize,
		height:cursorSize,
		offset:{
			x:-cursorSize/2,
			y:-cursorSize/2,
		},
		r: cursorSize/2,
	};
	function drawCursor(){
		cursor.x = mouse.x;
		cursor.y = mouse.y;
		if(cursor.x != null){
			if(mouse.isDown){
				draw.circle(cursor, "red");
			}else{
				draw.circle(cursor, "white");
			}
		}
	}


	var hud = (function(){
		function loop(){

			overlay();
			if(player.hurt){
				player.hurtFade -= 0.05;
				if(player.hurtFade<=0){
					player.hurt = false;
				}else{
					ctx.save();
						ctx.globalAlpha = player.hurtFade;
						ctx.globalCompositeOperation = "multiply";
						ctx.fillStyle = "#ff0000"
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.restore();
				}
			}

		}

		function overlay(){
			var size = canvas.height;
			ctx.save();
				var gradient = ctx.createRadialGradient(size/2, size/2, size*0.48, size/2, size/2, size*0.5);
				gradient.addColorStop(0,"rgba(0,0,0,0)");
				gradient.addColorStop(1,"rgba(0,0,0,1)");
				ctx.fillStyle = gradient;
				ctx.translate((canvas.width/2)-size/2,0);
				ctx.fillRect(0, 0, size, size);
			ctx.restore();
			var leftOver =  (canvas.width-size)/2;
			ctx.save();
				ctx.fillStyle = "#000000";
				ctx.translate(0,0);
				ctx.fillRect(0, 0, leftOver+1, size);
			ctx.restore();
			ctx.save();
				ctx.fillStyle = "#000000";
				ctx.translate(size+leftOver-1,0);
				ctx.fillRect(0, 0, leftOver+1, size);
			ctx.restore();
		}
		return{
			loop
		}
	})();

	// flame core
	var flame = (function(){

		var pos = {
			x:0,
			y:0,
			width:50,
			height:50,
			offset:{
				x:-25,
				y:-25,
			},
		};

		function reposition(){
			pos.x = (canvas.width/2);
			pos.y = (canvas.height/2);
		}

		function init(){

		}

		function loop(){
			reposition();
			sprites.render("flame", {
				x:pos.x,
				y:pos.y,
				offset:{
					x:-65,
					y:-75
				}
			});
			/*
			if(player.health > 0){
				draw.rect(pos, "blue");
			}else{
				draw.rect(pos, "red");}
			}
			*/
		}
		function props(){
			return pos;
		}
		function getCenter(){
			return {
				x:flame.props().x,
				y:flame.props().y,
			}
		}

		return{
			init,
			loop,
			props,
			getCenter,
		}
	})();


	var collectables = [];
	var collectable = (function(){

		function create(x, y, amount, type){
			for(var i=0;i<amount;i++){
				collectables.push({
					active:true,
					x:x,
					y:y,
					width:10,
					height:22,
					xv:(Math.random()-0.5)*10,
					yv:(Math.random()-0.5)*10,
					type:type,
					anim:{
						timer:0,
						delay:40 + i,
					}
				});
			}

			// healthkit
			if(Math.random()>0.7){
				collectables.push({
					active:true,
					x:x,
					y:y,
					width:60,
					height:40,
					xv:(Math.random()-0.5)*5,
					yv:(Math.random()-0.5)*5,
					type:"hp",
				});
			}
		}
		function loop(){
			for(var i=0;i<collectables.length;i++){
				if(!paused) update(i);
				if(!collectables[i].active){
					collectables.splice(i,1);
				}else{
					render(i);
				}
			}
		}

		function update(i){
			var a = collectables[i];
			if(a.type == "hp"){
				a.x += a.xv *= 0.96;
				a.y += a.yv *= 0.96;
				if( mouse.isDown && hitTestArea(a,cursor) ){
					player.health += 20;
					a.active = false;
					mouse.isDown = false;
					sounds.play("laser2");
				}
			}else{
				a.anim.timer++;
				if(a.anim.timer == a.anim.delay){
					sounds.play("powerUp8");
					currency++;
				}
				if(a.anim.timer>a.anim.delay){
					a.x += (0-a.x)/7;
					a.y += (0-a.y)/7;
				}else{
					a.x += a.xv *= 0.96;
					a.y += a.yv *= 0.96;
				}
			}
		}
		function render(i) {
			var a = collectables[i];
			if(a.type == "hp"){
				sprites.render("medkit", {
					x:a.x,
					y:a.y,
					offset:{
						x:-10,
						y:-10
					}
				});
			}else{
				draw.texture(a, sheets["gem_"+a.type].src);
			}
		}

		return{
			create,
			loop
		}
	})();


	// enemy
	var enemies = [];
	var enemy = (function(){

		var maxSpeed = 5;
		var timer = 0;
		var typeList = ['blue', 'purple'];

		var props = {
			x:0,
			y:0,
			width:30,
			height:30,
			offset:{
				x:-15,
				y:-15,
			},
			xv:0,
			yv:0,
			active:true,
			speed:1,
			health:100,
			strength:5 + Math.random()*5,
			type:'purple',

			lag:{
				timer:0,
				timeout: 50 + Math.random()*10,
				distance: 0,
			}
		};


		function create(){
			var a = JSON.parse(JSON.stringify(props));

			a.type = typeList[Math.floor(Math.random()*typeList.length)];
			a.lag.timeout = 50 + Math.random()*10;
			a.strength = 5 + Math.random()*5;
			a.speed = (Math.random()*0.5) + 0.5;
			a.health = Math.ceil(Math.random()*2)*100;


			setAngle(a, Math.random()*Math.PI*2, canvas.height);

			enemies.push(a);
		}

		function setAngle(a, angle, distance){
			a.lag.distance = ((Math.random()-0.5)*50) * (Math.PI/180);
			a.angle = angle;

			a.xv = -Math.cos(a.angle) * a.speed*maxSpeed;
			a.yv = -Math.sin(a.angle) * a.speed*maxSpeed;

			var center = flame.getCenter();
			a.x = center.x + Math.cos(a.angle) * distance;
			a.y = center.y + Math.sin(a.angle) * distance;
		}

		function loop(){
			timer++;
			if(timer>200-(difficulty/150)){
				for(var i=0;i<Math.random()*3;i++) create();
				difficulty++;
				timer = 0;
			}

			for(var i=0;i<enemies.length;i++){
				var a = enemies[i];
				if(!paused) update(a);
				if(!a.active){
					enemies.splice(i,1);
				}else{
					render(a);
				}
			}
		}

		function update(a){
			a.x += a.xv;
			a.y += a.yv;

			// lag
			a.lag.timer++;
			if(a.lag.timer > a.lag.timeout){
				var center = flame.getCenter();
				var x = a.x - center.x;
				var y = a.y - center.y;

				var distance = Math.sqrt( x*x + y*y );
				setAngle(a, a.angle + a.lag.distance, distance);

				a.lag.timer = 0;
			}


			if( mouse.isDown && hitTestArea(a,cursor) ){
				a.health -= player.strength;
				if(a.health>0){
					a.x -= a.xv * 30;
					a.y -= a.yv * 30;
					sounds.play("laser"+Math.ceil(Math.random()*9));
				}
				mouse.isDown = false;
			}

			// remove
			if(a.health <= 0){
				a.active = false;
				collectable.create(a.x, a.y, 10, a.type);
				city.shockwave(a.x, a.y, 10);
				city.quake(30);
				sounds.play("laser"+Math.ceil(Math.random()*9));
			}
			if(hitTestArea( a, flame.props() )){
				player.health -= a.strength;
				player.hurt = true;
				player.hurtFade = 1;
				city.quake(60);
				sounds.play("zap2");
				a.active = false;
			}

		}
		function render(a){
			var angle = Math.atan2(flame.props().y - a.y, flame.props().x - a.x) * 180 / Math.PI;
			//draw.rect(a, a.type);
			sprites.render("lag_"+a.type, {
				x:a.x,
				y:a.y,
				rotation:angle-90,
				offset:{
					x:-180,
					y:-50
				}
			});
		}

		return{
			create,
			loop
		}
	})();


// background
	var city = (function(){

		var bg;
		var shockwaves = [];
		var shake = {
			x:0,
			y:0,
		};

		function loop(){

			var bgOffset = {
				x:-sheets["bg"].src.width/2,
				y:-sheets["bg"].src.height/2
			}

			ctx.save();
				ctx.translate(canvas.width/2, canvas.height/2);
				ctx.drawImage(sheets["bg"].src, bgOffset.x, bgOffset.y);
			ctx.restore();

			// glows
			for(var i=0;i<enemies.length;i++){
				var effectSize = enemies[i].width * 10;
				var effect = {
					x:Math.floor( (enemies[i].x - effectSize/2) ),
					y:Math.floor( (enemies[i].y - effectSize/2) ),
					width:effectSize,
					height:effectSize,
					intensity:0,
					offset: {
						x:sheets["bg"].src.width/2,
						y:sheets["bg"].src.height/2,
					}
				};; 
				ctx.save();
					core.fx(effect.x, effect.y, effect.width, effect.height, function(ctx){
						var gradient = ctx.createRadialGradient(effect.width/2, effect.height/2, effect.intensity, effect.width/2, effect.height/2, effect.height/2 );
						gradient.addColorStop(0, 'rgba(0,0,0,1)');
						gradient.addColorStop(1, 'rgba(0,0,0,0)');
						ctx.fillStyle = gradient;

						ctx.fillRect(0, 0, effect.width, effect.height);
						ctx.globalCompositeOperation = 'source-atop';
						ctx.translate(canvas.width/2, canvas.height/2);
						ctx.drawImage(sheets["bg_"+enemies[i].type].src, -effect.x + (bgOffset.x), -effect.y + (bgOffset.y));
						//ctx.drawImage(sheets["bg_"+enemies[i].type].src, effect.x + offset.x, effect.y + offset.y, effect.width, effect.height, 0, 0, effect.width, effect.height);
					});
				ctx.restore();
			}

			// shockwave
			for(i=0;i<shockwaves.length;i++){
				var a = shockwaves[i];
				a.r += a.strength;
				a.alpha -= 0.01;
				if(a.alpha <= 0){
					shockwaves.splice(i,1);
				}else{
					ctx.save();
						core.fx(0, 0, canvas.width, canvas.height, function(ctx){
							ctx.globalAlpha = a.alpha;
				     		ctx.beginPath();
								ctx.translate(a.x, a.y);
				     	 		ctx.arc(0, 0, a.r, 0, 2 * Math.PI, false);
							ctx.strokeStyle="#000000";
							ctx.lineWidth = 50;
				      		ctx.stroke();

							ctx.globalCompositeOperation = 'source-atop';
							ctx.drawImage(sheets["bg_expand"].src, -a.x, -a.y);
						});
					ctx.restore();
				}
			}
			// screen shake
			if( (shake.x < 2 && shake.x > -2) && (shake.y < 2 && shake.y > -2) ){
				shake.x = 0;
				shake.y = 0;
			}else{
				shake.x = -shake.x/2;
				shake.y = -shake.y/2;
			}
			globalOffset.x = shake.x;
			globalOffset.y = shake.y;
		}

		function shockwave(x,y,strength){
			shockwaves.push({
				x:x,
				y:y,
				strength:strength,
				alpha:1,
				r:0,
			});
		}

		function quake(strength){
			shake.x += strength;
			shake.y += strength;
		}

		return{
			loop,
			shockwave,
			quake
		}
	})();





	return{
		init,
		loop
	}

})();