import {
  AdditiveBlending,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  Scene,
  Shape,
  ShaderMaterial,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function roundedRectangle(path: Shape | Path, width: number, height: number, radius: number) {
  const x = -width * 0.5
  const y = -height * 0.5
  path.moveTo(x + radius, y)
  path.lineTo(x + width - radius, y)
  path.quadraticCurveTo(x + width, y, x + width, y + radius)
  path.lineTo(x + width, y + height - radius)
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  path.lineTo(x + radius, y + height)
  path.quadraticCurveTo(x, y + height, x, y + height - radius)
  path.lineTo(x, y + radius)
  path.quadraticCurveTo(x, y, x + radius, y)
}

function createCrystalFrameGeometry() {
  const frame = new Shape()
  roundedRectangle(frame, 1.12, 0.92, 0.17)
  const aperture = new Path()
  roundedRectangle(aperture, 0.62, 0.62, 0.09)
  frame.holes.push(aperture)

  const geometry = new ExtrudeGeometry(frame, {
    depth: 0.46,
    curveSegments: 8,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.11,
    bevelThickness: 0.11,
  })
  geometry.translate(0, 0, -0.23)
  return geometry
}

export function createPrismAssembly(): Group {
  const assembly = new Group()
  assembly.name = 'physical-prism'

  const shellGeometry = createCrystalFrameGeometry()
  const shellMaterial = new MeshPhysicalMaterial({
    color: new Color(0xc8d8df),
    roughness: 0.075,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.2,
    ior: 1.52,
    dispersion: 0.9,
    attenuationColor: new Color(0xffffff),
    attenuationDistance: 100,
    emissive: new Color(0x26343a),
    emissiveIntensity: 0.95,
    clearcoat: 1,
    clearcoatRoughness: 0.09,
    flatShading: true,
    iridescence: 0.52,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [160, 460],
    envMapIntensity: 1.45,
    transparent: false,
  })
  const shell = new Mesh(shellGeometry, shellMaterial)
  shell.name = 'glass-shell'
  shell.castShadow = false
  shell.receiveShadow = false

  const coreGeometry = new RoundedBoxGeometry(0.62, 0.62, 0.3, 6, 0.1)
  const coreMaterial = new MeshStandardMaterial({
    color: new Color(0x030506),
    roughness: 0.26,
    metalness: 0.16,
    emissive: new Color(0x010202),
    emissiveIntensity: 0.45,
    envMapIntensity: 0.7,
    transparent: false,
  })
  const core = new Mesh(coreGeometry, coreMaterial)
  core.name = 'dark-core'
  core.position.set(-0.045, -0.012, 0.27)
  core.scale.setScalar(0.96)

  const overlayMaterial = new ShaderMaterial({
    uniforms: {
      uCrystalFill: { value: 0.045 },
      uCausticStrength: { value: 0.18 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    vertexShader: `
      varying vec3 vObjectNormal;
      varying vec3 vObjectPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vObjectNormal = normalize(normal);
        vObjectPosition = position;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec3 vObjectNormal;
      varying vec3 vObjectPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewDirection;
      uniform float uCrystalFill;
      uniform float uCausticStrength;

      void main() {
        vec3 objectNormal = abs(normalize(vObjectNormal));
        vec3 worldNormal = normalize(vWorldNormal);
        float normalPeak = max(objectNormal.x, max(objectNormal.y, objectNormal.z));
        float bevel = smoothstep(0.025, 0.24, 1.0 - normalPeak);
        float fresnel = pow(1.0 - abs(dot(worldNormal, normalize(vViewDirection))), 2.4);
        float edgeMask = max(bevel, fresnel);
        float rayA = 1.0 - smoothstep(0.014, 0.052, abs(vObjectPosition.y - vObjectPosition.x * 0.62 - 0.04));
        float rayB = 1.0 - smoothstep(0.012, 0.046, abs(vObjectPosition.y + vObjectPosition.x * 0.88 + 0.13));
        float rayC = 1.0 - smoothstep(0.01, 0.038, abs(vObjectPosition.x + vObjectPosition.z * 0.72 - 0.18));
        float caustic = max(rayA, max(rayB, rayC * 0.72)) * uCausticStrength * (0.38 + edgeMask * 0.86);
        float coolKey = pow(max(dot(worldNormal, normalize(vec3(-0.55, 0.72, 0.42))), 0.0), 22.0) * edgeMask;
        float warmKey = pow(max(dot(worldNormal, normalize(vec3(0.72, -0.28, 0.54))), 0.0), 28.0) * edgeMask;
        vec3 spectral = vec3(
          0.25 + 0.75 * smoothstep(-0.2, 0.7, worldNormal.x),
          0.42 + 0.58 * smoothstep(-0.65, 0.5, worldNormal.y),
          0.3 + 0.7 * smoothstep(-0.2, 0.7, -worldNormal.x)
        );
        vec3 color = vec3(0.52, 0.82, 0.88) * (bevel * 0.18 + fresnel * 0.16);
        float faceLight = 0.58 + 0.42 * smoothstep(-0.2, 0.95, worldNormal.y + worldNormal.z * 0.65);
        color += mix(vec3(0.48, 0.72, 0.9), vec3(0.98, 1.0, 0.96), faceLight) * uCrystalFill;
        color += spectral * bevel * fresnel * 0.22;
        color += mix(spectral.bgr, vec3(1.0, 0.92, 0.68), rayB) * caustic * 1.35;
        color += vec3(0.9, 0.99, 1.0) * coolKey * 0.32;
        color += vec3(1.0, 0.31, 0.06) * warmKey * 0.22;
        float alpha = clamp(0.04 + bevel * 0.16 + fresnel * 0.16 + coolKey * 0.14 + warmKey * 0.1 + caustic * 0.32, 0.0, 0.48);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
  const overlay = new Mesh(shellGeometry.clone(), overlayMaterial)
  overlay.name = 'facet-overlay'
  overlay.scale.setScalar(1.006)
  overlay.renderOrder = 3

  assembly.add(core, shell, overlay)
  return assembly
}

export function disposePrismAssembly(assembly: Group) {
  assembly.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose())
      return
    }
    object.material.dispose()
  })
}

export function createPrismEnvironmentScene(): Scene {
  const environment = new Scene()
  environment.background = new Color(0x000000)

  const addPanel = (
    name: string,
    color: number,
    position: readonly [number, number, number],
    scale: readonly [number, number],
  ) => {
    const panel = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ color, side: DoubleSide, toneMapped: false }),
    )
    panel.name = name
    panel.position.set(...position)
    panel.scale.set(scale[0], scale[1], 1)
    panel.lookAt(0, 0, 0)
    environment.add(panel)
  }

  addPanel('cool-strip', 0xdffcff, [-3.8, 4.5, 4.8], [4.0, 1.05])
  addPanel('white-strip', 0xffffff, [4.2, 1.4, 3.6], [3.2, 0.82])
  addPanel('warm-strip', 0xff8b46, [1.2, -4.1, 2.7], [2.0, 0.52])
  return environment
}

export function disposePrismEnvironmentScene(environment: Scene) {
  environment.traverse((object) => {
    if (!(object instanceof Mesh)) return
    object.geometry.dispose()
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose())
      return
    }
    object.material.dispose()
  })
}
