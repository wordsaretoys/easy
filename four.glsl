<script id="vs-ground" type="x-shader/x-vertex">

/**
	forest ground vertex shader
	O' = P * M * V * O transformation, plus texture coordinates
	and color and lighting values
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	@param a_light  vertex array of light intensities
	
	@param projector projector matrix
	@param modelview modelview matrix
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates
	@param light	light intensity
	
**/

attribute vec3 position;
attribute vec2 texturec;
attribute float a_light;

uniform mat4 projector;
uniform mat4 modelview;

varying vec2 uv;
varying float light;

void main(void) {
	gl_Position = projector * modelview * vec4(position, 1.0);
	uv = texturec;
	light = a_light;
}
</script>

<script id="fs-ground" type="x-shader/x-fragment">

/**
	forest ground fragment shader
	
	@param tex0	ground noise texture

	@param light	light intensity
	@param uv		texture coordinates of fragment
	
**/

precision mediump float;
 
uniform sampler2D tex0;

varying float light;
varying vec2 uv;

void main(void) {
	vec3 tex = 	0.75 * texture2D(tex0, uv).rgb + 
				0.25 * texture2D(tex0, uv / 8.0).rgb + 
				0.5 * texture2D(tex0, uv / 64.0).rgb;
	gl_FragColor = vec4(light * tex, 1.0);
}

</script>

<script id="vs-sun" type="x-shader/x-vertex">

/**
	sun vertex shader
	O' = P * M * V * O transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates
	
**/

attribute vec3 position;
attribute vec2 texturec;

uniform mat4 projector;
uniform mat4 modelview;

varying vec2 uv;

void main(void) {
	gl_Position = projector * modelview * vec4(position, 1.0);
	uv = texturec;
}
</script>

<script id="fs-sun" type="x-shader/x-fragment">

/**
	sun fragment shader
	
	@param uv texture coordinates of fragment
	
**/

precision mediump float;
 
varying vec2 uv;

void main(void) {
	float c = 0.5 - sqrt(pow(uv.x, 2.0) + pow(uv.y, 2.0));
	gl_FragColor = vec4(1.0, 1.0, 1.0, c);
}

</script>

<script id="vs-trees" type="x-shader/x-vertex">

/**
	forest ground vertex shader
	O' = P * M * V * O transformation, plus texture coordinates
	and color and lighting values
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	@param a_light  vertex array of light intensities
	
	@param projector projector matrix
	@param modelview modelview matrix
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates
	@param light	light intensity
	
**/

attribute vec3 position;
attribute vec2 texturec;
attribute float a_light;

uniform mat4 projector;
uniform mat4 modelview;

varying vec2 uv;
varying float light;

void main(void) {
	gl_Position = projector * modelview * vec4(position, 1.0);
	uv = texturec;
	light = a_light;
}
</script>

<script id="fs-trees" type="x-shader/x-fragment">

/**
	forest ground fragment shader
	
	@param tex0	ground noise texture

	@param light	light intensity
	@param uv		texture coordinates of fragment
	
**/

precision mediump float;
 
uniform sampler2D tex0;

varying float light;
varying vec2 uv;

void main(void) {
	vec3 tex = 	texture2D(tex0, uv / 32.0).rgb;
	gl_FragColor = vec4(light * tex, 1.0 - tex.r);
}

</script>


