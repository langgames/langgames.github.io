function drawShader() {
    const shader = `
    float maskCircle2R(vec2 p, vec2 c, float r1, float r2) {
        return float(abs(distance(p, c) - mix(r1, r2, .5)) < abs(r2 - r1) / 2.);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 uv = fragCoord/iResolution.xy;
        vec4 originalColor = texture(iChannel0, uv);
        vec2 aspect = vec2(iResolution.x / iResolution.y, 1.);
        uv *= aspect;

        float t = iTime * 0.1;
        float r1 = pow(mix(0.01, .38, sin(t)*.5+.5), 1.04);
        float r2 = mix(0.16, .45, sin(t+.2)*.5+.5);
        vec2 c = aspect / 2.;
        float f = maskCircle2R(uv, c, r1, r2);

        vec3 col = mix(vec3(.25), vec3(.4, .5, .9), f);

        float threshold = 0.1;
        float objectMask = step(threshold, max(max(originalColor.r, originalColor.g), originalColor.b));
        col = mix(col, originalColor.rgb, objectMask);

        fragColor = vec4(col, 1.0);
    }
    `
    glInitPostProcess(shader, true);
}