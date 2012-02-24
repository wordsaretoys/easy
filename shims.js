/**
	modifications to standard libraries
**/

/**
	import an image into a 2D noise function
	
	values are interpolated from the red channel. the
	method performs NO scaling and will take (0, 0) as
	the origin.
	
	@method import
	@param img an image data object
**/

SOAR.noise2D.import = function(img, seed) {
	var w = img.width;
	var h = img.height;
	var rng = SOAR.random.create(seed);
	var x, y, i, n, v;
	
	for (x = 0; x < w; x++) {
		for (y = 0; y < h; y++) {
			i = w * y + x;
			n = img.data[i * 4] / 256;
			v = img.data[i * 4 + 1] * rng.get() / 256
			this.map[i] = n + v;
		}
	}
};
