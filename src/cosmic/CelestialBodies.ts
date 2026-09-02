import * as THREE from 'three'
import { wrapDepthLoop } from './motion'

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
    float fresnel = pow(1.0 - max(dot(normal, normalize(vViewDirection)), 0.0), 4.2);
    float lightWrap = smoothstep(-0.48, 0.72, dot(normal, normalize(uLightDirection)));
    float alpha = fresnel * uIntensity * (0.18 + lightWrap * 0.82);
    gl_FragColor = vec4(uColor * (0.32 + lightWrap * 1.18), alpha);
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
    float speed = uType < 1.5 ? 0.012 : 0.004;
    float flow = p.y * (uType < 1.5 ? 21.0 : 5.0);
    float cloud = fbm31(p * (uType < 1.5 ? 6.5 : 4.8) + vec3(uTime * speed, uSeed * 9.0, flow * 0.08));
    float filament = noise31(p * 17.0 + vec3(-uTime * speed * 1.7, flow, uSeed));
    float mask = smoothstep(0.59, 0.78, cloud + filament * 0.14);
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0), 2.8);
    gl_FragColor = vec4(uColor * (0.56 + filament * 0.46), mask * (0.055 + rim * 0.22));
  }
`

const ringVertexShader = /* glsl */ `
  varying float vRadius;
  varying float vAngle;
  void main() {
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
  void main() {
    float radial = (vRadius - uInner) / max(uOuter - uInner, 0.001);
    float broad = sin(radial * 97.0 + sin(radial * 19.0) * 2.3) * 0.5 + 0.5;
    float grains = sin(radial * 710.0 + vAngle * 2.0) * 0.5 + 0.5;
    float cassini = smoothstep(0.026, 0.058, abs(radial - 0.58));
    float edge = smoothstep(0.0, 0.08, radial) * smoothstep(0.0, 0.12, 1.0 - radial);
    float dust = 0.84 + sin(vAngle * 13.0 + radial * 53.0 + uTime * 0.018) * 0.09;
    float alpha = (0.07 + broad * 0.30 + grains * 0.055) * cassini * edge * dust;
    gl_FragColor = vec4(uColor * (0.42 + broad * 0.72), alpha);
  }
`

type SurfaceKind = 'rocky' | 'gas' | 'ice'
type PhysicalPlanet = THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhysicalMaterial>
type ShaderSphere = THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>

type Body = {
  pivot: THREE.Group
  planet: PhysicalPlanet
  atmosphere: ShaderSphere
  clouds?: ShaderSphere
  ring?: THREE.Mesh<THREE.RingGeometry, THREE.ShaderMaterial>
  map: THREE.Texture
  bumpMap?: THREE.Texture
  base: THREE.Vector3
  depthFactor: number
  spin: number
}

type BodyConfig = {
  position: [number, number, number]
  radius: number
  seed: number
  kind: SurfaceKind
  atmosphere: number
  depthFactor: number
  spin: number
  ring?: boolean
  clouds?: boolean
}

const texturePaths: Record<SurfaceKind, string> = {
  rocky: '/assets/planets/rocky-albedo.png',
  gas: '/assets/planets/gas-albedo.png',
  ice: '/assets/planets/ice-albedo.png',
}

const surfaceSettings = {
  rocky: { roughness: 0.94, bump: 0.32, clearcoat: 0.01 },
  gas: { roughness: 0.73, bump: 0.055, clearcoat: 0.10 },
  ice: { roughness: 0.69, bump: 0.23, clearcoat: 0.24 },
} satisfies Record<SurfaceKind, { roughness: number; bump: number; clearcoat: number }>

export class CelestialBodies {
  readonly group = new THREE.Group()
  private readonly bodies: Body[] = []
  private readonly loader = new THREE.TextureLoader()
  private readonly anisotropy: number

  constructor(maxAnisotropy = 8) {
    this.anisotropy = Math.min(maxAnisotropy, 12)
    const ambient = new THREE.AmbientLight(0x31405a, 0.27)
    const key = new THREE.DirectionalLight(0xffd8ae, 3.25)
    key.position.set(-55, 31, 38)
    const coldFill = new THREE.DirectionalLight(0x567ca8, 0.34)
    coldFill.position.set(38, -18, -24)
    this.group.add(ambient, key, coldFill)

    this.addBody({ position: [-29, -8.5, -104], radius: 13.5, seed: 0.21, kind: 'rocky', atmosphere: 0xc68a55, depthFactor: 1, spin: 0.012 })
    this.addBody({ position: [25, 11.5, -405], radius: 8.8, seed: 0.67, kind: 'gas', atmosphere: 0xd7b37e, depthFactor: 0.72, spin: -0.009, ring: true, clouds: true })
    this.addBody({ position: [-18, 7, -708], radius: 8.1, seed: 0.91, kind: 'ice', atmosphere: 0x78b9df, depthFactor: 0.48, spin: 0.006, clouds: true })
  }

  private loadTexture(path: string, colorSpace: THREE.ColorSpace) {
    const texture = this.loader.load(path)
    texture.colorSpace = colorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.anisotropy = this.anisotropy
    return texture
  }

  private createGeometry(radius: number, kind: SurfaceKind, seed: number) {
    const geometry = new THREE.SphereGeometry(radius, radius > 10 ? 192 : 144, radius > 10 ? 128 : 104)
    if (kind === 'gas') return geometry
    const position = geometry.attributes.position as THREE.BufferAttribute
    const normal = new THREE.Vector3()
    const relief = kind === 'rocky' ? radius * 0.0105 : radius * 0.0048
    for (let index = 0; index < position.count; index += 1) {
      normal.fromBufferAttribute(position, index).normalize()
      const broad =
        Math.sin(normal.x * 8.7 + normal.y * 5.1 + seed * 17) * 0.46 +
        Math.sin(normal.z * 13.3 - normal.x * 6.4 + seed * 29) * 0.31 +
        Math.sin((normal.x + normal.y - normal.z) * 24 + seed * 11) * 0.16
      const scale = 1 + broad * relief / radius
      position.setXYZ(index, normal.x * radius * scale, normal.y * radius * scale, normal.z * radius * scale)
    }
    position.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
  }

  private addBody(config: BodyConfig) {
    const pivot = new THREE.Group()
    pivot.position.set(...config.position)
    const geometry = this.createGeometry(config.radius, config.kind, config.seed)
    const map = this.loadTexture(texturePaths[config.kind], THREE.SRGBColorSpace)
    const bumpMap = config.kind === 'gas' ? undefined : this.loadTexture(texturePaths[config.kind], THREE.NoColorSpace)
    const settings = surfaceSettings[config.kind]
    const material = new THREE.MeshPhysicalMaterial({
      map,
      ...(bumpMap ? { bumpMap, bumpScale: settings.bump } : {}),
      roughness: settings.roughness,
      metalness: 0,
      clearcoat: settings.clearcoat,
      clearcoatRoughness: config.kind === 'ice' ? 0.61 : 0.84,
      envMapIntensity: 0.14,
    })
    const planet = new THREE.Mesh(geometry, material)
    planet.rotation.z = 0.07 + config.seed * 0.20
    pivot.add(planet)

    const lightDirection = new THREE.Vector3(-0.76, 0.30, 0.42).normalize()
    const atmosphereGeometry = new THREE.SphereGeometry(config.radius * 1.055, 112, 80)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: shellVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(config.atmosphere) },
        uLightDirection: { value: lightDirection },
        uIntensity: { value: config.kind === 'rocky' ? 0.28 : 0.50 },
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
      const cloudGeometry = new THREE.SphereGeometry(config.radius * 1.021, 112, 80)
      const cloudMaterial = new THREE.ShaderMaterial({
        vertexShader: shellVertexShader,
        fragmentShader: cloudFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: config.seed },
          uType: { value: config.kind === 'gas' ? 1 : 2 },
          uColor: { value: new THREE.Color(config.kind === 'gas' ? 0xe3c7a2 : 0xa0d4e7) },
        },
        transparent: true,
        depthWrite: false,
      })
      clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
      pivot.add(clouds)
    }

    let ring: Body['ring']
    if (config.ring) {
      const inner = config.radius * 1.38
      const outer = config.radius * 2.48
      const ringGeometry = new THREE.RingGeometry(inner, outer, 320, 14)
      const ringMaterial = new THREE.ShaderMaterial({
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        uniforms: {
          uInner: { value: inner },
          uOuter: { value: outer },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0xa88a69) },
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI * 0.69
      ring.rotation.z = 0.31
      pivot.add(ring)
    }

    this.group.add(pivot)
    this.bodies.push({
      pivot,
      planet,
      atmosphere,
      clouds,
      ring,
      map,
      bumpMap,
      base: new THREE.Vector3(...config.position),
      depthFactor: config.depthFactor,
      spin: config.spin,
    })
  }

  update(elapsed: number, travel: number, pointerX: number, pointerY: number) {
    for (const body of this.bodies) {
      body.planet.rotation.y = elapsed * body.spin
      if (body.clouds) {
        body.clouds.material.uniforms.uTime.value = elapsed
        body.clouds.rotation.y = -elapsed * body.spin * 0.46
      }
      if (body.ring) body.ring.material.uniforms.uTime.value = elapsed
      body.pivot.position.x = body.base.x + pointerX * 0.82 * body.depthFactor
      body.pivot.position.y = body.base.y + pointerY * 0.46 * body.depthFactor
      body.pivot.position.z = wrapDepthLoop(body.base.z + travel * 0.72, 20, -890)
      body.pivot.visible = body.pivot.position.z > -265
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
      body.map.dispose()
      body.bumpMap?.dispose()
    }
  }
}
