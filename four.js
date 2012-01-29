/**

	Four: WebGL-based Game
	
	@module four
	@author cpgauthier

**/

var FOUR = {
	
	/**
		create GL context, set up game objects, load resources, run main loop

		@method start
	**/

	start: function() {

		var gl, tracker, resources;

		// create the GL display
		try {
			FOUR.display = SOAR.display.create("gl");
		} catch (e) {
			jQuery("#glerror").show();
			return;
		}

		// set initial display dimensions
		FOUR.display.setSize(
			document.body.clientWidth, 
			document.body.clientHeight
		);

		// set up any webgl stuff that's not likely to change
		gl = FOUR.display.gl;
		gl.clearDepth(1.0);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.DEPTH_TEST);
		
		// while waiting for resource load, initialize game objects
		FOUR.forest.init();
		FOUR.player.init();

		// begin async loading of resources from the server
		SOAR.loadResources(FOUR.world.resources, function() {
		
			// allow game objects to process loaded resources
			FOUR.forest.process();
		
			SOAR.schedule(FOUR.update, 0, true);
			SOAR.schedule(FOUR.draw, 0, true);

			window.addEventListener("resize", function() {
				FOUR.display.setSize(
					document.body.clientWidth, 
					document.body.clientHeight
				);
				// always draw if the canvas dimensions are changed
				FOUR.draw();
			}, false);
			
			SOAR.run();
		});
		
		// while waiting for resource load, initialize game objects
//		FOUR.forest.init();
//		FOUR.player.init();
	},
	
	/**
		update all game objects that require it
		
		@method update
	**/
	
	update: function() {
		FOUR.player.update();
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
		var gl = FOUR.display.gl;
	
		gl.clearColor(0.5, 0.5, 0.6, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		FOUR.forest.draw();
	}
};

