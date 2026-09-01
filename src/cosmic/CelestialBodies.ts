import * as THREE from 'three'
import { wrapDepth } from './motion'

const noiseFunctions = /* glsl */ `
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise31(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
      mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
      mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm31(vec3 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 5; i++) {
      value += noise31(p) * amplitude;
      p = p * 2.03 + vec3(17.1, 9.2, 13.7);
      amplitude *= 0.49;
    }
    return value;
  }

  float ridge31(vec3 p) {
    return 1.0 - abs(noise31(p) * 2.0 - 1.0);
  }
`

const planetVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uType;
  uniform float uRelief;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDirection;
  varying float vRelief;
  ${noiseFunctions}

  void main() {
    vec3 direction = normalize(position);
    vec3 samplePosition = direction * (2.8 + uSeed * 1.7) + uSeed * 11.0;
    float broad = fbm31(samplePosition);
    float ridges = pow(ridge31(samplePosition * 2.4), 3.4);
    float fine = noise31(samplePosition * 7.2);
    float craterMask = smoothstep(0.75, 0.91, noise31(samplePosition * 3.5 + 21.4));

    float displacement = (broad - 0.5) * 0.72 + ridges * 0.30 - craterMask * 0.46 + (fine - 0.5) * 0.08;
    if (uType > 0.5 && uType < 1.5) {
      displacement = (broad - 0.5) * 0.18 + sin(direction.y * 38.0 + broad * 8.0) * 0.035;
    } else if (uType > 1.5) {
      displacement = (broad - 0.5) * 0.36 + ridges * 0.16 - craterMask * 0.18;
    }

    vec3 transformed = position + direction * displacement * uRelief;
    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vPosition = direction;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    vRelief = displacement;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const planetFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uBaseColor;
  uniform vec3 uMidColor;
  uniform vec3 uLightColor;
  uniform vec3 uLightDirection;
  uniform float uTime;
  uniform float uSeed;
  uniform float uType;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDirection;
  varying float vRelief;
  ${noiseFunctions}

  void main() {
    vec3 p = normalize(vPosition);
    vec3 samplePosition = p * (3.1 + uSeed * 1.3) + uSeed * 13.0;
    float continental = fbm31(samplePosition);
    float erosion = fbm31(samplePosition * 3.6 + vec3(3.1, 7.4, 1.8));
    float micro = noise31(samplePosition * 15.0);
    float ridge = pow(ridge31(samplePosition * 5.2), 7.0);
    float crater = smoothstep(0.74, 0.90, noise31(samplePosition * 4.1 + 23.7));
    vec3 surface;
    float roughness;

    if (uType < 0.5) {
      float mineral = smoothstep(0.42, 0.78, continental + erosion * 0.24);
      surface = mix(uBaseColor * 0.46, uMidColor, mineral);
      surface *= 0.58 + micro * 0.42;
      surface = mix(surface, vec3(0.006, 0.008, 0.011), crater * 0.72);
      surface += uLightColor * ridge * ridge * (0.11 + smoothstep(0.45, 0.8, erosion) * 0.16);
      roughness = 0.72 + erosion * 0.22;
    } else if (uType < 1.5) {
      float latitude = p.y + (continental - 0.5) * 0.17;
      float turbulence = fbm31(samplePosition * 2.25 + vec3(2.0, uTime * 0.004, -3.0));
      float bands = sin(latitude * 42.0 + erosion * 8.0 + turbulence * 4.0) * 0.5 + 0.5;
      bands = smoothstep(0.16, 0.84, bands);
      float thinBands = sin(latitude * 104.0 - continental * 11.0 + turbulence * 3.0) * 0.5 + 0.5;
      float stormDistance = length(vec2((p.x - 0.31) * 1.0, (p.y - 0.20) * 3.0));
      float storm = smoothstep(0.27, 0.04, stormDistance) * (0.62 + sin(atan(p.y - 0.20, p.x - 0.31) * 7.0 + erosion * 7.0) * 0.38);
      surface = mix(uBaseColor, uMidColor, bands * 0.54 + thinBands * 0.09 + turbulence * 0.24);
      surface = mix(surface, uLightColor * 0.80, storm * 0.68);
      surface *= 0.68 + micro * 0.24;
      roughness = 0.86;
    } else {
      float frost = smoothstep(0.34, 0.79, continental + erosion * 0.28);
      float fissure = pow(ridge31(samplePosition * 6.8), 11.0);
      surface = mix(uBaseColor * 0.55, uMidColor, frost);
      surface += uLightColor * fissure * (0.24 + erosion * 0.34);
      surface *= 0.68 + micro * 0.30;
      roughness = 0.58 + erosion * 0.28;
    }

    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(uLightDirection);
    vec3 viewDirection = normalize(vViewDirection);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float wrappedLight = smoothstep(-0.24, 0.82, dot(normal, lightDirection));
    float specular = pow(max(dot(normal, halfDirection), 0.0), mix(54.0, 10.0, roughness)) * (1.0 - roughness);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.4);
    float shadowDetail = 0.105 + continental * 0.055;

    vec3 color = surface * (shadowDetail + wrappedLight * 0.92);
    color += uLightColor * specular * 0.52;
    color += uLightColor * fresnel * 0.16;
    color += uLightColor * max(vRelief, 0.0) * diffuse * 0.10;
    gl_FragColor = vec4(color, 1.0);
  }
`

const shellVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vDirection;
  varying vec3 vViewDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vDirection = normalize(position);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const atmosphereFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uLightDirection;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(normal, normalize(vViewDirection)), 0.0), 3.6);
    float lightWrap = smoothstep(-0.42, 0.68, dot(normal, normalize(uLightDirection)));
    float alpha = fresnel * uIntensity * (0.30 + lightWrap * 0.70);
    gl_FragColor = vec4(uColor * (0.48 + lightWrap * 0.92), alpha);
  }
`

const cloudFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uType;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vDirection;
  varying vec3 vViewDirection;
  ${noiseFunctions}
  void main() {
    vec3 p = normalize(vDirection);
    float speed = uType < 1.5 ? 0.018 : 0.007;
    float cloud = fbm31(p * (uType < 1.5 ? 6.0 : 4.3) + vec3(uTime * speed, uSeed * 9.0, 0.0));
    float wisps = noise31(p * 15.0 + vec3(-uTime * speed * 1.8, 4.0, uSeed));
    float mask = smoothstep(0.54, 0.76, cloud + wisps * 0.16);
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), 2.6);
    float alpha = mask * (0.10 + rim * 0.34);
    gl_FragColor = vec4(uColor * (0.64 + wisps * 0.42), alpha);
  }
`

const ringVertexShader = /* glsl */ `
  varying float vRadius;
  varying float vAngle;
  varying vec3 vWorldPosition;
  void main() {
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const ringFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uInner;
  uniform float uOuter;
  uniform float uTime;
  uniform vec3 uColor;
  varying float vRadius;
  varying float vAngle;
  varying vec3 vWorldPosition;
  void main() {
    float radial = (vRadius - uInner) / max(uOuter - uInner, 0.001);
    float bands = sin(radial * 184.0 + sin(radial * 37.0) * 2.4) * 0.5 + 0.5;
    float fine = sin(radial * 620.0 + vAngle * 3.0) * 0.5 + 0.5;
    float cassini = smoothstep(0.018, 0.045, abs(radial - 0.58));
    float edgeFade = smoothstep(0.0, 0.07, radial) * smoothstep(0.0, 0.10, 1.0 - radial);
    float angularDust = 0.72 + sin(vAngle * 19.0 + radial * 44.0 + uTime * 0.05) * 0.14;
    float alpha = (0.10 + bands * 0.36 + fine * 0.09) * cassini * edgeFade * angularDust;
    vec3 color = uColor * (0.48 + bands * 0.68 + fine * 0.12);
    gl_FragColor = vec4(color, alpha);
  }
`

type Body = {
  pivot: THREE.Group
  planet: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  atmosphere: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  clouds?: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  ring?: THREE.Mesh<THREE.RingGeometry, THREE.ShaderMaterial>
  base: THREE.Vector3
  depthFactor: number
  spin: number
}

type BodyConfig = {
  position: [number, number, number]
  radius: number
  base: number
  mid: number
  light: number
  seed: number
  type: 0 | 1 | 2
  relief: number
  depthFactor: number
  spin: number
  ring?: boolean
  clouds?: boolean
}

export class CelestialBodies {
  readonly group = new THREE.Group()
  private readonly bodies: Body[] = []

  constructor() {
    this.addBody({ position: [-20, -8.8, 4], radius: 10.8, base: 0x05070a, mid: 0x493729, light: 0xc38b4c, seed: 0.21, type: 0, relief: 0.62, depthFactor: 1, spin: 0.018 })
    this.addBody({ position: [25, 13, -58], radius: 4.4, base: 0x211a16, mid: 0x725a47, light: 0xd3aa73, seed: 0.67, type: 1, relief: 0.28, depthFactor: 0.58, spin: -0.012, ring: true, clouds: true })
    this.addBody({ position: [-9, 18, -116], radius: 4.8, base: 0x020814, mid: 0x275477, light: 0x73b6dc, seed: 0.91, type: 2, relief: 0.38, depthFactor: 0.3, spin: 0.008, clouds: true })
  }

  private addBody(config: BodyConfig) {
    const pivot = new THREE.Group()
    pivot.position.set(...config.position)
    const widthSegments = config.radius > 8 ? 160 : 112
    const heightSegments = config.radius > 8 ? 112 : 80
    const geometry = new THREE.SphereGeometry(config.radius, widthSegments, heightSegments)
    const lightDirection = new THREE.Vector3(-0.76, 0.30, 0.42).normalize()
    const material = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        uBaseColor: { value: new THREE.Color(config.base) },
        uMidColor: { value: new THREE.Color(config.mid) },
        uLightColor: { value: new THREE.Color(config.light) },
        uLightDirection: { value: lightDirection },
        uTime: { value: 0 },
        uSeed: { value: config.seed },
        uType: { value: config.type },
        uRelief: { value: config.relief },
      },
    })
    const planet = new THREE.Mesh(geometry, material)
    planet.rotation.z = 0.13 + config.seed * 0.22
    pivot.add(planet)

    const atmosphereGeometry = new THREE.SphereGeometry(config.radius * 1.045, 96, 64)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: shellVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(config.light) },
        uLightDirection: { value: lightDirection },
        uIntensity: { value: config.radius > 6 ? 0.42 : 0.68 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      toneMapped: false,
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    pivot.add(atmosphere)

    let clouds: Body['clouds']
    if (config.clouds) {
      const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.018, 112, 80)
      const cloudMaterial = new THREE.ShaderMaterial({
        vertexShader: shellVertexShader,
        fragmentShader: cloudFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: config.seed },
          uType: { value: config.type },
          uColor: { value: new THREE.Color(config.type === 1 ? 0xcbb79d : 0x8ac5dd) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      })
      clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
      pivot.add(clouds)
    }

    let ring: Body['ring']
    if (config.ring) {
      const inner = config.radius * 1.34
      const outer = config.radius * 2.28
      const ringGeometry = new THREE.RingGeometry(inner, outer, 256, 10)
      const ringMaterial = new THREE.ShaderMaterial({
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms: {
          uInner: { value: inner },
          uOuter: { value: outer },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x9f8061) },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI * 0.67
      ring.rotation.z = 0.38
      pivot.add(ring)
    }

    this.group.add(pivot)
    this.bodies.push({
      pivot,
      planet,
      atmosphere,
      clouds,
      ring,
      base: new THREE.Vector3(...config.position),
      depthFactor: config.depthFactor,
      spin: config.spin,
    })
  }

  update(elapsed: number, travel: number, pointerX: number, pointerY: number) {
    for (const body of this.bodies) {
      body.planet.material.uniforms.uTime.value = elapsed
      body.planet.rotation.y = elapsed * body.spin
      if (body.clouds) {
        body.clouds.material.uniforms.uTime.value = elapsed
        body.clouds.rotation.y = -elapsed * body.spin * 0.42
      }
      if (body.ring) body.ring.material.uniforms.uTime.value = elapsed
      body.pivot.position.x = body.base.x + pointerX * 2.7 * body.depthFactor
      body.pivot.position.y = body.base.y + pointerY * 1.45 * body.depthFactor
      body.pivot.position.z = wrapDepth(body.base.z + travel * 0.46, 13, -190)
    }
  }

  dispose() {
    for (const body of this.bodies) {
      body.planet.geometry.dispose()
      body.planet.material.dispose()
      body.atmosphere.geometry.dispose()
      body.atmosphere.material.dispose()
      body.clouds?.geometry.dispose()
      body.clouds?.material.dispose()
      body.ring?.geometry.dispose()
      body.ring?.material.dispose()
    }
  }
}
