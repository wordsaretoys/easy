/**
	provides an interpolated 2D function over a canvas
	
	adapted from the 2D noise function. draw over the
	context as usual, call the map() function to make
	a bitmap of the canvas, then call get() with the 
	channel number.
	
	@namespace EASY
	@class canvasser
**/

EASY.canvasser = {

	RED: 0,
	GREEN: 1,
	BLUE: 2,

	/**
		create the canvasser object
	
		@method create
		@param ampl maximum amplitude of function
		@param width width of canvas
		@param xscale scale of output in x
		@param height height of canvas (defaults to width)
		@param yscale scale of output in y (defaults to xscale)
		@return new object
	**/

	create: function(ampl, width, xscale, height, yscale) {
		var o = Object.create(EASY.canvasser);
		o.canvas = document.createElement("canvas");
		o.context = o.canvas.getContext("2d");
		
		o.canvas.width = width;
		o.canvas.height = height || width;
		
		o.scale = {
			x: xscale,
			y: yscale || xscale
		};

		o.interpolate = SOAR.interpolator.cosine;
		o.amplitude = ampl;
			
		return o;
	},
	
	/**
		generate an addressable map from the canvas
		
		you must call this function before using any of the
		get functions, but AFTER drawing on the canvas.
		
		@method build
		@x left of area to map (defaults to 0)
		@y top of area to map (defaults to 0)
		@w width of area to map (defaults to canvas width)
		@h height of area to map (defaults to canvas height)
	**/
	
	build: function(x, y, w, h) {
		this.map = this.context.getImageData(
			x || 0,
			y || 0,
			w || this.canvas.width,
			h || this.canvas.height
		);
	},
	

	/**
		get the function value at (x, y)
		
		@method get
		@param c channel to address (0, 1, 2)
		@param x any real number
		@param y any real number
		@return value of function at (x, y)
	**/
	
	get: function(c, x, y) {
		var w = this.map.width;
		var h = this.map.height;
		var data = this.map.data;
	
		var xf = this.scale.x * Math.abs(x);
		var xi = Math.floor(xf);
		var mux = xf - xi;

		var yf = this.scale.y * Math.abs(y);
		var yi = Math.floor(yf);
		var muy = yf - yi;

		var xi0 = SOAR.clamp(xi, 0, w - 1);
		var yi0 = SOAR.clamp(yi, 0, h - 1);
		var xi1 = SOAR.clamp((xi + 1), 0, w - 1);
		var yi1 = SOAR.clamp((yi + 1), 0, h - 1);

		var v1, v2, v3, v4;
		var i1, i2;
		
		v1 = data[4 * (xi0 + yi0 * w) + c] / 256;
		v2 = data[4 * (xi0 + yi1 * w) + c] / 256;
		i1 = this.interpolate(v1, v2, muy);
		
		v3 = data[4 * (xi1 + yi0 * w) + c] / 256;
		v4 = data[4 * (xi1 + yi1 * w) + c] / 256;
		i2 = this.interpolate(v3, v4, muy);

		return this.amplitude * this.interpolate(i1, i2, mux);
	}
};

