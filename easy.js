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
			path: "res/oil.png"
		},
		change: {
			type: "image",
			path: "res/change.png"
		},
		wood: {
			type: "image",
			path: "res/chest.png"
		},
		flesh: {
			type: "image",
			path: "res/flesh.png"
		},
		cloth: {
			type: "image",
			path: "res/cloth.png"
		}
	},

	/**
		create GL context, set up game objects, load resources, run main loop

		@method start
	**/

	start: function() {

		var gl, tracker, resources;

		// create the GL display
		try {
			EASY.display = SOAR.display.create("gl");
		} catch (e) {
			jQuery("#glerror").show();
			return;
		}

		// add any useful shims
		Array.prototype.pick = function() {
			return this[Math.floor(Math.random() * this.length)];
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
		
		// while waiting for resource load, initialize game objects
		EASY.cave.init();
		EASY.player.init();
		EASY.hud.init();
		EASY.trash.init();
		EASY.ghost.init();
		
		EASY.hud.darken(EASY.hud.waitMsg);
		
		// begin async loading of resources from the server
		SOAR.loadResources(EASY.resources, function() {

			EASY.generate();
		
			// allow game objects to process loaded resources
			EASY.cave.process();
			EASY.trash.process();
			EASY.ghost.process();
			
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
/*			
			TODO: fix this, seems to be causing crashes at pageload

			// always release GL resources if page is refreshed
			window.addEventListener("beforeunload", function() {
				EASY.chamber.release();
				EASY.bush.release();
			}, false);
*/			
			SOAR.run();
			
			EASY.hud.lighten();
		});
		
		// while waiting for resource load, initialize game objects
//		EASY.player.init();
	},
	
	/**
		generate all necessary game objects on chamber exit
		
		@method generate
	**/
	
	generate: function() {
		EASY.cave.generate();
		EASY.trash.generate();
		EASY.ghost.generate();
	},
	
	/**
		update all game objects that require it
		
		@method update
	**/
	
	update: function() {
		EASY.player.update();
		EASY.trash.update();
		EASY.ghost.update();
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
		
		if (!EASY.lookup.hideCave)
			EASY.cave.draw();
		EASY.trash.draw();
		EASY.ghost.draw();
	},

	/**
		set debug display (temporary, please delete in production code)
	**/
	
	debug: function(s) {
		document.getElementById("debug").innerHTML = s;
	}
};
