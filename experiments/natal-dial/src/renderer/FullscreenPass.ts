import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  type IUniform,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from 'three'
import { FULLSCREEN_VERTEX_SHADER } from '../shaders/fullscreen'

export class FullscreenPass {
  readonly material: ShaderMaterial

  private readonly scene = new Scene()
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly geometry = new PlaneGeometry(2, 2)
  private readonly mesh: Mesh
  private disposed = false

  constructor(fragmentShader: string, uniforms: Record<string, IUniform>) {
    this.material = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      toneMapped: false,
    })
    this.mesh = new Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  render(renderer: WebGLRenderer, target: WebGLRenderTarget | null) {
    if (this.disposed) return
    renderer.setRenderTarget(target)
    renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.geometry.dispose()
    this.material.dispose()
  }
}
