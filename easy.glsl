<script id="fs-cave-texture" type="x-shader/x-fragment">

precision mediump float;

vec3 caveTexture(sampler2D noise, vec2 uv) {
	return 	texture2D(noise, uv * 0.005).r * vec3(0.3, 0.4, 0.2) +
			texture2D(noise, uv * 0.05).g * vec3(0.7, 0.6, 0.3) +
			texture2D(noise, uv * 0.5).b  * vec3(0.1, 0.6, 0.9);
}

</script>
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
	
	@param rock a rock texture

	@param uv		texture coordinates of fragment
	@param object	position in object coordinates
	
**/

precision mediump float;
 
uniform sampler2D rock;

varying vec2 uv;
varying vec4 object;

void main(void) {

	float hl;
	hl = 0.1 + (4.0 - abs(object.y)) / 4.0;
	
	float ll;
	ll = 1.0 - pow((32.0 - object.z) / 32.0, 2.0);

	vec3 rocktex = caveTexture(rock, uv);
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
	@param alpha	fade-in alpha value
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

varying float alpha;
varying vec2 uv;
varying vec3 object;

void main(void) {
	// create wing-flapping motions
	vec3 pos = position;
	pos.y += 25.0 * pow(0.4 * texturec.y, 4.0) * sin(time);
	pos.z += 25.0 * pow(0.4 * texturec.y, 4.0) * cos(time);
	
	// transform the vertex
	vec4 rotpos = rotations * vec4(pos, 1.0) + vec4(center, 0.0);
	vec4 mvpos = modelview * rotpos;
	gl_Position = projector * mvpos;
	uv = texturec;
	object = position;

	// calculate fade-in alpha value
	alpha = clamp((25.0 - length(mvpos)) / 5.0, 0.0, 1.0);
}
</script>

<script id="fs-paddler" type="x-shader/x-fragment">

/**
	paddler fragment shader
	
	@param face		standard face texture
	@param skin		specific skin texture
	@param light	light value for entire body

	@param alpha	fade-in alpha value
	@param uv		texture coordinates of fragment
	@param object	fragment position in object space
	
**/

precision mediump float;

uniform sampler2D face;
uniform sampler2D skin;
uniform float light;

varying float alpha;
varying vec2 uv;
varying vec3 object;

void main(void) {
	vec4 skinColor = texture2D(skin, uv);
	vec4 faceColor = texture2D(face, uv);
	// apply face to top half only
	if (object.y >= 0.0) {
		skinColor.rgb = mix(skinColor.rgb, faceColor.rgb, faceColor.a);
	}
	gl_FragColor = vec4(light * skinColor.rgb, alpha);
}

</script>

<script id="vs-bush" type="x-shader/x-vertex">

/**
	bush vertex shader
	O' = P * V * O transformation
	
	@param position vertex array of positions
	@param a_color	vertex array of color indicies
	
	@param projector projector matrix
	@param modelview modelview matrix
	
	(passed to fragment shader for each vertex)
	@param color	index into color palette
	
**/

attribute vec3 position;
attribute float a_color;

uniform mat4 projector;
uniform mat4 modelview;

varying float color;

void main(void) {
	gl_Position = projector * modelview * vec4(position, 1.0);
	color = a_color;
}
</script>

<script id="fs-bush" type="x-shader/x-fragment">

/**
	bush fragment shader
	
	@param palette	color palette

	@param color	index into color palette
	
**/

precision mediump float;

uniform sampler2D palette;

varying float color;

void main(void) {
	vec2 index = vec2(1.0, color);
	gl_FragColor = texture2D(palette, index);
}

</script>

<script id="vs-pile" type="x-shader/x-vertex">

/**
	pile vertex shader
	O' = P * V * (O + c) transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	@param center model center vector
	
	(passed to fragment shader for each vertex)
	@param alpha	fade-in alpha value
	@param uv		texture coordinates of fragment
	
**/

attribute vec3 position;
attribute vec2 texturec;

uniform mat4 projector;
uniform mat4 modelview;
uniform vec3 center;

varying float alpha;
varying vec2 uv;

void main(void) {
	// transform the vertex
	vec4 mvpos = modelview * vec4(position + center, 1.0);
	gl_Position = projector * mvpos;
	uv = texturec;

	// calculate fade-in alpha value
	alpha = clamp((25.0 - length(mvpos)) / 5.0, 0.0, 1.0);
}
</script>

<script id="fs-pile" type="x-shader/x-fragment">

/**
	bush fragment shader
	
	@param skin		specific skin texture

	@param alpha	fade-in alpha value
	@param uv		texture coordinates of fragment
	
**/

precision mediump float;

uniform sampler2D skin;

varying float alpha;
varying vec2 uv;

void main(void) {
	vec4 skinColor = texture2D(skin, uv);
	gl_FragColor = vec4(skinColor.rgb, alpha * skinColor.a);
}

</script>

