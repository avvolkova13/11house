import * as THREE from 'three'
import { wrapDepth } from './motion'

const planetVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vPosition = position;
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const planetFragmentShader = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uLightColor;
  uniform vec3 uLightDirection;
  uniform float uTime;
  uniform float uSeed;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDirection;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    float light = max(dot(normal, normalize(uLightDirection)), -0.1);
    float terrain = noise(vPosition * 1.7 + uSeed * 9.0)
      + noise(vPosition * 4.2 - uTime * 0.015) * 0.34;
    float bands = sin(vPosition.y * 5.5 + terrain * 2.7 + uSeed * 5.0) * 0.5 + 0.5;
    vec3 surface = uBaseColor * (0.40 + terrain * 0.28 + bands * 0.12);
    float fresnel = pow(1.0 - max(dot(normal, normalize(vViewDirection)), 0.0), 3.2);
    vec3 color = surface * smoothstep(-0.08, 0.82, light);
    color += uLightColor * fresnel * 0.52;
    color += uLightColor * pow(max(light, 0.0), 7.0) * 0.18;
    gl_FragColor = vec4(color, 1.0);
  }
`

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), 3.3);
    gl_FragColor = vec4(uColor * (0.8 + fresnel), fresnel * uIntensity);
  }
`

type Body = {
  pivot: THREE.Group
  planet: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  atmosphere: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  ring?: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  base: THREE.Vector3
  depthFactor: number
  spin: number
}

export class CelestialBodies {
  readonly group = new THREE.Group()
  private readonly bodies: Body[] = []

  constructor() {
    this.addBody({ position: [-20, -8.8, 4], radius: 10.8, base: 0x07090d, light: 0xb98852, seed: 0.21, depthFactor: 1, spin: 0.026 })
    this.addBody({ position: [25, 13, -58], radius: 4.4, base: 0x17130f, light: 0xb88b53, seed: 0.67, depthFactor: 0.58, spin: -0.018, ring: true })
    this.addBody({ position: [-9, 18, -116], radius: 4.8, base: 0x050b15, light: 0x7198c7, seed: 0.91, depthFactor: 0.3, spin: 0.011 })
  }

  private addBody(config: {
    position: [number, number, number]
    radius: number
    base: number
    light: number
    seed: number
    depthFactor: number
    spin: number
    ring?: boolean
  }) {
    const pivot = new THREE.Group()
    pivot.position.set(...config.position)
    const geometry = new THREE.SphereGeometry(config.radius, 72, 48)
    const material = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        uBaseColor: { value: new THREE.Color(config.base) },
        uLightColor: { value: new THREE.Color(config.light) },
        uLightDirection: { value: new THREE.Vector3(-0.75, 0.28, 0.4).normalize() },
        uTime: { value: 0 },
        uSeed: { value: config.seed },
      },
    })
    const planet = new THREE.Mesh(geometry, material)
    planet.rotation.z = 0.13 + config.seed * 0.22
    pivot.add(planet)

    const atmosphereGeometry = new THREE.SphereGeometry(config.radius * 1.035, 64, 40)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(config.light) },
        uIntensity: { value: config.radius > 6 ? 0.42 : 0.62 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      toneMapped: false,
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    pivot.add(atmosphere)

    let ring: Body['ring'] = undefined
    if (config.ring) {
      const ringGeometry = new THREE.RingGeometry(config.radius * 1.32, config.radius * 2.05, 128)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x8f795c,
        transparent: true,
        opacity: 0.34,
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
      body.pivot.position.x = body.base.x + pointerX * 1.4 * body.depthFactor
      body.pivot.position.y = body.base.y + pointerY * 0.75 * body.depthFactor
      body.pivot.position.z = wrapDepth(body.base.z + travel * 0.46, 13, -190)
    }
  }

  dispose() {
    for (const body of this.bodies) {
      body.planet.geometry.dispose()
      body.planet.material.dispose()
      body.atmosphere.geometry.dispose()
      body.atmosphere.material.dispose()
      body.ring?.geometry.dispose()
      body.ring?.material.dispose()
    }
  }
}
