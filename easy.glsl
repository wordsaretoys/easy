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
	@param torch	1 to activate torch

	@param uv		texture coordinates of fragment
	@param object	position in object coordinates
	@param relobj	position in modelview coordinates
	
**/

precision mediump float;
 
uniform sampler2D rock;
uniform vec3 color[3];
uniform int torch;

varying vec2 uv;
varying vec4 object;
varying vec4 relobj;

void main(void) {

	// makes the cave floor dark and the ceiling bright
	float hl = (object.y + 0.5) / 6.0;
	// makes the entrance and exit areas fade into darkness
	float ll = 1.0 - pow(clamp( abs(32.0 - object.z) / 32.0, 0.0, 1.0), 2.0);
	// creates a torch effect around the player
	// (in map display, don't want this effect)
	float fl = 1.0;
	if (torch == 1) {
		fl = clamp((32.0 - length(relobj)) / 32.0, 0.0, 1.0);
	}
	vec3 rocktex = 	texture2D(rock, uv * 0.005).r * color[0] +
					texture2D(rock, uv * 0.05).r * color[1] +
					texture2D(rock, uv * 0.5).r  * color[2];
	gl_FragColor = vec4(fl * ll * hl * rocktex, 1.0);
}

</script>

<script id="vs-item" type="x-shader/x-vertex">

/**
	item vertex shader
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
uniform mat4 rotations;
uniform vec3 center;

varying vec2 uv;

void main(void) {
	gl_Position = projector * modelview * (rotations * vec4(position, 1.0) + vec4(center, 0.0));
	uv = texturec;
}

</script>

<script id="fs-item" type="x-shader/x-fragment">

/**
	item fragment shader
	
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
	@param time		time reference for animation
	@param alpha	master alpha
	
	@param uv		texture coordinates of fragment
	
**/

precision mediump float;

uniform sampler2D noise;
uniform float alpha;
uniform float time;

varying vec2 uv;

void main(void) {

	// create three functions to scale the texture
	// and put them at staggered phases
	float t0 = mod(time, 999.0) / 999.0;
	float a0 = (1.0 - 2.0 * abs(0.5 - t0)) * texture2D(noise, uv * t0).r;

	float t1 = mod(time + 333.0, 999.0) / 999.0;
	float a1 = (1.0 - 2.0 * abs(0.5 - t1)) * texture2D(noise, uv * t1).r;

	float t2 = mod(time + 666.0, 999.0) / 999.0;
	float a2 = (1.0 - 2.0 * abs(0.5 - t2)) * texture2D(noise, uv * t2).r;
	
	// average the results to produce a continous scaling effect,
	// like a visual Shepard's tone
	float a = (a0 + a1 + a2);
	
	// create a "smoke ring" mask over the first effect
	float r = 2.0 * length(uv);
	a = a * (1.0 - r) * r;
	gl_FragColor = vec4(1.0, 1.0, 1.0, a * alpha);
}

</script>

<script id="vs-corpse" type="x-shader/x-vertex">

/**
	corpse vertex shader
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
uniform mat4 rotations;
uniform vec3 center;

varying vec2 uv;

void main(void) {
	gl_Position = projector * modelview * (rotations * vec4(position, 1.0) + vec4(center, 0.0));
	uv = texturec;
}

</script>

<script id="fs-corpse" type="x-shader/x-fragment">

/**
	corpse fragment shader
	
	@param body		body texture
	@param ash		ash texture
	@param burn		burn time

	@param uv		texture coordinates of fragment
	
**/

precision mediump float;

uniform sampler2D body;
uniform sampler2D ash;
uniform float burn;

varying vec2 uv;

void main(void) {
	vec4 bodyColor = texture2D(body, uv);
	vec2 st = 0.25 * (1.0 - burn) * vec2(uv.x - 0.5, uv.y - 0.5);
	vec4 fireColor = vec4(1.0, 0.8, 0.0, 1.0) * texture2D(ash, st);
	vec4 ashColor = texture2D(ash, uv);
	
	gl_FragColor = mix(bodyColor, mix(ashColor, fireColor, sin(burn * 3.1415)), burn);
}

</script>

