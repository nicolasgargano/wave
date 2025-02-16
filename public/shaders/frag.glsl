precision mediump float;

uniform vec2 u_resolution;
uniform int u_frame;
uniform float u_time;

uniform sampler2D u_text_layer;
uniform sampler2D u_original_screen_texture;

float density = 1.3;
float opacityScanline = 0.3;
float opacityNoise = .2;
float flickering = 0.03;


float random (vec2 st) {
    return fract(sin(dot(st.xy,
    vec2(12.9898,78.233)))*
    43758.5453123);
}

vec4 vignette(vec2 uv, vec4 at) {
	  float dx = 1.3 * abs(uv.x - .5);
	  float dy = 1.3 * abs(uv.y - .5);
    return at * (1.0 - dx * dx - dy * dy);
}

vec4 gamma(vec4 x, float f)
{
    return pow(x, vec4(1./f));
}

void main() {
    // position of the pixel divided by resolution, to get normalized positions on the canvas
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    // mirror
    st.x = 1.0 - st.x;
    // st.y = 1.0 - st.y;

    // screen scanline
    float scanline = sin(st.y*3.1415*220.0)*.5+.5;
    scanline = sqrt(scanline);

    // Glitch uv
    float glitch = sin(18.245*u_time)*cos(11.323*u_time)*sin(4.313*u_time);
    glitch *= glitch;
    st.x += sin(st.y*19.1)*glitch*.01;
    st.x += sin(st.y*459.1)*glitch*glitch*.02;

    vec3 color = texture2D(u_text_layer, st).rgb;
    color += color * scanline * opacityScanline;
    color += color * vec3(random(st*u_time)) * opacityNoise;
    color += color * sin(110.0*u_time) * flickering;

    vec4 colorA = vignette(st, vec4(color, 1.0));
    colorA = gamma(colorA, 1.5);

    gl_FragColor = colorA; // R,G,B,A
}

// Glitch from https://www.shadertoy.com/view/4sfSz7
// Scanlines from https://www.shadertoy.com/view/3dBSRD
