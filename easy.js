/**

	Caves are Easy: WebGL-based Game
	
	@module easy
	@author cpgauthier

**/

var EASY = {

	resources: {
		noise1: {
			type: "image",
			path: "res/noise1.jpg"
		},
		noise2: {
			type: "image",
			path: "res/noise2.jpg"
		},
		oil: {
			type: "image",
			path: "res/oil.gif"
		},
		coin: {
			type: "image",
			path: "res/change.gif"
		},
		wood: {
			type: "image",
			path: "res/chest.gif"
		},
		bricks: {
			type: "image",
			path: "res/bricks.jpg"
		},
		corpse: {
			type: "image",
			path: "res/corpse.jpg"
		}
	},
	
	BLURB:
		"<p>Easy Does It<br>By Chris Gauthier<br>wordsaretoys.com</p>" +
		"<p class=\"small\">Easy, the fabled adventurer, leaves a path of devastation through the deepest caves.</p>" +
		"<p class=\"small\">He's got no time to make amends; that's <em>your</em> job.</p>" +
		"<p class=\"small\">Dispose of his victims, calm their restless spirits,<br>appease their gods, and make a little money.</p>" +
		"<p class=\"small\"><em>Very</em> little money.</p>" +
		"<p>Press a Key to Play</p></div>",
	
	I: new Float32Array([1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1]),
	
	RESOLVE_TARGET: 50,
	EARNING_TARGET: 1000,
	
	updating: true,

	/**
		create GL context, set up game objects, load resources

		@method start
	**/

	start: function() {

		var gl;

		// create the GL display
		try {
			EASY.display = SOAR.display.create("gl");
		} catch (e) {
			jQuery("#glerror").show();
			return;
		}

		// add any useful polyfills
		Array.prototype.pick = function() {
			return this[Math.floor(Math.random() * this.length)];
		};

		// array random shuffle, taken from
		// http://sroucheray.org/blog/2009/11/array-sort-should-not-be-used-to-shuffle-an-array/
		Array.prototype.shuffle = function (){
			var i = this.length, j, temp;
			if ( i == 0 ) return;
			while ( --i ) {
				j = Math.floor( Math.random() * ( i + 1 ) );
				temp = this[i];
				this[i] = this[j];
				this[j] = temp;
			}
		};		
		
		// set initial display dimensions
		EASY.display.setSize(
			document.body.clientWidth, 
			document.body.clientHeight
		);

		// set up any webgl stuff that's not likely to change
		gl = EASY.display.gl;
		gl.clearDepth(1.0);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.DEPTH_TEST);
		
		// create an offscreen canvas for texture generation
		EASY.texture = {};
		EASY.texture.canvas = document.createElement("canvas");
		EASY.texture.canvas.width = 256;
		EASY.texture.canvas.height = 256;
		EASY.texture.context = EASY.texture.canvas.getContext("2d");

		// init the HUD and put up a wait message
		EASY.hud.init();
		EASY.hud.darken(EASY.hud.waitMsg);
		
		// begin async loading of resources from the server
		SOAR.loadResources(EASY.resources, function() {

			// this function is called when resource load is complete
			
			// allow game objects to process loaded resources
			EASY.cave.process();
			EASY.trash.process();
			EASY.ghost.process();
			EASY.corpse.process();
			
			// generate a new map
			EASY.generate();

			// schedule animation frame functions
			SOAR.schedule(EASY.update, 0, true);
			SOAR.schedule(EASY.draw, 0, true);

			// resize display & redraw if window size changes
			window.addEventListener("resize", function() {
				EASY.display.setSize(
					document.body.clientWidth, 
					document.body.clientHeight
				);
				EASY.draw();
			}, false);
			
			// tell the player what's going on
			EASY.hud.darken(EASY.BLURB);
			
			// wait for keypress
			EASY.hud.dom.window.bind("keydown", EASY.startGame);
			
		}, function(count, total) {
			// this function is called once for every resource received from the server

			var pc = Math.round(90 * count / total);
			EASY.hud.darken(EASY.hud.waitMsg + "<br>" + pc + "%");
		
		});
		
		// while waiting for resource load, initialize game objects
		EASY.cave.init();
		EASY.player.init();
		EASY.trash.init();
		EASY.ghost.init();
		EASY.corpse.init();
/*		
		var fl, hist = [];
		for (var k = 0; k < 100; k++) {
			EASY.cave.generate();
			fl = EASY.cave.flat.length;
			hist[fl] = (hist[fl] || 0) + 1;
		}
		for (k = 0; k < hist.length; k++)
			console.log(k, " --> ", hist[k]);
*/
	},
	
	/**
		run this to actually run the game on user keypress
		
		@method startGame
	**/
	
	startGame: function() {
	
		// unbind this handler
		EASY.hud.dom.window.unbind("keydown", EASY.startGame);
	
		// bind the HUD key handler
		EASY.hud.dom.window.bind("keydown", EASY.hud.onKeyDown);
		
		// show HUD readouts/legends
		jQuery("#legend").show();
		jQuery("#readout").show();
	
		// start the message pump
		SOAR.run();
		
		// reveal the game screen
		EASY.hud.lighten();
		
		EASY.player.mouse.invalid = true;
		
		// remember it's an event handler
		// don't allow key to bubble up
		return false;
	},
	
	/**
		(re)generate all necessary game state for a new map
		
		@method generate
	**/
	
	generate: function() {
		var ok = true;
		do {
			EASY.cave.generate();
			ok = EASY.corpse.generate();
			EASY.ghost.generate();
			ok = ok && EASY.trash.generate();
			EASY.player.generate();
		} while (!ok);
	},
	
	/**
		update all game objects that require it
		
		@method update
	**/
	
	update: function() {
		if (EASY.updating) {
			EASY.player.update();
			EASY.trash.update();
			EASY.ghost.update();
			EASY.corpse.update();
		}
	},

	/**
		draw all game objects that require it
		
		draw and update are separated so that the
		game can redraw the display when the game
		is paused (i.e., not updating) and resize
		events are being generated
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
	
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		if (!EASY.hideCave)
			EASY.cave.draw();
		EASY.trash.draw();
		EASY.corpse.draw();
		EASY.ghost.draw();
		if (EASY.player.camera.mapView) {
			EASY.player.draw();
		}
	},

	/**
		set debug display (temporary, please delete in production code)
	**/
	
	debug: function(s) {
		document.getElementById("debug").innerHTML = s;
	}
};
