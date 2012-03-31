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
		corpse: {
			type: "image",
			path: "res/corpse.jpg"
		}
	},
	
	INTRO: [
		"Easy Does It<br>By Chris Gauthier<br>wordsaretoys.com",
		"Easy, the fabled adventurer, leaves a path of devastation through the deepest caves.",
		"He's got no time to make amends; that's <em>your</em> job.",
		"Dispose of his victims, calm their restless ghosts&mdash;and make a little money.",
		"<em>Very</em> little money.",
		"Find the exit to this passage, and your journey will begin."
	],
	
	I: new Float32Array([1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1]),
	
	RESOLVE_TARGET: 50,
	EARNING_TARGET: 1000,
	
	updating: true,
	training: true,
	introNum: 0,

	/**
		create GL context, set up game objects, load resources, run main loop

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
			
			EASY.hud.darken(EASY.hud.waitMsg);
		
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

			window.addEventListener("resize", function() {
				EASY.display.setSize(
					document.body.clientWidth, 
					document.body.clientHeight
				);
				// always draw if the canvas dimensions are changed
				EASY.draw();
			}, false);

			SOAR.run();
			
			EASY.hud.lighten();

			// set up a timed comment push to introduce the game concept
			EASY.introId = SOAR.schedule(function() {
				EASY.hud.comment(EASY.INTRO[EASY.introNum], "intro", true);
				EASY.introNum++;
				if (EASY.introNum === EASY.INTRO.length) {
					SOAR.unschedule(EASY.introId);
				}
			}, 6000, true);
			
		}, function(count, total) {
			// this function is called once for every resource received from the server

			var pc = Math.round(100 * count / total);
			EASY.hud.darken(EASY.hud.waitMsg + "<br>" + pc + "%");
		
		});
		
		// while waiting for resource load, initialize game objects
		EASY.cave.init();
		EASY.player.init();
		EASY.trash.init();
		EASY.ghost.init();
		EASY.corpse.init();
	},
	
	/**
		(re)generate all necessary game state for a new map
		
		@method generate
	**/
	
	generate: function() {
		EASY.cave.generate();
		if (!this.training) {
			EASY.corpse.generate();
			EASY.ghost.generate();
			EASY.trash.generate();
		}
		EASY.player.generate();
	},
	
	/**
		update all game objects that require it
		
		@method update
	**/
	
	update: function() {
		if (EASY.updating) {
			EASY.player.update();
			if (!EASY.training) {
				EASY.trash.update();
				EASY.ghost.update();
				EASY.corpse.update();
			}
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
		if (!EASY.training) {
			EASY.trash.draw();
			EASY.corpse.draw();
			EASY.ghost.draw();
		}
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
