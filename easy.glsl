<script id="vs-cave" type="x-shader/x-vertex">

/**
	cave vertex shader
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

<script id="fs-cave" type="x-shader/x-fragment">

/**
	cave fragment shader
	
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

