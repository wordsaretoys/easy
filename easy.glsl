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
varying vec4 relobj;

void main(void) {
	object = vec4(position, 1.0);
	relobj = modelview * object;
	gl_Position = projector * relobj;
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
	@param relobj	position in modelview coordinates
	
**/

precision mediump float;
 
uniform sampler2D rock;
uniform vec3 color0;
uniform vec3 color1;
uniform vec3 color2;

varying vec2 uv;
varying vec4 object;
varying vec4 relobj;

void main(void) {

	float hl = (object.y + 0.5) / 6.0;
	float ll = 1.0 - pow(abs(32.0 - object.z) / 32.0, 2.0);
	float fl = 1.0;
	if (length(relobj) < 64.0) {
		fl = clamp((32.0 - length(relobj)) / 32.0, 0.0, 1.0);
	}
	vec3 rocktex = 	texture2D(rock, uv * 0.005).r * color0 +
					texture2D(rock, uv * 0.05).r * color1 +
					texture2D(rock, uv * 0.5).r  * color2;
	gl_FragColor = vec4(fl * ll * hl * rocktex, 1.0);
}

</script>

<script id="vs-trash" type="x-shader/x-vertex">

/**
	trash vertex shader
	O' = P * V * (O + c) transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	@param center model center vector
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates of fragment
	
**/

attribute vec3 position;
attribute vec2 texturec;

uniform mat4 projector;
uniform mat4 modelview;
uniform vec3 center;

varying vec2 uv;

void main(void) {
	gl_Position = projector * modelview * vec4(position + center, 1.0);
	uv = texturec;
}

</script>

<script id="fs-trash" type="x-shader/x-fragment">

/**
	trash fragment shader
	
	@param sign		sign texture

	@param uv		texture coordinates of fragment
	
**/

precision mediump float;

uniform sampler2D sign;

varying vec2 uv;

void main(void) {
	vec4 signColor = texture2D(sign, vec2(uv.x, 1.0 - uv.y));
	
	// generate a glow around the periphery
	vec2 obj = 2.0 * (uv - 0.5);
	float alpha = 0.1 - 0.1 * clamp( abs(length(obj) - 0.8) / 0.2, 0.0, 1.0);
	vec4 ringColor = vec4(1.0, 1.0, 1.0, alpha);
	
	gl_FragColor = signColor;
}

</script>

<script id="vs-ghost" type="x-shader/x-vertex">

/**
	ghost vertex shader
	O' = P * V * (M * O + c) transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	@param rotations rotations matrix
	@param center model center vector
	
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

varying vec2 uv;

void main(void) {
	// transform the vertex
	vec4 rotpos = rotations * vec4(position, 1.0) + vec4(center, 0.0);
	vec4 mvpos = modelview * rotpos;
	gl_Position = projector * mvpos;
	uv = texturec;
}

</script>

<script id="fs-ghost" type="x-shader/x-fragment">

/**
	trash fragment shader
	
	@param sign		sign texture

	@param uv		texture coordinates of fragment
	
**/

precision mediump float;

uniform sampler2D sign;

varying vec2 uv;

void main(void) {
	gl_FragColor = texture2D(sign, uv);
}

</script>

