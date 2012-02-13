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
	@param object	position in object coordinates
	
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
	object = vec4(position, 1.0);
	gl_Position = projector * modelview * object;
	uv = texturec;
	light = a_light;
	
}
</script>

<script id="fs-cave-lower" type="x-shader/x-fragment">

/**
	cave floor fragment shader
	
	@param noise the rock noise texture
	@param leaf	 the leaf texture

	@param light	light intensity
	@param uv		texture coordinates of fragment
	@param object	position in object coordinates
	
**/

precision mediump float;
 
uniform sampler2D noise;
uniform sampler2D leaf;
uniform sampler2D dirt;

varying float light;
varying vec2 uv;
varying vec4 object;

void main(void) {
	vec3 rocktex = 	texture2D(noise, uv * 0.005).r * vec3(0.8, 0.4, 0.2) +
					texture2D(noise, uv * 0.05).g * vec3(0.3, 0.6, 0.3) +
					texture2D(noise, uv * 0.5).b  * vec3(0.5, 0.6, 0.9);
	vec3 leaftex = 	texture2D(leaf, uv * 0.5).rgb;
	vec3 dirttex = 	texture2D(dirt, uv).rgb;
	if (object.y > 0.1) {
		gl_FragColor = vec4(light * light * rocktex, 1.0);
	} else {
		float a1 = (0.1 - object.y) / 0.1;
		float a2 = 4.0 * a1 * (texture2D(noise, uv * 0.1).r - texture2D(noise, uv * 0.01).g);
		float a3 = clamp(a2 * a2, 0.0, 1.0);
		vec3 tex = mix(rocktex, leaftex, a3);
		gl_FragColor = vec4(light * light * tex, 1.0);
	}

}

</script>

<script id="fs-cave-upper" type="x-shader/x-fragment">

/**
	cave ceiling fragment shader
	
	@param noise	the rock noise texture

	@param light	light intensity
	@param uv		texture coordinates of fragment
	@param object	position in object coordinates
	
**/

precision mediump float;
 
uniform sampler2D noise;

varying float light;
varying vec2 uv;
varying vec4 object;

void main(void) {
	vec3 rocktex = 	texture2D(noise, uv * 0.005).r * vec3(0.8, 0.4, 0.2) +
					texture2D(noise, uv * 0.05).g * vec3(0.3, 0.6, 0.3) +
					texture2D(noise, uv * 0.5).b  * vec3(0.5, 0.6, 0.9);
	gl_FragColor = vec4(light * light * rocktex, 1.0);
}

</script>

<script id="vs-glider" type="x-shader/x-vertex">

/**
	glider vertex shader
	O' = P * V * (s * M * O + c) transformation, plus texture coordinates
	
	@param position vertex array of positions
	@param texturec vertex array of texture coordinates
	
	@param projector projector matrix
	@param modelview modelview matrix
	@param rotations rotations matrix
	@param center model center vector
	@param time time base for vertex animations
	
	(passed to fragment shader for each vertex)
	@param uv		texture coordinates
	
**/

attribute vec3 position;
attribute vec2 texturec;
attribute float a_light;

uniform mat4 projector;
uniform mat4 modelview;
uniform mat4 rotations;
uniform vec3 center;
uniform float time;

varying vec2 uv;
varying vec3 object;

void main(void) {
	// create wing-flapping motions
	vec3 pos = position;
	pos.y += 25.0 * pow(0.05 * texturec.y, 4.0) * sin(time);
	pos.z += 25.0 * pow(0.05 * texturec.y, 4.0) * cos(time);
	
	vec4 rotpos = rotations * vec4(pos, 1.0) + vec4(center, 0.0);
	gl_Position = projector * modelview * rotpos;
	uv = texturec;
	object = position;
}
</script>

<script id="fs-glider" type="x-shader/x-fragment">

/**
	glider fragment shader
	
	@param skin		the model skin texture

	@param uv		texture coordinates of fragment
	
**/

precision mediump float;
 
uniform sampler2D skin;

varying vec2 uv;
varying vec3 object;

void main(void) {
	vec3 color = texture2D(skin, uv).rgb;
	// lower half of glider should be slightly lighter
	if (object.y >= 0.0) {
		color = color * 0.75;
	}
	gl_FragColor = vec4(color, 1.0);
}

</script>

