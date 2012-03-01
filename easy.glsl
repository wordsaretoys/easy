<script id="vs-cave" type="x-shader/x-vertex">

/**
	cave vertex shader
	O' = P * M * V * O transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates
	@param light	light intensity
	@param object	position in object coordinates
	
**/

attribute vec3 position;
attribute vec2 texturec;

uniform mat4 projector;
uniform mat4 modelview;

varying vec2 uv;
varying vec4 object;

void main(void) {
	object = vec4(position, 1.0);
	gl_Position = projector * modelview * object;
	uv = texturec;
	
}
</script>

<script id="fs-cave" type="x-shader/x-fragment">

/**
	cave fragment shader
	
	@param rock 	a rock texture
	@param color0 	color in RGB format 
	@param color1 	color in RGB format 
	@param color2 	color in RGB format 

	@param uv		texture coordinates of fragment
	@param object	position in object coordinates
	
**/

precision mediump float;
 
uniform sampler2D rock;
uniform vec3 color0;
uniform vec3 color1;
uniform vec3 color2;

varying vec2 uv;
varying vec4 object;

void main(void) {

	float hl = (4.5 - abs(object.y)) / 4.5;
	float ll = 1.0 - pow(abs(32.0 - object.z) / 32.0, 2.0);
//	float ll = 1.0;
	vec3 rocktex = 	texture2D(rock, uv * 0.005).r * color0 +
					texture2D(rock, uv * 0.05).r * color1 +
					texture2D(rock, uv * 0.5).r  * color2;
	gl_FragColor = vec4(ll * hl * rocktex, 1.0);
}

</script>

<script id="vs-paddler" type="x-shader/x-vertex">

/**
	paddler vertex shader
	O' = P * V * (M * O + c) transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	@param rotations rotations matrix
	@param center model center vector
	@param time time base for vertex animations
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates of fragment
	@param object	fragment position in object space
	
**/

attribute vec3 position;
attribute vec2 texturec;

uniform mat4 projector;
uniform mat4 modelview;
uniform mat4 rotations;
uniform vec3 center;
uniform float time;

varying vec2 uv;
varying vec3 object;

void main(void) {
	// create paddling motions
	vec3 pos = position;
	pos.y += 25.0 * pow(0.5 * abs(pos.x), 4.0) * sin(time);
	pos.z += 25.0 * pow(0.5 * abs(pos.x), 4.0) * cos(time);
	
	// transform the vertex
	vec4 rotpos = rotations * vec4(pos, 1.0) + vec4(center, 0.0);
	vec4 mvpos = modelview * rotpos;
	gl_Position = projector * mvpos;
	uv = texturec;
	object = position;
}

</script>

<script id="fs-paddler" type="x-shader/x-fragment">

/**
	paddler fragment shader
	
	@param face		standard face texture
	@param skin		specific skin texture
	@param light	light value for entire body

	@param uv		texture coordinates of fragment
	@param object	fragment position in object space
	
**/

precision mediump float;

uniform sampler2D face;
uniform sampler2D skin;

varying vec2 uv;
varying vec3 object;

void main(void) {
	vec4 skinColor = texture2D(skin, uv);
	vec4 faceColor = texture2D(face, uv);
	// apply face to top half only
	if (object.y >= 0.0) {
		skinColor.rgb = mix(skinColor.rgb, faceColor.rgb, faceColor.a);
	}
	gl_FragColor = vec4(skinColor.rgb, 1.0);
}

</script>

