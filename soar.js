/** generated on Thu Dec 13 10:39:06 EST 2012 **/

/**
	Soar Object Library for WebGL Applications
	
	base API functions and animation loop
	
	@module SOAR
	@author cpgauthier
**/

requestAnimationFrame =	window.webkitRequestAnimationFrame ||
						window.mozRequestAnimationFrame ||
						window.oRequestAnimationFrame;
						
var SOAR = {

	PIMUL2: 2 * Math.PI,
	PIDIV2: Math.PI / 2,
	DEGRAD: Math.PI / 180,
	RADDEG: 180 / Math.PI,
	
	KEY: {
		TAB: 9,
		ENTER: 13,
		PAUSE: 19,
		SPACE: 32,
		ESCAPE: 27,
		LEFTARROW: 37,
		UPARROW: 38,
		RIGHTARROW: 39,
		DOWNARROW: 40,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,

		F1: 112, F2: 113, F3: 114, F4: 115,
		F5: 116, F6: 117, F7: 118, F8: 119,
		F9: 120, F10: 121, F11: 122, F12: 123,
		
		A: 65, 	B: 66,	C: 67,	D: 68,
		E: 69,	F: 70,	G: 71,	H: 72,
		I: 73,	J: 74,	K: 75,	L: 76,
		M: 77,	N: 78,	O: 79,	P: 80,
		Q: 81,	R: 82,	S: 83,	T: 84,
		U: 85,	V: 86,	W: 87,	X: 88,
		Y: 89,	Z: 90,

		ZERO: 48,	ONE: 49,	TWO: 50,	THREE: 51,
		FOUR: 52,	FIVE: 53,	SIX: 54,	SEVEN: 55,
		EIGHT: 56,	NINE: 57
	},

	lastFrame: 0,
	interval: 0,
	sinterval: 0,
	elapsedTime: 0,
	
	fpsCount: 0,
	fpsTime: 0,
	fps: 0,
	
	running: true,
	
	action: [],
	
	getHighResolutionTime: function() {
		if (window.performance.now) {
			return window.performance.now();
		}
		if (window.performance.webkitNow) {
			return window.performance.webkitNow();
		}
		return Date.now();
	},

	/**
		animation loop
		
		@method run
	**/
	
	run: function() {
		var t, dt, i, il, act;

		if (SOAR.running) {
			t = SOAR.getHighResolutionTime();
			dt = t - SOAR.lastFrame;
	
			SOAR.fpsCount++;
			if ((t - SOAR.fpsTime) >= 1000) {
				SOAR.fps = SOAR.fpsCount;
				SOAR.fpsCount = 0;
				SOAR.fpsTime = t;
			}
	
			// toss out any time delta greater than 1/2 second
			if (dt < 500)
				SOAR.interval = dt;
			SOAR.lastFrame = t;
			SOAR.sinterval = SOAR.interval * 0.001;
	
			// we use elapsed time to drive events as it won't
			// update when the application is paused. using the
			// system time throws up all kinds of trouble here.
			SOAR.elapsedTime += SOAR.interval;

			for (i = 0, il = SOAR.action.length; i < il; i++) {
				act = SOAR.action[i];
				if (act.active && SOAR.elapsedTime - act.timestamp > act.period) {
					act.func();
					if (act.repeat)
						act.timestamp = SOAR.elapsedTime;
					else
						act.active = false;
				}
			}
		}

		if (requestAnimationFrame) {
			requestAnimationFrame(SOAR.run);
		} else {
			setTimeout(SOAR.run, 1000 / 60);
		}
	},

	/**
		schedule a function for timed callback

		@method schedule
		@param function to call
		@param number of milliseconds between executions (0 for ASAP)
		@param true if function is to be executed periodically
		@return id of scheduled function
	**/
	
	schedule: function(func, period, repeat) {
		this.action.push({ 
			func: func, 
			period: period, 
			repeat: repeat, 
			timestamp: this.elapsedTime,
			active: true
		});
		return this.action.length - 1;
	},
	
	/**
		remove a function from the schedule
		
		@method unschedule
		@param id the id returned by the schedule function
	**/
	
	unschedule: function(id) {
		this.action[id].active = false;
	},

	/**
		return a function to the schedule
		
		@method reschedule
		@param id the id returned by the schedule function
	**/
	
	reschedule: function(id) {
		this.action[id].active = true;
	},

	/**
		start or stop frame animation
		@method togglePause
	**/
	
	togglePause: function() {
		this.running = !this.running;
	},

	/**
		copy members from one object to another
		
		@method extend
		@param dest object to copy members to
		@param src object to copy members from
	**/

	extend: function(dest, src) {
		for (p in src)
			if (src.hasOwnProperty(p))
				dest[p] = src[p];
	},
	
	/**
		create an inheritance chain between two objects
		
		@method chain
		@param a object to extend
		@param b object to copy members from
		@return new object
	**/

	chain: function(a, b) {
		var o = Object.create(a);
		SOAR.extend(o, b);
		return o;
	},
	
	/**
		retrieve text from a DOM object
		
		@method textOf
		@param id the id of the DOM object
		@return string containing text of DOM object
	**/
	
	textOf: function(id) {
		return document.getElementById(id).innerHTML;
	},
	
	/**
		load resources from the server
		
		the resources object has the form
		{
			<resource tag>: {
				type: "image" || "sound",
				path: "resource URL"
			},
			
			...
			
		}
		
		where <resource tag> is a human-readable identifier. each
		resource object will have a member called "data" added to
		it during the load operation, referencing an Image object
		or Audio object wrapping the resource.

		the onload function is optional, and should have the form
		
			function(count, total) { ... }
			
		where count will provide the number of resources loaded so
		far, and total the total number of resources to load.
		
		the oncomplete function has no parameters and is required.
		
		@method loadResources
		@param resources object identifying which resources to load
		@param oncomplete function to call once all resources are loaded
		@param onload function to call on each successful load
	**/
	
	loadResources: function(resources, oncomplete, onload) {
		var resourceName, resource, count = 0, total = 0;
		
		onload = onload || function() { };
		if (!oncomplete) {
			throw "SOAR.loadResources requires oncomplete event handler.";
		}
		
		// first pass generates objects, event handlers, and total count
		for (resourceName in resources) {
			if (resources.hasOwnProperty(resourceName)) {
				resource = resources[resourceName];
				total++;
				
				if (resource.type === "image") {
					resource.data = new Image();
					resource.data.addEventListener("load", function() {
						count++;
						onload(count, total);
						if (count === total)
							oncomplete();
					});
				}

				if (resource.type === "sound") {
					resource.data = new Audio();
					resource.data.addEventListener("canplaythrough", function() {
						count++;
						onload(count, total);
						if (count === total)
							oncomplete();
					});
				}
			}
		}
		
		// second pass kicks off the actual load
		for (resourceName in resources) {
			if (resources.hasOwnProperty(resourceName)) {
				resource = resources[resourceName];
				resource.data.src = resource.path;
			}
		}
	},
	
	/**
		retrieve image data from an image
		
		@method getImageData
		@param image the image object
		@param bound an optional object describing a subset of the image
		@return the image data object
	**/
	
	getImageData: function(image, bound) {
		var canvas = document.createElement("canvas");
		bound = bound || {};
		var x = bound.x || 0;
		var y = bound.y || 0;
		var w = bound.w || image.width;
		var h = bound.h || image.height;
		canvas.context = canvas.getContext("2d");
		canvas.width = w;
		canvas.height = h;
		canvas.context.drawImage(image, 0, 0);
		return canvas.context.getImageData(x, y, w, h);
	},
	
	/**
		return the sign of a number
		
		@method sign
		@param n number to test
		@return -1 if negative, 0 if zero, 1 if positive
	**/
	
	sign: function(n) {
		return n > 0 ? 1 : (n < 0 ? -1 : 0);
	},
	
	/**
		clamp a number to a set of limits
		
		@method clamp
		@param n number to clamp
		@param l number representing lower bound
		@param h number representing upper bound
		@return clamped value
	**/

	clamp: function(n, l, h) {
		return Math.min(Math.max(n, l), h);
	},
	
	/**
		generates a mesh of triangles within a 2D rectangle.
		
		useful for generating heightmaps.
		
		@method subdivide
		@param detail number of triangle subdivisions to generate
		@param bx0 x-coordinate of corner of bounding rectangle
		@param by0 y-coordinate of corner of bounding rectangle
		@param bx1 x-coordinate of other corner of bounding rectangle
		@param by1 y-coordinate of other corner of bounding rectangle
		@param callback function to call for each triangle
	**/
	
	subdivide: function(detail, bx0, by0, bx1, by1, callback) {

		function recurse(level, x0, y0, x1, y1, x2, y2) {
		
			var x3, y3;
			var x4, y4;
			var x5, y5;

			if (0 === level) {
				callback(x0, y0, x1, y1, x2, y2);
			} else {
				x3 = (x0 + x1) * 0.5;
				y3 = (y0 + y1) * 0.5;
				x4 = (x2 + x1) * 0.5;
				y4 = (y2 + y1) * 0.5;
				x5 = (x0 + x2) * 0.5;
				y5 = (y0 + y2) * 0.5;
				level--;
				recurse(level, x0, y0, x3, y3, x5, y5);
				recurse(level, x3, y3, x1, y1, x4, y4);
				recurse(level, x5, y5, x4, y4, x2, y2);
				recurse(level, x4, y4, x5, y5, x3, y3);
			}
		}
		recurse(detail, bx0, by0, bx0, by1, bx1, by1);
		recurse(detail, bx0, by0, bx1, by1, bx1, by0);
	},
	
	/**
		multiplies two 4x4 matrices
		
		note that the first array passed in
		is overwritten with the product matrix
		
		@method matMat
		@param a array, first matrix (WILL be overwritten)
		@param b array, second matrix
		@return array, product matrix
	**/
	
	matMat: function(a, b) {
		// generate the product in a set of temporary variables
		var r0 = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
		var r1 = a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13];
		var r2 = a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14];
		var r3 = a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15];

		var r4 = a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12];
		var r5 = a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13];
		var r6 = a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14];
		var r7 = a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15];

		var r8 = a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12];
		var r9 = a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13];
		var r10 = a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14];
		var r11 = a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15];

		var r12 = a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12];
		var r13 = a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13];
		var r14 = a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14];
		var r15 = a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15];
		
		// overwrite the first matrix
		a[0] = r0;
		a[1] = r1;
		a[2] = r2;
		a[3] = r3;
		
		a[4] = r4;
		a[5] = r5;
		a[6] = r6;
		a[7] = r7;
		
		a[8] = r8;
		a[9] = r9;
		a[10] = r10;
		a[11] = r11;
		
		a[12] = r12;
		a[13] = r13;
		a[14] = r14;
		a[15] = r15;

		return a;
	}
	
};

/**
	maintain a camera

	@namespace SOAR
	@class camera
**/

SOAR.camera = {

	viewAngle: 30.0,
	nearLimit: 0.5,
	farLimit: 1000.0,
	
	/**
		create the camera
		
		@method create
		@param display object, reference to display
		@return object, new camera
	**/
	
	create: function(display) {
	
		if (!display) {
			throw "SOAR.camera.create requires display object.";
		}
		
		var o = SOAR.chain(SOAR.rotator.create(), SOAR.camera);

		o.matrix.projector = new Float32Array(16);	
		o.matrix.modelview = new Float32Array(16);
		o.position = SOAR.vector.create();
		o.display = display;
		o.gl = display.gl;
		o.offset = SOAR.vector.create();
		
		return o;
	},
	
	/**
		return rotations matrix

		@method rotations
		@return internal rotations matrix as Float32Array(16)
	**/

	rotations: function() {
		return this.matrix.rotations;
	},
	
	/**
		return transpose matrix

		@method transpose
		@return internal transposed matrix as Float32Array(16)
	**/

	transpose: function() {
		return this.matrix.transpose;
	},

	/**
		generate projection matrix

		@method projector
		@return projection matrix as Float32Array(16)
	**/

	projector: function() {
		var pr = this.matrix.projector;
		var aspect, h, d;
				
		aspect = this.display.width / this.display.height;
		h = 1 / Math.tan(this.viewAngle * SOAR.DEGRAD);
		d = this.nearLimit - this.farLimit;

		pr[0] = h / aspect;
		pr[1] = pr[2] = pr[3] = 0;

		pr[5] = h;
		pr[4] = pr[6] = pr[7] = 0;

		pr[10] = (this.farLimit + this.nearLimit) / d;
		pr[8] = pr[9] = 0;
		pr[11] = -1;

		pr[14] = 2 * this.nearLimit * this.farLimit / d;
		pr[12] = pr[13] = pr[15] = 0;
		
		return pr;
	},
	
	/**
		generate modelview matrix

		@method modelview
		@return modelview matrix as Float32Array(16)
	**/

	modelview: function() {
		var o = this.orientation;
		var p = this.position;
		var f = this.offset;
		var mv = this.matrix.modelview;
		var ro = this.matrix.rotations;
		
		mv.set(ro);

		mv[12] = -(ro[0] * p.x + ro[4] * p.y + ro[8] * p.z) - f.x;
		mv[13] = -(ro[1] * p.x + ro[5] * p.y + ro[9] * p.z) - f.y;
		mv[14] = -(ro[2] * p.x + ro[6] * p.y + ro[10] * p.z) -f.z;

		mv[3]  = mv[7] = mv[11] = 0;
		mv[15] = 1;
		
		return mv;
	}
};


/**
	keyboard and mouse event capture and translator object
	
	@namespace SOAR
	@class capture
**/

SOAR.capture = {

	action: {},
	trackX: 0,
	trackY: 0,
	
	/**
		adds an entry to the action table
		
		func will be passed a parameter which will be true if the key or mouse
		button was pressed down, and false if it was released.
		
		@method addAction
		@param name string, short name of action (e.g., "forward")
		@param code number, unicode key value or mouse button code to assign to action
		@param event function, execute when action triggered
	**/
	
	addAction: function(name, code, event) {
		this.action[name] = {
			code: code,
			event: event,
			active: true
		};
	},
	
	/**
		looks up an action by its code
		
		@method lookup
		@param code number, assigned unicode key value or mouse button code
		@return action object, or undefined if no action found
	**/
	
	lookup: function(code) {
		var a, n;
		for (n in this.action) {
			a = this.action[n];
			if (a.active && a.code === code) {
				return a;
			}
		}
		return undefined;
	},
	
	/**
		initialize event handling and capture
		
		@method start
	**/

	start: function() {
		var that = this;
		var raw = {
			down: false,
			lock: false,
			lastX: 0,
			lastY: 0,
			dx: 0,
			dy: 0
		};

		// debugging only, please
		this.raw = raw;
		
		// keyboard events we pass to the calling application
		window.addEventListener("keydown", function(e) {
			var action = that.lookup(e.keyCode);
			if (action) {
				action.event(true);
				return false;
			} else {
				return true;
			}
		}, false);

		window.addEventListener("keyup", function(e) {
			var action = that.lookup(e.keyCode);
			if (action) {
				action.event(false);
				return false;
			} else {
				return true;
			}
		}, false);

		// but mouse events we handle locally
		document.body.addEventListener("mousedown", function(e) {
			var action = that.lookup(-e.button);
			if (action) {
				action.event(true);
			}
			
			raw.lastX = e.screenX;
			raw.lastY = e.screenY;
			raw.down = true;

			e.preventDefault();
			return false;
		}, false);
		
		document.body.addEventListener("mouseup", function(e) {
			var action = that.lookup(-e.button);
			if (action) {
				action.event(false);
			}

			raw.down = false;
			return false;
		}, false);

		document.body.addEventListener("mousemove", function(e) {
			if (SOAR.running && (raw.down || raw.lock)) {
				// if the movement properties are available
				if (typeof(e.movementX) !== "undefined" ||
				typeof(e.mozMovementX) !== "undefined" ||
				typeof(e.webkitMovementX) !== "undefined") {

					raw.dx += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
					raw.dy += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
					
				} else {
					// if not, fall back to click-n-drag method
					raw.dx += (e.screenX - raw.lastX);
					raw.dy += (e.screenY - raw.lastY);
				}
				raw.lastX = e.screenX;
				raw.lastY = e.screenY;
			}
			return false;
		}, false);
		
		// define tracking update method
		this.update = function() {
			that.trackX = raw.dx;
			that.trackY = raw.dy;
			raw.dx = 0;
			raw.dy = 0;
		}
		
		// handle full screen change event
		var fullScreenChange = function () {
			var db = document.body;
			if (document.fullScreenElement === db || 
			document.webkitFullscreenElement === db ||
			document.mozFullscreenElement === db ||	
			document.mozFullScreenElement === db) {
				db.requestPointerLock = db.requestPointerLock || 
					db.mozRequestPointerLock || db.webkitRequestPointerLock;
				db.requestPointerLock();
			}
		};

		document.addEventListener("fullscreenchange", fullScreenChange, false);
		document.addEventListener("mozfullscreenchange", fullScreenChange, false);
		document.addEventListener("webkitfullscreenchange", fullScreenChange, false);
		
		// handle pointer lock event
		var pointerLockChange = function () {
			var db = document.body;
			if (document.pointerLockElement === db || 
			document.webkitPointerLockElement === db ||
			document.mozPointerLockElement === db) {
				raw.lock = true;
			} else {
				raw.lock = false;
			}
		};
		
		document.addEventListener('pointerlockchange', pointerLockChange, false);
		document.addEventListener('mozpointerlockchange', pointerLockChange, false);
		document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
		
	},
	
	/**
		set full screen mode (and kick off pointer lock)
		
		MUST be called in the context of a click or key event!
		
		@method setFullscreen
	**/
	
	setFullscreen: function() {
		var db = document.body;
		db.requestFullscreen = db.requestFullscreen || db.mozRequestFullscreen || 
			db.mozRequestFullScreen || db.webkitRequestFullscreen;
		db.requestFullscreen();
	}
	
};

/**
	represent a canvas with a GL context, plus operations
	
	@namespace SOAR
	@class display
**/

SOAR.display = {

	/**
		create a new display object
		
		@method create
		@param id DOM id of a canvas element
		@param alpha turns back-buffer alpha on/off
		@return a new display object
	**/
	
	create: function(id, alpha) {

		var o = Object.create(SOAR.display);

		o.canvas = document.getElementById(id);
		if (!o.canvas)
			throw "SOAR.display.create couldn't create canvas object.";

		try {
			o.gl = o.canvas.getContext("experimental-webgl", {alpha: alpha} );
		}
		catch (e) {
			try {
				o.gl = o.canvas.getContext("webgl", {alpha: alpha} );
			}
			catch (e) {
				throw "SOAR.display.create couldn't get WebGL context.";
			}
		}

		// just in case the browser didn't throw an exception in WebGL's absence
		if (!o.gl)
			throw "SOAR.display.create couldn't get WebGL context.";

		return o;
	},
	
	/**
		adjust display size

		@method setSize
		@param width the new width of the canvas
		@param height the new height of the canvas
	**/

	setSize: function(width, height) {
		this.width = width;
		this.height = height;
		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
	}
	
};

/**
	javascript implementation of the marching cubes algorithm
	ported from http://paulbourke.net/geometry/polygonise and
	http://webglsamples.googlecode.com/hg/caves/caves.html
	
	@namespace SOAR
	@class mcubes
**/

SOAR.mcubes = {

	edgeTable: new Int16Array([
		0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
		0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
		0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
		0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
		0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
		0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
		0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
		0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
		0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
		0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
		0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
		0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
		0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
		0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
		0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
		0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
		0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
		0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
		0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
		0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
		0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
		0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
		0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
		0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
		0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
		0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
		0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
		0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
		0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
		0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
		0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
		0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
	]),
	
	triTable: new Int16Array([
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
		3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
		3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
		3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
		9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
		9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
		2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
		8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
		9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
		4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
		3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
		1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
		4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
		4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
		9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
		5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
		2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
		9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
		0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
		2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
		10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
		4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
		5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
		5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
		9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
		0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
		1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
		10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
		8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
		2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
		7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
		9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
		2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
		11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
		9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
		5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
		11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
		11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
		1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
		9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
		5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
		2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
		0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
		5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
		6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
		3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
		6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
		5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
		1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
		10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
		6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
		8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
		7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
		3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
		5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
		0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
		9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
		8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
		5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
		0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
		6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
		10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
		10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
		8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
		1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
		3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
		0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
		10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
		3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
		6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
		9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
		8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
		3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
		6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
		0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
		10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
		10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
		2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
		7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
		7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
		2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
		1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
		11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
		8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
		0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
		7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
		10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
		2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
		6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
		7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
		2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
		1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
		10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
		10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
		0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
		7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
		6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
		8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
		9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
		6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
		4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
		10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
		8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
		0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
		1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
		8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
		10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
		4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
		10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
		5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
		11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
		9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
		6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
		7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
		3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
		7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
		9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
		3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
		6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
		9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
		1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
		4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
		7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
		6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
		3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
		0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
		6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
		0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
		11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
		6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
		5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
		9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
		1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
		1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
		10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
		0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
		5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
		10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
		11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
		9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
		7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
		2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
		8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
		9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
		9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
		1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
		9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
		9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
		5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
		0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
		10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
		2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
		0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
		0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
		9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
		5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
		3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
		5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
		8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
		0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
		9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
		0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
		1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
		3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
		4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
		9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
		11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
		11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
		2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
		9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
		3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
		1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
		4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
		4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
		0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
		3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
		3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
		0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
		9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
		1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1	
	]),
	
	/**
		find all polygons that describe an isosurface within a cubic volume
		
		@method repoly
		@param start object, near corner point of initial volume
		@param finish object, far corner point of initial volume
		@param step number, step length of each cube
		@param thresh number, surface threshold value
		@param fsurf function, 3D surface function
		@param fpoly function, polygon handling function
		
		fsurf must accept three floats and return a float, and be defined for all reals.
		fpoly must accept a vertex and a normal vector, and should pass them to a mesh.
	**/

	poly: function(start, finish, step, thresh, fsurf, fpoly) {
	
		var vl = [
			SOAR.vector.create(), SOAR.vector.create(), SOAR.vector.create(),
			SOAR.vector.create(), SOAR.vector.create(), SOAR.vector.create(),
			SOAR.vector.create(), SOAR.vector.create(), SOAR.vector.create(),
			SOAR.vector.create(), SOAR.vector.create(), SOAR.vector.create() 
		];

		var et = this.edgeTable;
		var tt = this.triTable;
		var nn = SOAR.vector.create();
		var x0, y0, z0, x1, y1, z1;
		var i, j, tric, cind;
		
		function verp(p, xa, ya, za, xb, yb, zb, fa, fb) {
			// handle edge cases
			if (Math.abs(thresh - fa) < 0.00001) {
				p.x = xa;
				p.y = ya;
				p.z = za;
			} else if (Math.abs(thresh - fb) < 0.00001) {
				p.x = xb;
				p.y = yb;
				p.z = zb;
			} else if (Math.abs(fa - fb) < 0.00001) {
				p.x = xa;
				p.y = ya;
				p.z = za;
			} else {
				// perform interpolation
				var mu = (thresh - fa) / (fb - fa);
				p.x = xa + mu * (xb - xa);
				p.y = ya + mu * (yb - ya);
				p.z = za + mu * (zb - za);
			}
		}
		
		for (x0 = start.x; x0 <= finish.x; x0 = x1) {
			x1 = x0 + step;
			for (y0 = start.y; y0 <= finish.y; y0 = y1) {
				y1 = y0 + step;
				for (z0 = start.z; z0 <= finish.z; z0 = z1) {
					z1 = z0 + step;
			
					// find surface points
					var f0 = fsurf(x0, y0, z0);
					var f1 = fsurf(x1, y0, z0);
					var f2 = fsurf(x1, y0, z1);
					var f3 = fsurf(x0, y0, z1);
					var f4 = fsurf(x0, y1, z0);
					var f5 = fsurf(x1, y1, z0);
					var f6 = fsurf(x1, y1, z1);
					var f7 = fsurf(x0, y1, z1);
			
					// calculate index into edgetable
					cind =  (f0 < thresh) ? 1 : 0;
					cind |= (f1 < thresh) ? 2 : 0;
					cind |= (f2 < thresh) ? 4 : 0;
					cind |= (f3 < thresh) ? 8 : 0;
					cind |= (f4 < thresh) ? 16 : 0;
					cind |= (f5 < thresh) ? 32 : 0;
					cind |= (f6 < thresh) ? 64 : 0;
					cind |= (f7 < thresh) ? 128 : 0;

					// surface does not penetrate cube, no triangles for you
					if (et[cind] === 0)
						continue;
				
					// find where the surface intersects the cube
					if (et[cind] & 1) {
						verp(vl[0], x0, y0, z0, x1, y0, z0, f0, f1);
					}
					if (et[cind] & 2) {
						verp(vl[1], x1, y0, z0, x1, y0, z1, f1, f2);
					}
					if (et[cind] & 4) {
						verp(vl[2], x1, y0, z1, x0, y0, z1, f2, f3);
					}
					if (et[cind] & 8) {
						verp(vl[3], x0, y0, z1, x0, y0, z0, f3, f0);
					}
					if (et[cind] & 16) {
						verp(vl[4], x0, y1, z0, x1, y1, z0, f4, f5);
					}
					if (et[cind] & 32) {
						verp(vl[5], x1, y1, z0, x1, y1, z1, f5, f6);
					}
					if (et[cind] & 64) {
						verp(vl[6], x1, y1, z1, x0, y1, z1, f6, f7);
					}
					if (et[cind] & 128) {
						verp(vl[7], x0, y1, z1, x0, y1, z0, f7, f4);
					}
					if (et[cind] & 256) {
						verp(vl[8], x0, y0, z0, x0, y1, z0, f0, f4);
					}
					if (et[cind] & 512) {
						verp(vl[9], x1, y0, z0, x1, y1, z0, f1, f5);
					}
					if (et[cind] & 1024) {
						verp(vl[10], x1, y0, z1, x1, y1, z1, f2, f6);
					}
					if (et[cind] & 2048) {
						verp(vl[11], x0, y0, z1, x0, y1, z1, f3, f7);
					}
			
					nn.x = (f1 + f2 + f5 + f6) - (f0 + f3 + f4 + f7);
					nn.y = (f4 + f5 + f6 + f7) - (f0 + f1 + f2 + f3);
					nn.z = (f2 + f3 + f6 + f7) - (f0 + f1 + f4 + f5);
					nn.norm();

					// generate triangle vertexes
					for (i = 0, j = cind * 16; tt[j + i] != -1; i++) {
						fpoly( vl[ tt[j + i] ], nn );
					}
				}
			}
		}
	}
		
};

/**
	represent a mesh of vertices
	
	@namespace SOAR
	@class mesh
**/

SOAR.mesh = {

	STARTING_LENGTH: 256,

	/**
		create a new mesh object
		
		@method create
		@param reference to a display object
		@param dp the draw primitive, defaults to TRIANGLES
		@return a new object
	**/
	
	create: function(display, dp) {

		var o, gl;
		
		if (!display) {
			throw "SOAR.mesh.create requires display object.";
		}
		gl = display.gl;
		
		o = Object.create(SOAR.mesh);
		o.data = new Float32Array(this.STARTING_LENGTH);
		o.drawPrimitive = dp || gl.TRIANGLES;
		o.length = 0;

		o.indexData = new Uint16Array(this.STARTING_LENGTH);
		o.indexLength = 0;
		o.indexBuffer = null;
		
		o.drawCount = 0;
		o.stride = 0;
		o.buffer = null;

		o.attribute = [];

		o.display = display;
		o.gl = gl;

		return o;
	},

	/**
		add an attribute to the mesh

		attribute ids should be retrieved from the shader. example:
		
			var sample = SOAR.shader.create(
				sampleVertexSource, sampleFragmentSource,
				["position", "texture"],
				["projector", "modelview"],
				[] );
		
			...
		
			mesh.add(sample.position, 3);
			mesh.add(sample.texture, 2);
		
		attributes may only contain floats, no integer/boolean types
		
		@method add
		@param id numeric id of the attribute
		@param size number of floats represented by the atttribute
	**/
	
	add: function(id, size) {
		var i, il;
		this.attribute.push({
			id: id,
			size: size
		});
		for (this.stride = 0, i = 0, il = this.attribute.length; i < il; i++)
			this.stride += this.attribute[i].size;
	},
	
	/**
		increase the number of vertices available to the mesh
		
		@method grow
		@param n number of floats to grow by
	**/
	
	grow: function(n) {
		var newSize = this.length + n;
		var newBuffer, l;
		if (newSize > this.data.length) {
			// find smallest power of 2 greater than newSize
			l = Math.pow(2, Math.ceil(Math.log(newSize) / Math.LN2));
			newBuffer = new Float32Array(l);
			newBuffer.set(this.data);
			this.data = newBuffer;
		}
	},

	/**
		specify a collection of vertex data for the mesh
		
		data must be specified in the SAME ORDER as the 
		attributes that were specified by the mesh.add
		example:
		
			mesh.add(program.position, 3)
			mesh.add(program.texture, 2);
			...
			mesh.set(pos.x, pos.y, pos.z, tex.u, tex.v);
		
		@method set
		@param variable argument list, floats only
	**/
	
	set: function() {
		var i, il = arguments.length;
		this.grow(il);
		for (i = 0; i < il; i++) {
			this.data[this.length++] = arguments[i];
		}
	},

	/**
		load an array of vertex data into the mesh
		
		@method load
		@param data array of float
	**/
	
	load: function(data) {
		this.grow(data.length);
		this.data.set(data, this.length);
		this.length += data.length;
	},

	/**
		reset a mesh object for use with new vertex data
		
		@method reset
	**/
	
	reset: function() {
		this.length = 0;
		this.indexLength = 0;
	},
	
	/**
		release GL resources held by this object
		
		@method release
	**/
	
	release: function() {
		this.gl.deleteBuffer(this.buffer);
		this.buffer = null;
		if (this.indexBuffer) {
			this.gl.deleteBuffer(this.indexBuffer);
			this.indexBuffer = null;
		}
	},

	/**
		generate a GL buffer from the vertex data
		
		@method build
		@param retain true if vertex data is to be kept around
	**/
	
	build: function(retain) {
		var gl = this.gl;

		if (this.buffer != null)
			gl.deleteBuffer(this.buffer);
		this.buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, this.length), gl.STATIC_DRAW);
		
		this.drawCount = Math.ceil(this.length / this.stride);
		
		if (!retain)
			delete this.data;
			
		if (this.indexLength > 0) {

			if (this.indexBuffer != null)
				gl.deleteBuffer(this.indexBuffer);
			this.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData.subarray(0, this.indexLength), gl.STATIC_DRAW);
			
			this.drawCount = this.indexLength;
			
			if (!retain)
				delete this.indexData;

		}
	},

	/**
		draw the mesh

		If draw() is called by itself, it will draw the entire buffer. Pass an offset and
		length to draw a particular area of the mesh. The mesh.length variable tracks the
		current size of the mesh; store it off while setting up the vertices of different
		models, and determine offsets and sizes from the stored values. Note that offsets
		and lengths must be divided by mesh.stride before submitting to the draw method!!
		
			model1.offset = mesh.length / mesh.stride;
			mesh.load(...);
			model1.size = mesh.length / mesh.stride - model1.offset;
			model2.offset = mesh.length / mesh.stride;
			mesh.load(...);
			model2.size = mesh.length / mesh.stride - model2.offset;
			
			... (set up shader for model 1)
			mesh.draw(model1.offset, model1.size);
			... (set up shader for model 2)
			mesh.draw(model2.offset, model2.size);
		
		@method draw
		@param offset starting vertex to draw, defaults to 0
		@param length number of verticies to draw, defaults to all
	**/
	
	draw: function(offset, length) {
		var gl = this.gl;
		var i, il, attr, acc;
		
		offset = offset || 0;
		length = length || this.drawCount;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		if (this.indexBuffer) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		}
		for (acc = 0, i = 0, il = this.attribute.length; i < il; i++) {
			attr = this.attribute[i];
			gl.enableVertexAttribArray(attr.id);
			gl.vertexAttribPointer(attr.id, attr.size, gl.FLOAT, false, 
				this.stride * Float32Array.BYTES_PER_ELEMENT, acc * Float32Array.BYTES_PER_ELEMENT);
			acc += attr.size;
		}
		
		if (this.indexLength > 0) {
			gl.drawElements(this.drawPrimitive, length, gl.UNSIGNED_SHORT, offset);
		} else {
			gl.drawArrays(this.drawPrimitive, offset, length);
		}

		for (i = 0, il = this.attribute.length; i < il; i++)
			gl.disableVertexAttribArray(this.attribute[i].id);
	},
	
	/**
		increase the number of vertices available to the mesh index
		
		@method growIndex
		@param n number of short ints to grow by
	**/
	
	growIndex: function(n) {
		var newSize = this.indexLength + n;
		var newBuffer, l;
		if (newSize > this.indexData.length) {
			// find smallest power of 2 greater than newSize
			l = Math.pow(2, Math.ceil(Math.log(newSize) / Math.LN2));
			newBuffer = new Uint16Array(l);
			newBuffer.set(this.indexData);
			this.indexData = newBuffer;
		}
	},

	/**
		load an array of index data into the mesh
		
		@method loadIndex
		@param data array of short int
	**/
	
	loadIndex: function(data) {
		this.growIndex(data.length);
		this.indexData.set(data, this.indexLength);
		this.indexLength += data.length;

	},

	/**
		add index data to the mesh
		
		@method index
		@param variable argument list, short integers only
	**/
	
	index: function() {
		var i, il = arguments.length;
		this.growIndex(il);
		for (i = 0; i < il; i++) {
			this.indexData[this.indexLength++] = arguments[i];
		}
	}
	
};

/**
	linear congruential random number generator
	
	@namespace SOAR
	@class random
**/

SOAR.random = {

	/**
		create the random number generator
		
		@method create
		@param seed initial value, defaults to current time in ms
		@return new random number generator
	**/

	create: function(seed) {
		var o = Object.create(SOAR.random);
		o.reseed(seed);
		o.modu = Math.pow(2, 32);
		return o;
	},

	/**
		generate the next random number
		
		@method iterate
	**/
	
	iterate: function() {
		this.seed = (this.seed * 1664525 + 1013904223) % this.modu;
	},

	/**
		return the next random number as float within a range
		
		@method get
		@param l number, lower bound, 0 if not specified
		@param u number, upper bound, 1 if not specified
		@return random float in the range {0...1}
	**/
	
	get: function(l, u) {
		l = l || 0;
		u = (u === 0) ? 0 : u || 1;
		this.iterate();
		return l + (u - l) * (this.seed / this.modu);
	},
	
	/**
		return the next random number as long integer
		
		@method getl
		@return random long integer
	**/
	
	getl: function() {
		this.iterate();
		return this.seed;
	},

	/**
		reset the generator with a new seed
		
		@method reseed
		@param seed initial value, defaults to current time in ms
	**/

	reseed: function(seed) {
		this.seed = seed || Date.now();
	}
};

/**
	manage interpolation functions
	
	@namespace SOAR
	@class interpolate
**/

SOAR.interpolator = {

	linear: function(y1, y2, mu) {
		return (y1 * (1.0 - mu) + y2 * mu);
	},
	
	cosine: function(y1, y2, mu) {
		var mu2 = (1.0 - Math.cos(mu * Math.PI)) / 2.0;
		return (y1 * (1.0 - mu2) + y2 * mu2);
	}
	
};

/**
	1D noise function

	@namespace SOAR
	@class noise1D
**/

SOAR.noise1D = {

	/**
		create the noise object
		
		@method create
		@param seed initial value for prng
		@param ampl maximum amplitude of function
		@param sz length of source matrix
		@param per period of noise function
		@return new noise object
	**/

	create: function(seed, ampl, sz, per) {
		var o = Object.create(SOAR.noise1D);
		var rng = SOAR.random.create(seed);
		var x;
		
		o.interpolate = SOAR.interpolator.cosine;
		o.size = sz;
		o.period = per;
		o.amplitude = ampl;
		o.map = new Float32Array(sz);

		for (x = 0; x < sz; x++) {
			o.map[x] = rng.get();
		}
		
		return o;
	},
	
	/**
		get the function value at x
		
		@method get
		@param x any real number
		@return value of function at x
	**/
	
	get: function(x) {
		var xf = this.period * Math.abs(x);
		var xi = Math.floor(xf);
		var mu = xf - xi;

		var xi0 = xi % this.size;
		var xi1 = (xi + 1) % this.size;

		return this.amplitude * this.interpolate(this.map[xi0], this.map[xi1], mu);
	}
};

/**
	2D noise function

	@namespace SOAR
	@class noise2D
**/

SOAR.noise2D = {

	/**
		create the noise object
	
		@method create
		@param seed initial value for rng
		@param ampl maximum amplitude of function
		@param xsz length of source matrix in x
		@param xper period of noise function in x
		@param ysz length of source matrix in y (defaults to xsz)
		@param yper period of noise function in y (defaults to xper)
		@return new noise object
	**/

	create: function(seed, ampl, xsz, xper, ysz, yper) {
		var o = Object.create(SOAR.noise2D);
		var rng = SOAR.random.create(seed);
		var x, xl;

		o.interpolate = SOAR.interpolator.cosine;
		o.xSize = xsz;
		o.ySize = ysz || xsz;
		o.xPeriod = xper;
		o.yPeriod = yper || xper;
		o.amplitude = ampl;
		o.map = new Float32Array(o.xSize * o.ySize);

		for (x = 0, xl = o.map.length; x < xl; x++) {
			o.map[x] = rng.get();
		}
			
		return o;
	},

	/**
		get the function value at (x, y)
		
		@method get
		@param x any real number
		@param y any real number
		@return value of function at (x, y)
	**/
	
	get: function(x, y) {
		var xf = this.xPeriod * Math.abs(x);
		var xi = Math.floor(xf);
		var mux = xf - xi;

		var yf = this.yPeriod * Math.abs(y);
		var yi = Math.floor(yf);
		var muy = yf - yi;

		var xi0 = xi % this.xSize;
		var yi0 = yi % this.ySize;
		var xi1 = (xi + 1) % this.xSize;
		var yi1 = (yi + 1) % this.ySize;

		var v1, v2, v3, v4;
		var i1, i2;

		v1 = this.map[xi0 + yi0 * this.xSize];
		v2 = this.map[xi0 + yi1 * this.xSize];
		i1 = this.interpolate(v1, v2, muy);
		
		v3 = this.map[xi1 + yi0 * this.xSize];
		v4 = this.map[xi1 + yi1 * this.xSize];
		i2 = this.interpolate(v3, v4, muy);

		return this.amplitude * this.interpolate(i1, i2, mux);
	}
};

/**
	3D noise function

	@namespace SOAR
	@class noise3D
**/

SOAR.noise3D = {

	/**	
		create the noise object
	
		@method create
		@param seed initial value for rng
		@param ampl maximum amplitude of function
		@param xsz length of source matrix in x
		@param xper period of noise function in x
		@param ysz length of source matrix in y (defaults to xsz)
		@param yper period of noise function in y (defaults to xper)
		@param zsz length of source matrix in z (defaults to xsz)
		@param zper period of noise function in z (defaults to xper)
	**/
	
	create: function(seed, ampl, xsz, xper, ysz, yper, zsz, zper) {
		var o = Object.create(SOAR.noise3D);
		var rng = SOAR.random.create(seed);
		var x, xl;

		o.interpolate = SOAR.interpolator.cosine;
		o.xSize = xsz;
		o.ySize = ysz || xsz;
		o.zSize = zsz || ysz || xsz;
		o.xPeriod = xper;
		o.yPeriod = yper || xper;
		o.zPeriod = zper || yper || xper;
		o.amplitude = ampl;
		o.map = new Float32Array(o.xSize * o.ySize * o.zSize);

		for (x = 0, xl = o.map.length; x < xl; x++) {
			o.map[x] = rng.get();
		}
		
		return o;
	},

	/**
		get the function value at (x, y, z)
		
		@method get
		@param x any real number
		@param y any real number
		@param z any real number
		@return value of function at (x, y, z)
	**/
	
	get: function(x, y, z) {
		var xf = this.xPeriod * Math.abs(x);
		var xi = Math.floor(xf);
		var mux = xf - xi;

		var yf = this.yPeriod * Math.abs(y);
		var yi = Math.floor(yf);
		var muy = yf - yi;

		var zf = this.zPeriod * Math.abs(z);
		var zi = Math.floor(zf);
		var muz = zf - zi;

		var xi0 = xi % this.xSize;
		var yi0 = yi % this.ySize;
		var zi0 = zi % this.zSize;
		var xi1 = (xi + 1) % this.xSize;
		var yi1 = (yi + 1) % this.ySize;
		var zi1 = (zi + 1) % this.zSize;

		var v1, v2, v3, v4;
		var i1, i2, i3, i4;
		var xysz = this.xSize * this.ySize;

		v1 = this.map[xi0 + yi0 * this.xSize + zi0 * xysz];
		v2 = this.map[xi0 + yi0 * this.xSize + zi1 * xysz];
		i1 = this.interpolate(v1, v2, muz);
		
		v3 = this.map[xi0 + yi1 * this.xSize + zi0 * xysz];
		v4 = this.map[xi0 + yi1 * this.xSize + zi1 * xysz];
		i2 = this.interpolate(v3, v4, muz);

		i3 = this.interpolate(i1, i2, muy);

		v1 = this.map[xi1 + yi0 * this.xSize + zi0 * xysz];
		v2 = this.map[xi1 + yi0 * this.xSize + zi1 * xysz];
		i1 = this.interpolate(v1, v2, muz);
		
		v3 = this.map[xi1 + yi1 * this.xSize + zi0 * xysz];
		v4 = this.map[xi1 + yi1 * this.xSize + zi1 * xysz];
		i2 = this.interpolate(v3, v4, muz);

		i4 = this.interpolate(i1, i2, muy);

		return this.amplitude * this.interpolate(i3, i4, mux);
	}
};


/**
	texture/heightmap/field pattern generators
	
	@namespace SOAR
	@class pattern
**/

SOAR.pattern = {

	rng: SOAR.random.create(),

	/**
		fills a pattern object with a specified intensity
		
		will wipe out any pattern already drawn to image!
		
		@method fill
		@param img object, an image data object
		@param c number, intensity
	**/
	
	fill: function(img, c) {
		var dt = img.data;
		var il = dt.length;
		for (var i = 0; i < il; i++) {
			dt[i] = c;
		}
	},
	
	/**
		fills a pattern object with random numbers
		
		@method randomize
		@param img object, an image data object
		@param seed number, a random seed
		@param lo number, lowest random number
		@param hi number, highest random number
	**/
	
	randomize: function(img, seed, lo, hi) {
		var dt = img.data;
		var il = dt.length;
		var rng = this.rng;
		rng.reseed(seed);
		for (var i = 0; i < il; i++) {
			dt[i] = rng.get(lo, hi);
		}
	},
	
	/**
		generate a pattern by random walking across image
		
		blend MUST be the range (0..1)
		p0-p3 MUST be in range (0...1)
		
		ONLY works with 2D bitmaps!
		
		@method walk
		@param img object, image data object to apply pattern
		@param seed number, a seed to apply to the PRNG
		@param reps number, multiplier for iterations
		@param blend number, multipler for blending
		@param c number, intensity to blend on each pass
		@param p0 number, chance of moving +x on each pass
		@param p1 number, chance of moving +y on each pass
		@param p2 number, chance of moving -x on each pass
		@param p3 number, chance of moving -y on each pass
	**/
		
	walk: function (img, seed, reps, blend, c, p0, p1, p2, p3) {
		var w = img.width;
		var h = img.height;
		var il = Math.round(w * h * reps);
		var rng = this.rng;
		var dt = img.data;
		var dnelb = 1 - blend;
		var x, y, i, j;
		
		rng.reseed(seed);
		x = Math.floor(rng.get(0, w));
		y = Math.floor(rng.get(0, h));
		for (i = 0; i < il; i++) {
		
			j = x + w * y;
			dt[j] = dt[j] * dnelb + c * blend;
			
			if (rng.get() < p0) {
				x++;
				if (x >= w) {
					x = 0;
				}
			}
			if (rng.get() < p1) {
				y++;
				if (y >= h) {
					y = 0;
				}
			}
			if (rng.get() < p2) {
				x--;
				if (x < 0) {
					x = w - 1;
				}
			}
			if (rng.get() < p3) {
				y--;
				if (y < 0) {
					y = h - 1;
				}
			}
		}
	},
	
	/**
		draw a line across an image (with wrapping)
		
		blend MUST be the range (0..1)
		
		ONLY works with 2D bitmaps!

		@method scratch
		@param img object, image data object to apply pattern
		@param blend number, multipler for blending
		@param c number, intensity of scratch line
		@param x, y number, starting point of scratch
		@param dx, dy number, direction of scratch
		@param len number, length of scratch
	**/
	
	scratch: function(img, blend, c, x, y, dx, dy, len) {
		var w = img.width;
		var h = img.height;
		var dt = img.data;
		var dnelb = 1 - blend;
		var i, j;
		
		for (i = 0; i < len; i++) {
		
			j = (Math.floor(x) + w * Math.floor(y));
			dt[j] = dt[j] * dnelb + c * blend;
			
			x += dx;
			y += dy;
			
			if (x >= w) {
				x = 0;
			}
			if (y >= h) {
				y = 0;
			}
			if (x < 0) {
				x = w - 1;
			}
			if (y < 0) {
				y = h - 1;
			}
		}
	},
	
	/**
		blend a color in at random points
		
		blend MUST be the range (0..1)

		@method scratch
		@param img object, image data object to apply pattern
		@param seed number, a seed to apply to the PRNG
		@param reps number, multiplier for iterations
		@param blend number, multipler for blending
		@param c number, intensity of stipple points
	**/
	
	stipple: function(img, seed, reps, blend, c) {
		var dt = img.data;
		var jl = dt.length;
		var il = Math.round(jl * reps);
		var rng = this.rng;
		var dnelb = 1 - blend;
		var i, j;
		
		rng.reseed(seed);
		for (i = 0; i < il; i++) {
			j = Math.floor(rng.get(0, jl));
			dt[j] = dt[j] * dnelb + c * blend;
		}
		
	},
	
	/**
		blend in a rectangular region
		
		ONLY works with 2D bitmaps!
		
		@method rect
		@param img object, image data object to apply pattern
		@param blend number, multipler for blending
		@param c number, intensity of rectangle points
		@param x0, y0 number, coordinates of corner
		@param x1, y1 number, coordinates of opposite corner
	**/
	
	rect: function(img, blend, c, x0, y0, x1, y1) {
		var w = img.width;
		var h = img.height;
		var dt = img.data;
		var dnelb = 1 - blend;
		var x, y, i;
		x0 = Math.min(Math.max(x0, 0), w - 1);
		x1 = Math.min(Math.max(x1, 0), w - 1);
		y0 = Math.min(Math.max(y0, 0), h - 1);
		y1 = Math.min(Math.max(y1, 0), h - 1);
		for (y = y0; y <= y1; y++) {
			for (x = x0; x <= x1; x++) {
				i = Math.floor(x) + w * Math.floor(y);
				dt[i] = dt[i] * dnelb + c * blend;
			}
		}		
	},
	
	/**
		generate pattern by walking across image
		with non-perpendicular angles (h/t to Arlie Davis)
		
		ONLY works with 2D bitmaps!
		
		@method anglewalk
		@param img object, image data object to apply pattern
		@param seed number, a seed to apply to the PRNG
		@param reps number, multiplier for iterations
		@param blend number, multipler for blending
		@param c number, intensity to blend on each pass
		@param len number, path length for each pass
	**/
	
	anglewalk: function(img, seed, reps, blend, c, len) {
		var w = img.width;
		var h = img.height;
		var il = Math.round(w * h * reps);
		var rng = this.rng;
		var dt = img.data;
		var dnelb = 1 - blend;
		var x, y, i, j, a;
		
		rng.reseed(seed);
		x = rng.get(0, w);
		y = rng.get(0, h);
		for (i = 0; i < il; i++) {
		
			j = Math.floor(x) + w * Math.floor(y);
			dt[j] = dt[j] * dnelb + c * blend;
			
			a = rng.get(0, SOAR.PIMUL2);
			x += len * Math.cos(a);
			y += len * Math.sin(a);
			
			if (x >= w) {
				x = 0;
			}
			if (y >= h) {
				y = 0;
			}
			if (x < 0) {
				x = w - 1;
			}
			if (y < 0) {
				y = h - 1;
			}
		}
	},
	
	/**
		adjusts values to specified lo/hi
		
		@method normalize
		@param img object, an image data object
		@param lo number, lowest allowed number
		@param hi number, highest allowed number
	**/
	
	normalize: function(img, lo, hi) {
		var dt = img.data;
		var il = dt.length;
		var i, olo, ohi, d0, d1, nn;
		
		// determine existing lo & hi values
		olo = Infinity, ohi = -Infinity;
		for (i = 0; i < il; i++) {
			olo = Math.min(olo, dt[i]);
			ohi = Math.max(ohi, dt[i]);
		}
		if (olo === ohi) {
			return;
		}
		
		// map to new values
		d0 = ohi - olo;
		d1 = hi - lo;
		for (i = 0; i < il; i++) {
			nn = (dt[i] - olo) / d0;
			dt[i] = nn * d1 + lo;
		}
	},
	
};

/**
	represent quaternion in 3-space plus standard operations
	
	@namespace SOAR
	@class quaternion
**/

SOAR.quaternion = {

	/**
		create a new quaternion object
		
		@method create
		@param x the x-coordinate of the axis vector
		@param y the y-coordinate of the axis vector
		@param z the z-coordinate of the axis vector
		@param w the rotation around the axis vector
		@return a new quaternion object
	**/
	
	create: function(x, y, z, w) {
		var o = Object.create(SOAR.quaternion);
		o.set(x, y, z, w);
		return o;
	},

	/**
		set the elements of the quaternion
		
		@method set
		@param x any real number
		@param y any real number
		@param z any real number
		@param w any real number
		@return the object itself
	**/
	
	set: function(x, y, z, w) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
		this.w = w || 0;
		return this;
	},

	/**
		copy elements from another quaternion

		@method copy		
		@param a object to copy from
		@return the object itself
	**/
	
	copy: function(a) { 
		this.x = a.x;
		this.y = a.y;
		this.z = a.z;
		this.w = a.w;
		return this;
	},
	
	/**
		multiply another quaternion by this one
		result = this * a

		@method mul	
		@param a quaternion to multiply
		@return the object itself, multiplied
	**/
	
	mul: function(a) {
		var tx = this.x;
		var ty = this.y;
		var tz = this.z;
		var tw = this.w;
		this.x = tw * a.x + tx * a.w + ty * a.z - tz * a.y;
		this.y = tw * a.y + ty * a.w + tz * a.x - tx * a.z;
		this.z = tw * a.z + tz * a.w + tx * a.y - ty * a.x;
		this.w = tw * a.w - tx * a.x - ty * a.y - tz * a.z;
		return this;
	},

	/**
		negate the quaternion
		
		@method neg
		@return the object iself, negated
	**/
	
	neg: function() {
		return this.set(-this.x, -this.y, -this.z, this.w); 
	},

	/**
		normalize the quaternion
		
		@method norm
		@return the object itself, normalized
	**/
	
	norm: function()
	{
		var mag = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
		return this.set(this.x / mag, this.y / mag, this.z / mag, this.w / mag);
	},

	/**
		copy quaternion data into array
		
		@method toArray
		@param a array to copy to, defaults to new empty array
		@return array containing elements [x, y, z, w]
	**/
	
	toArray: function(a)
	{
		a = a || [];
		a[0] = this.x;
		a[1] = this.y;
		a[2] = this.z;
		a[3] = this.w;
		return a;
	},
	
	/**
		generate matrix from quaternion
		
		@method toMatrix
		@param m array to copy to, defaults to new empty array
		@return 16-element array containing generated matrix
	**/
	
	toMatrix: function(m) {
		m = m || [];
		m[0] = 1.0 - 2.0 * (this.y * this.y + this.z * this.z);
		m[1] = 2.0 * (this.x * this.y + this.z * this.w);
		m[2] = 2.0 * (this.x * this.z - this.y * this.w);
		m[3] = 0;
		m[4] = 2.0 * (this.x * this.y - this.z * this.w);
		m[5] = 1.0 - 2.0 * (this.x * this.x + this.z * this.z);
		m[6] = 2.0 * (this.z * this.y + this.x * this.w);
		m[7] = 0;
		m[8] = 2.0 * (this.x * this.z + this.y * this.w);
		m[9] = 2.0 * (this.y * this.z - this.x * this.w);
		m[10] = 1.0 - 2.0 * (this.x * this.x + this.y * this.y);
		m[11] = 0;
		m[12] = 0;
		m[13] = 0;
		m[14] = 0;
		m[15] = 1;
		return m;
	},
	
	/**
		sets quaternion data from axis-angle representation
		
		@method setFromAxisAngle
		@param x any real number
		@param y any real number
		@param z any real number
		@param ang any real number
		@return the object itself
	**/
	
	setFromAxisAngle: function(x, y, z, ang) {
		var ha = Math.sin(ang / 2);
		return this.set(x * ha, y * ha, z * ha, Math.cos(ang / 2));
	},
	
	/**
		smooth linear interpolation between two quaternions
		
		@method slerp
		@param a object, quaternion
		@param b object, quaternion
		@param m number, interpolation factor
		@return interpolated quaternion
	**/
	
	slerp: function(a, b, m) {
		this.x += m * (b.x - a.x);
		this.y += m * (b.y - a.y);
		this.z += m * (b.z - a.z);
		this.w += m * (b.w - a.w);
		return this.norm();
	}
	
	
};

/**
	represent full three-axis rotation with optional constraints

	@namespace SOAR
	@class rotator
**/

SOAR.rotator = {

	/**
		create a new rotator
		
		@method create
		@return object
	**/
	
	create: function() {
		// create a object with a SOAR.rotator prototype
		var o = Object.create(SOAR.rotator);

		// represents the end product of all rotations
		o.product = SOAR.quaternion.create(0, 0, 0, 1);

		// tracks axial rotations in bound mode
		o.component = {
			x: SOAR.quaternion.create(0, 0, 0, 1),
			y: SOAR.quaternion.create(0, 0, 0, 1),
			z: SOAR.quaternion.create(0, 0, 0, 1)
		};

		// represents unit vectors
		o.right = SOAR.vector.create();
		o.up = SOAR.vector.create();
		o.front = SOAR.vector.create();

		// used for scratch calculations
		o.scratch = {
			c: SOAR.quaternion.create(),
			q: SOAR.quaternion.create()
		};
		
		// rotation and transpose matricies
		// (shader-compatible!)
		o.matrix = {
			transpose: new Float32Array(16),
			rotations: new Float32Array(16)
		};
		
		// start in free rotation mode.
		// set to false after create to use bound mode
		o.free = true;
		
		// rotation bounds only available in bound mode
		o.bound = SOAR.vector.create();
		
		// init scale factor to 1
		o.scale = 1;
		
		// initialize anything that's left
		o.make();
		return o;
	},

	/**
		update rotation matrix and orientation vectors
		
		don't call this in app code unless you've 
		manipulated the product quaternion directly
		
		@method make
	**/
	
	make: function() {
		var ro = this.matrix.rotations;
		var tr = this.matrix.transpose;
	
		// copy to rotation matrix
		this.product.toMatrix(ro);
		
		// copy to orientation vectors
		// front vector is negated for left-handed coordinate system
		this.right.set(ro[0], ro[4], ro[8]);
		this.up.set(ro[1], ro[5], ro[9]);
		this.front.set(ro[2], ro[6], ro[10]).neg();

		// apply scale factor to the rotation entries
		var scale = this.scale;
		ro[0] = ro[0] * scale;
		ro[1] = ro[1] * scale;
		ro[2] = ro[2] * scale;
		ro[4] = ro[4] * scale;
		ro[5] = ro[5] * scale;
		ro[6] = ro[6] * scale;
		ro[8] = ro[8] * scale;
		ro[9] = ro[9] * scale;
		ro[10] = ro[10] * scale;
		
		// copy to transpose matrix
		tr.set(ro);
		tr[1] = ro[4];
		tr[4] = ro[1];
		tr[2] = ro[8];
		tr[8] = ro[2];
		tr[6] = ro[9];
		tr[9] = ro[6];
	},
	
	/**
		rotate by specified amounts
		
		@method turn
		@param rx number, rotation around x axis (pitch)
		@param ry number, rotation around y axis (yaw)
		@param rz number, rotation around z axis (roll)
	**/
	
	turn: function(rx, ry, rz) {
		var co = this.component;
		var sc = this.scratch;

		// if in free-rotation mode
		if (this.free) {
		
			co.x.setFromAxisAngle(1, 0, 0, rx);
			co.y.setFromAxisAngle(0, 1, 0, ry);
			co.z.setFromAxisAngle(0, 0, 1, rz);
			sc.q.copy(co.x).mul(co.y).mul(co.z).mul(this.product).norm();
			this.product.copy(sc.q);
			
		} else {

			// bound mode requires tracking and testing each axis separately

			sc.q.setFromAxisAngle(1, 0, 0, rx);
			sc.c.copy(co.x).mul(sc.q).norm();
			if (sc.c.w >= this.bound.x) {
				co.x.copy(sc.c);
			}

			sc.q.setFromAxisAngle(0, 1, 0, ry);
			sc.c.copy(co.y).mul(sc.q).norm();
			if (sc.c.w >= this.bound.y) {
				co.y.copy(sc.c);
			}
			
			sc.q.setFromAxisAngle(0, 0, 1, rz);
			sc.c.copy(co.z).mul(sc.q).norm();
			if (sc.c.w >= this.bound.z) {
				co.z.copy(sc.c);
			}
			
			this.product.set(0, 0, 0, 1);
			this.product.mul(co.x).mul(co.y).mul(co.z).norm();
		}
		
		// generate rotation matricies and unit vectors
		this.make();
	},
	
	/**
		track a second rotator, aligning local rotation to it
		
		useful for animations where making a direct copy would
		"snap" the model into place without smooth transitions
		
		@method track
		@param r rotator object
		@param t tracking rate
	**/
	
	track: function(r, t) {
		var co = this.component;
		var sc = this.scratch;
	
		this.product.slerp(this.product, r.product, t);

		// if in bound mode
		if (!this.free) {
			// decompose product into components
			sc.c.set(this.product.x, 0, 0, this.product.w).norm();
			if (sc.c.w >= this.bound.x) {
				co.x.copy(sc.c);
			} else {
				co.x.set(0, 0, 0, 1);
			}
			
			sc.c.set(0, this.product.y, 0, this.product.w).norm();
			if (sc.c.w >= this.bound.y) {
				co.y.copy(sc.c);
			} else {
				co.y.set(0, 0, 0, 1);
			}
			
			sc.c.set(0, 0, this.product.z, this.product.w).norm();
			if (sc.c.w >= this.bound.z) {
				co.z.copy(sc.c);
			} else {
				co.z.set(0, 0, 0, 1);
			}
		}
		
		this.make();
	}

}
/**
	represent a shader program (vertex & fragment pair)
	
	@namespace SOAR
	@class shader
**/

SOAR.shader = {

	/**
		create a shader program object
		
		compiles the code into a GL program object. references to all 
		specified uniforms and samples are also added to this object.

		when adding attributes to the mesh (using mesh.add), put them
		in the same order they are listed in the attributes array!		
		
		@method create
		@param reference to a display object
		@param vertex string containing the vertex shader code to compile
		@param fragment string containing the fragment shader code to compile
		@param attributes array of all attribute variables referenced in vertex shader
		@param uniforms array of all uniform variables referenced in the shaders
		@param samplers array of all sampler variables referenced in the shaders
		@return a new program object
	**/

	create: function(display, vertex, fragment, attributes, uniforms, samplers) {
		var vobj, fobj, prog, gl, i, il, n, o;

		if (!display) {
			throw "SOAR.shader.create requires display object.";
		}
		
		attributes = attributes || [];
		uniforms = uniforms || [];
		samplers = samplers || [];
		gl = display.gl;

		// compile the vertex shader
		vobj = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vobj, vertex);
		gl.compileShader(vobj);
		if (!gl.getShaderParameter(vobj, gl.COMPILE_STATUS)) {
			console.log(gl.getShaderInfoLog(vobj));
			throw "SOAR.shader.create couldn't compile vertex shader";
		}

		// compile the fragment shader
		fobj = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fobj, fragment);
		gl.compileShader(fobj);
		if (!gl.getShaderParameter(fobj, gl.COMPILE_STATUS)) {
			console.log(gl.getShaderInfoLog(fobj));
			throw "SOAR.shader.create couldn't compile fragment shader";
		}

		// create and link the shader program
		prog = gl.createProgram();

		gl.attachShader(prog, vobj);
		gl.attachShader(prog, fobj);
		gl.linkProgram(prog);

		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			console.log(gl.getProgramInfoLog(prog));
			throw "SOAR.shader.create couldn't link shader program";
		}

		o = Object.create(SOAR.shader);
		o.program = prog;

		// add attribute variables
		for (i = 0, il = attributes.length; i < il; i++) {
			n = attributes[i];
			o[n] = gl.getAttribLocation(prog, n);
		}

		// add uniform variables
		for (i = 0, il = uniforms.length; i < il; i++) {
			n = uniforms[i];
			o[n] = gl.getUniformLocation(prog, n);
		}

		// add sampler variables
		for (i = 0, il = samplers.length; i < il; i++) {
			n = samplers[i];
			o[n] = gl.getUniformLocation(prog, n);
		}

		o.display = display;
		o.gl = gl;

		return o;
	},

	/**
		activates the shader program
		
		@method activate
	**/
	
	activate: function() {
		this.gl.useProgram(this.program);
	},

	/**
		release GL resources held by this object
		
		@method release
	**/
	
	release: function() {
		var gl = this.gl;
		var shader = gl.getAttachedShaders(this.program);
		var i, il;
		for (i = 0, il = shader.length; i < il; i++) {
			gl.detachShader(this.program, shader[i]);
			gl.deleteShader(shader[i]);
		}
		gl.deleteProgram(this.program);
		delete this.program;
	}

};


/**
	functions for interpolating across space
	
	@namespace SOAR
	@class space
**/

SOAR.space = {

	/**
		returns a blank bitmap object of specified size
		
		@method make
		@param w number, width 
		@param h number, height (optional)
		@param d number, depth (optional)
		@return object
	**/
	
	make: function(w, h, d) {
		h = h || 0;
		d = d || 0;
		var l = w * (h ? h : 1) * (d ? d : 1);
		return {
			data: new Float32Array(l),
			width: w,
			height: h,
			depth: d
		};
	},

	/**
		returns a blank bitmap object of specified size
		and limited to Uint8 values
		
		@method makeU8
		@param w number, width 
		@param h number, height (optional)
		@param d number, depth (optional)
		@return object
	**/
	
	makeU8: function(w, h, d) {
		h = h || 0;
		d = d || 0;
		var l = w * (h ? h : 1) * (d ? d : 1);
		return {
			data: new Uint8Array(l),
			width: w,
			height: h,
			depth: d
		};
	},

	/**
		cosine interpolation function
		
		@method cerp
		@param y1 number
		@param y2 number
		@param mu number
		@return number, interpolated between y1 and y2 over cosine curve
	**/
	
	cerp: function(y1, y2, mu) {
		var mu2 = (1.0 - Math.cos(mu * Math.PI)) / 2.0;
		return (y1 * (1.0 - mu2) + y2 * mu2);
	},

	/**
		make a line interpolation object from a 1D bitmap
		
		@method makeLine
		@param img object, 1D bitmap object to use as source
		@param amp number, amplitude of line object
		@param per number, period of line object
		@return object, line interpolator
	**/
	
	makeLine: function(img, amp, per) {
		var cerp = this.cerp;
		
		return function(x) {
			var xf = (per * x) % img.width;
			if (xf < 0) {
				xf += img.width;
			}
			var xi0 = Math.floor(xf);
			var mu = xf - xi0;
			var xi1 = (xi0 + 1) % img.width;
			
			return amp * cerp(img.data[xi0], img.data[xi1], mu);
		};
	
	},
	
	/**
		make a surface interpolation object from a 2D bitmap
		
		@method makeSurface
		@param img object, 2D bitmap object to use as source
		@param amp number, amplitude of surface object
		@param xpr number, period of surface object in x
		@param ypr number, period of surface object in y
		@return object, surface interpolator
	**/
	
	makeSurface: function(img, amp, xpr, ypr) {
		var cerp = this.cerp;

		ypr = ypr || xpr;
	
		return function(x, y) {

			var xf = (xpr * x) % img.width;
			if (xf < 0) {
				xf += img.width;
			}
			var xi0 = Math.floor(xf);
			var mux = xf - xi0;

			var yf = (ypr * y) % img.height;
			if (yf < 0) {
				yf += img.height;
			}
			var yi0 = Math.floor(yf);
			var muy = yf - yi0;

			var xi1 = (xi0 + 1) % img.width;
			var yi1 = (yi0 + 1) % img.height;
			var y0m = yi0 * img.width;
			var y1m = yi1 * img.width;

			var i1 = cerp(img.data[xi0 + y0m], img.data[xi0 + y1m], muy);
			var i2 = cerp(img.data[xi1 + y0m], img.data[xi1 + y1m], muy);
			return amp * cerp(i1, i2, mux);	
		};
	},
	
	/**
		make a field interpolation object from a 3D bitmap
		
		@method makeField
		@param img object, 3D bitmap object to use as source
		@param amp number, amplitude of field object
		@param xpr number, period of surface object in x
		@param ypr number, period of surface object in y
		@param zpr number, period of surface object in z
		@return object, field interpolator
	**/
	
	makeField: function(img, amp, xpr, ypr, zpr) {
		var xys = img.width * img.height;
		var cerp = this.cerp;
	
		ypr = ypr || xpr;
		zpr = zpr || ypr;
		
		return function(x, y, z) {

			var xf = (xpr * x) % img.width;
			if (xf < 0) {
				xf += img.width;
			}
			var xi0 = Math.floor(xf);
			var mux = xf - xi0;

			var yf = (ypr * y) % img.height;
			if (yf < 0) {
				yf += img.height;
			}
			var yi0 = Math.floor(yf);
			var muy = yf - yi0;

			var zf = (zpr * z) % img.depth;
			if (zf < 0) {
				zf += img.depth;
			}
			var zi0 = Math.floor(zf);
			var muz = zf - zi0;

			var xi1 = (xi0 + 1) % img.width;
			var yi1 = (yi0 + 1) % img.height;
			var zi1 = (zi0 + 1) % img.depth;
			
			var y0m = yi0 * img.width;
			var y1m = yi1 * img.width;
			var z0m = zi0 * xys;
			var z1m = zi1 * xys;

			var i1, i2, i3, i4;
			i1 = cerp(img.data[xi0 + y0m + z0m], img.data[xi0 + y0m + z1m], muz);
			i2 = cerp(img.data[xi0 + y1m + z0m], img.data[xi0 + y1m + z1m], muz);
			i3 = cerp(i1, i2, muy);

			i1 = cerp(img.data[xi1 + y0m + z0m], img.data[xi1 + y0m + z1m], muz);
			i2 = cerp(img.data[xi1 + y1m + z0m], img.data[xi1 + y1m + z1m], muz);
			i4 = cerp(i1, i2, muy);
			
			return amp * cerp(i3, i4, mux);		
		};
	},
	
};

/**
	represent a texture object
	
	@namespace SOAR
	@class texture
**/

SOAR.texture = {

	/**
		create texture object from an image or imageData object

		if the object is an image, it must be loaded already.
		
		the "sub" parameter allows creating multiple textures
		from a single image. to cut download time, images are
		often placed into a single bitmap "strip". if the sub
		parameter is supplied it must be of the form
		{ 
			x: left edge of sub-area,
			y: top edge of sub-area,
			w: width of sub-area,
			h: height of sub-area
		 }
		
		@method create
		@param reference to a display object
		@param img an Image, ImageData or custom object
		@param sub an object defining a sub-area of the image
		@return a new texture object
	**/
	
	create: function(display, img, sub) {
		var o, gl, canvas, tex;
		
		if (!display) {
			throw "SOAR.texture.create requires display object.";
		}

		o = Object.create(SOAR.texture);
		o.display = display;
		o.gl = display.gl;
		
		if (sub) {
			img = SOAR.getImageData(img, sub);
		}
		
		gl = o.gl;
		tex = gl.createTexture();
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		
		// if the image object has a depth property, assume it's user-created
		if (img.depth !== undefined) {
			// assume single-channel luminance
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 
				img.width, img.height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, img.data);
		} else {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		o.data = tex;
		return o;
	},

	/**
		bind the texture to a specified texture unit

		used in conjunction with shader.activate()
		the sampler parameter is available from the activated shader
		
		@method bind
		@param index the index of the GL texture unit, range {0..MAX_TEXTURE_IMAGE_UNITS}
		@param sampler object reference to the sampler variable
	**/

	bind: function(index, sampler) {
		var gl = this.gl;
		gl.uniform1i(sampler, index);
		gl.activeTexture(gl.TEXTURE0 + index);
		gl.bindTexture(gl.TEXTURE_2D, this.data);  
	},
	
	/**
		release GL resources held by this object
		
		@method release
	**/
	
	release: function() {
		this.gl.deleteTexture(this.data);
		delete this.data;
	}
	
};


/**
	represent vector in 3-space plus standard operations
	
	@namespace SOAR
	@class vector
**/

SOAR.vector = {

	/**
		create a new vector object
		
		@method create
		@param x the x-coordinate of the new vector
		@param y the y-coordinate of the new vector
		@param z the z-coordinate of the new vector
		@return a new vector object
	**/
	
	create: function(x, y, z) {
		var o = Object.create(SOAR.vector);
		o.set(x, y, z);
		return o;
	},

	/**
		set the elements of the vector
		
		@method set
		@param x any real number
		@param y any real number
		@param z any real number
		@return the object itself
	**/
	
	set: function(x, y, z) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
		return this;
	},
	
	/**
		copy elements from another vector

		@method copy
		@param a object to copy from
		@return the object itself
	**/
	
	copy: function(a) { 
		this.x = a.x;
		this.y = a.y;
		this.z = a.z;
		return this;
	},
	
	/**
		add another vector to this one
		
		@method add
		@param a vector to add
		@return the vector, added
	**/
	
	add: function(a) {
		this.x += a.x;
		this.y += a.y;
		this.z += a.z;
		return this;
	},
	
	/**
		subtract another vector from this one
		
		@method sub
		@param a vector to subtract
		@return the vector, subtracted
	**/
	
	sub: function(a) {
		this.x -= a.x;
		this.y -= a.y;
		this.z -= a.z;
		return this;
	},
	
	/**
		multiply this vector by a constant
		
		@method mul
		@param c scalar to multiply
		@return the vector, multiplied
	**/
	
	mul: function(c) {
		this.x *= c;
		this.y *= c;
		this.z *= c;
		return this;
	},
	
	/**
		divide this vector by a constant
		
		return zero-length vector if constant is zero
		
		@method div
		@param c constant to divide by
		@return the vector, divided
	**/
	
	div: function(c) {
		if (c)
		{
			this.x /= c;
			this.y /= c;
			this.z /= c;
		}
		else
			this.set(0, 0, 0);
		return this;
	},
	
	/**
		negate this vector
		
		@method neg
		@return the vector, negated
	**/
	
	neg: function() {
		return this.set(-this.x, -this.y, -this.z); 
	},
	
	/**
		return the length of the vector
		
		@method length
		@return the length of the vector
	**/
	
	length: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	},

	/**
		get distance between this vector and another
		
		@method distance
		@param a vector 
		@return distance between this vector and a
	**/
	
	distance: function(a) {
		var dx = this.x - a.x;
		var dy = this.y - a.y;
		var dz = this.z - a.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	},

	/**
		get square of distance between this vector and another
		
		@method distsqrd
		@param a vector 
		@return distance^2 between this vector and a
	**/
	
	distsqrd: function(a) {
		var dx = this.x - a.x;
		var dy = this.y - a.y;
		var dz = this.z - a.z;
		return dx * dx + dy * dy + dz * dz;
	},

	/**
		normalize this vector
		
		@method norm
		@return this vector, normalized
	**/
	
	norm: function() {
		var l = this.length();
		return this.div(l);
	},

	/**
		obtain dot product between this vector and another
		
		@method dot
		@param a vector
		@return dot product between this vector and a
	**/
	
	dot: function(a) {
		return this.x * a.x + this.y * a.y + this.z * a.z;
	},

	/**
		obtain cross product between this vector and another
		
		@method cross
		@param a vector
		@return this vector crossed with a
	**/
	
	cross: function(a) {
		var tx = this.x;
		var ty = this.y;
		var tz = this.z;
		this.x = ty * a.z - tz * a.y;
		this.y = tz * a.x - tx * a.z;
		this.z = tx * a.y - ty * a.x;
		return this;
	},

	/**
		copy vector data into array
		
		@method toArray
		@param a array to copy to, defaults to new empty array
		@return array containing elements [x, y, z]
	**/
	
	toArray: function(a) {
		a = a || [];
		a[0] = this.x;
		a[1] = this.y;
		a[2] = this.z;
		return a;
	},
	
	/**
		round the vector by a specified factor
		
		@method nearest
		@param v number to round by
		@param f rounding function, defaults to Math.round
		@return the object, rounded off
	**/
	
	nearest: function(v, f) {
		f = f || Math.round;
		this.x = f(this.x / v) * v;
		this.y = f(this.y / v) * v;
		this.z = f(this.z / v) * v;
		return this;
	},
	
	/**
		transform by a matrix multiplication
		
		@method transform
		@param m array, the matrix to multiply by
		@return the object, transformed
	**/
	
	transform: function(m) {
		var x = m[0] * this.x + m[4] * this.y + m[8] * this.z + m[12];
		var y = m[1] * this.x + m[5] * this.y + m[9] * this.z + m[13];
		var z = m[2] * this.x + m[6] * this.y + m[10] * this.z + m[14];
		var d = m[3] * this.x + m[7] * this.y + m[11] * this.z + m[15];
		return this.set(x / d, y / d, z / d);
	},
	
	/**
		generate a guaranteed perpendicular vector (for length > 0)
		
		@method perp
		@return the object, perpendicularized
	**/
	
	perp: function() {
		var swp;
		if (this.x !== this.y) {
			swp = this.x;
			this.x = this.y;
			this.y = swp;
		} else if (this.x !== this.z) {
			swp = this.x;
			this.x = this.z;
			this.z = swp;
		} else {
			swp = this.y;
			this.y = this.z;
			this.z = swp;
		}
		if (this.x !== 0) {
			this.x = -this.x;
		} else if (this.y !== 0) {
			this.y = -this.y;
		} else {
			this.z = -this.z;
		}
		return this;
	}
};

