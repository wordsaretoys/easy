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
	@param object	position in modelview coordinates
	
**/

attribute vec3 position;
attribute vec2 texturec;
attribute float a_light;

uniform mat4 projector;
uniform mat4 modelview;

varying vec2 uv;
varying float light;
varying vec4 object;

void main(void) {
	object = modelview * vec4(position, 1.0);
	gl_Position = projector * object;
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
	@param object	position in modelview coordinates
	
**/

precision mediump float;
 
uniform sampler2D tex0;

varying float light;
varying vec2 uv;
varying vec4 object;

void main(void) {
	vec3 tex = 	texture2D(tex0, uv * 1.0).r * vec3(0.8, 0.4, 0.2) +
				texture2D(tex0, uv * 5.0).g * vec3(0.3, 0.6, 0.3) +
				texture2D(tex0, uv * 125.0).b  * vec3(0.5, 0.6, 0.9);
	gl_FragColor = vec4(light * tex, 1.0);
}

</script>

