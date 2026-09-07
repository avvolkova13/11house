export const GRID_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  float gridLine(float coordinate, float spacing, float start, float end) {
    float distanceToLine = abs(fract((coordinate + 0.5) / spacing + 0.5) - 0.5) * spacing;
    return 1.0 - smoothstep(start, end, distanceToLine);
  }

  void main() {
    vec2 p = vUv - 0.5;
    float minorX = gridLine(p.x, 0.026, 0.00042, 0.00112);
    float minorY = gridLine(p.y, 0.026, 0.00042, 0.00112);
    float majorX = gridLine(p.x, 0.13, 0.00065, 0.00145);
    float majorY = gridLine(p.y, 0.13, 0.00065, 0.00145);
    float grid = max(max(minorX, minorY) * 0.022, max(majorX, majorY) * 0.042);
    vec3 color = vec3(0.0045, 0.0055, 0.0058) + vec3(grid);
    gl_FragColor = vec4(color, 1.0);
  }
`
