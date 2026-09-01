import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

export class PostProcessing {
  private readonly composer: EffectComposer
  private readonly bloom: UnrealBloomPass

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.composer = new EffectComposer(renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.48, 0.78)
    this.bloom.threshold = 0.78
    this.bloom.radius = 0.48
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height)
  }

  setPixelRatio(pixelRatio: number) {
    this.composer.setPixelRatio(pixelRatio)
  }

  render(streak: number) {
    this.bloom.strength = 0.24 + streak * 0.42
    this.bloom.radius = 0.46 + streak * 0.10
    this.composer.render()
  }

  dispose() {
    this.composer.dispose()
  }
}
