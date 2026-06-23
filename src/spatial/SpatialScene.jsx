import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js'

const VIOLET = 0x7c3aed
const CYAN = 0x00d9ff
const RED = 0xff315b
const GOLD = 0xffd700
const textureCache = new Map()

function createMicroTexture(key, base = 132, contrast = 18) {
  if (textureCache.has(key)) return textureCache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(canvas.width, canvas.height)
  for (let index = 0; index < image.data.length; index += 4) {
    const grain = base + (Math.random() - 0.5) * contrast
    image.data[index] = grain
    image.data[index + 1] = grain
    image.data[index + 2] = grain
    image.data[index + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  textureCache.set(key, texture)
  return texture
}

function material(color, roughness = 0.62, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

function skinMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.66,
    metalness: 0,
    bumpMap: createMicroTexture('skin', 132, 22),
    bumpScale: 0.007,
  })
}

function fabricMaterial(color, roughness = 0.7) {
  const surface = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.08,
    bumpMap: createMicroTexture('fabric', 122, 34),
    bumpScale: 0.014,
  })
  surface.bumpMap.repeat.set(7, 7)
  return surface
}

function mesh(geometry, surface, position = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, surface)
  item.position.set(...position)
  item.castShadow = true
  item.receiveShadow = true
  return item
}

function createAorbTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 360
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, '#0b1220')
  gradient.addColorStop(0.5, '#101b30')
  gradient.addColorStop(1, '#090f19')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#ff315b'
  ctx.lineWidth = 13
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24)
  ctx.shadowColor = '#00d9ff'
  ctx.shadowBlur = 28
  ctx.fillStyle = '#d9f6ff'
  ctx.font = '900 190px Arial Black, Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('AORB.', canvas.width / 2, canvas.height / 2 + 5)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function addEuFlag(parent, x, y, z) {
  const group = new THREE.Group()
  const blue = material(0x062f76, 0.75)
  const flag = mesh(new THREE.PlaneGeometry(0.7, 0.47), blue, [0, 0.22, 0])
  const stars = new THREE.Group()
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2
    const star = mesh(new THREE.CircleGeometry(0.015, 8), material(GOLD, 0.45, 0.15), [Math.cos(angle) * 0.17, 0.22 + Math.sin(angle) * 0.13, 0.008])
    stars.add(star)
  }
  const pole = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.35, 8), material(0xa5a9b6, 0.25, 0.8), [-0.37, -0.18, 0])
  group.add(flag, stars, pole)
  group.position.set(x, y, z)
  parent.add(group)
}

function addChamber(scene, compact = false) {
  const chamber = new THREE.Group()
  const floorMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0b1019, roughness: 0.2, metalness: 0.62, clearcoat: 1, clearcoatRoughness: 0.16 })
  const floor = mesh(new THREE.CylinderGeometry(8.5, 8.5, 0.22, compact ? 40 : 72), floorMaterial, [0, -0.18, 0])
  chamber.add(floor)

  const ring = mesh(new THREE.TorusGeometry(7.5, 0.055, 8, 96), new THREE.MeshStandardMaterial({ color: VIOLET, emissive: VIOLET, emissiveIntensity: 2.2 }), [0, 0.02, 0])
  ring.rotation.x = Math.PI / 2
  chamber.add(ring)

  const wall = mesh(new THREE.CylinderGeometry(8.35, 8.35, 5.8, compact ? 40 : 72, 1, true, 0.25, Math.PI * 1.82), material(0x101823, 0.78, 0.2), [0, 2.65, 0])
  wall.material.side = THREE.BackSide
  wall.rotation.y = -0.1
  chamber.add(wall)

  const deskMat = material(0x20171a, 0.42, 0.28)
  const seatMat = material(0x182b3f, 0.72, 0.06)
  for (let row = 0; row < (compact ? 3 : 4); row += 1) {
    const radius = 3.8 + row * 0.85
    const count = compact ? 10 + row * 4 : 17 + row * 5
    for (let index = 0; index < count; index += 1) {
      const angle = -1.18 + (index / (count - 1)) * 2.36
      const x = Math.sin(angle) * radius
      const z = -Math.cos(angle) * radius + 0.6
      const desk = mesh(new THREE.BoxGeometry(0.46, 0.24, 0.34), deskMat, [x, 0.26 + row * 0.08, z])
      desk.rotation.y = angle
      const seat = mesh(new THREE.BoxGeometry(0.34, 0.4, 0.19), seatMat, [x - Math.sin(angle) * 0.3, 0.48 + row * 0.08, z + Math.cos(angle) * 0.3])
      seat.rotation.y = angle
      chamber.add(desk, seat)
    }
  }

  const screenFrame = mesh(new THREE.BoxGeometry(5.1, 2.05, 0.18), material(0x161821, 0.28, 0.68), [0, 3.7, -6.55])
  const screen = mesh(new THREE.PlaneGeometry(4.75, 1.72), new THREE.MeshBasicMaterial({ map: createAorbTexture() }), [0, 3.7, -6.44])
  chamber.add(screenFrame, screen)

  const flagCount = compact ? 3 : 7
  for (let index = 0; index < flagCount; index += 1) {
    addEuFlag(chamber, -(flagCount - 1) * 0.54 + index * 1.08, 1.5, -6.25)
  }

  const dais = mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.42, 40), material(0x211922, 0.38, 0.36), [0, 0.12, -2.4])
  chamber.add(dais)
  scene.add(chamber)
  return { ring, screenFrame, screen, dais }
}

function addTechnoRig(scene, compact = false) {
  const rig = new THREE.Group()
  const beams = []
  const pulseRings = []
  const equalizerBars = []
  const ceilingRings = []
  const colors = (compact ? [VIOLET, CYAN, RED, VIOLET] : [VIOLET, CYAN, RED, VIOLET, CYAN, RED])

  colors.forEach((color, index) => {
    const angle = (index / colors.length) * Math.PI * 2
    const beamMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const beam = mesh(new THREE.ConeGeometry(0.22, 6.8, 16, 1, true), beamMaterial, [Math.cos(angle) * 4.5, 3.3, Math.sin(angle) * 4.5 - 1.2])
    beam.rotation.z = Math.sin(angle) * 0.11
    beam.rotation.x = Math.cos(angle) * 0.11
    beams.push(beam)
    rig.add(beam)
  })

  ;(compact ? [1.55, 2.5, 4.15] : [1.55, 2.25, 3.1, 4.15, 5.35]).forEach((radius, index) => {
    const color = index % 2 ? CYAN : VIOLET
    const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
    const floorRing = mesh(new THREE.TorusGeometry(radius, 0.018, 6, 96), ringMaterial, [0, 0.015 + index * 0.002, -0.6])
    floorRing.rotation.x = Math.PI / 2
    pulseRings.push(floorRing)
    rig.add(floorRing)
  })

  const barCount = compact ? 14 : 28
  for (let index = 0; index < barCount; index += 1) {
    const ratio = index / (barCount - 1)
    const color = new THREE.Color().setHSL(0.52 + ratio * 0.24, 0.9, 0.56)
    const barMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.1, roughness: 0.24, metalness: 0.32 })
    const bar = mesh(new THREE.BoxGeometry(0.085, 1, 0.09), barMaterial, [-2.75 + ratio * 5.5, 1.04, -5.82])
    bar.scale.y = 0.12
    equalizerBars.push(bar)
    rig.add(bar)
  }

  ;(compact ? [2.5, 4.1] : [2.5, 4.1, 6.1]).forEach((radius, index) => {
    const color = index === 1 ? RED : index === 2 ? CYAN : VIOLET
    const haloMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false })
    const halo = mesh(new THREE.TorusGeometry(radius, 0.026 + index * 0.008, 8, 120), haloMaterial, [0, 5.45 + index * 0.22, -1.05])
    halo.rotation.x = Math.PI / 2
    halo.rotation.z = index * 0.18
    ceilingRings.push(halo)
    rig.add(halo)
  })

  const scannerMaterial = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
  const scannerRing = mesh(new THREE.TorusGeometry(3.2, 0.022, 6, 120), scannerMaterial, [0, 0.3, -0.55])
  scannerRing.rotation.x = Math.PI / 2
  rig.add(scannerRing)

  const starHalo = new THREE.Group()
  const starMaterial = new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 2.4, roughness: 0.3, metalness: 0.45 })
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2
    const star = mesh(new THREE.OctahedronGeometry(0.055, 0), starMaterial, [Math.cos(angle) * 0.54, Math.sin(angle) * 0.54, 0])
    star.scale.set(0.72, 1.35, 0.28)
    star.rotation.z = angle
    starHalo.add(star)
  }
  starHalo.position.set(0, 2.12, -5.76)
  rig.add(starHalo)

  scene.add(rig)
  return { rig, beams, pulseRings, equalizerBars, ceilingRings, scannerRing, starHalo }
}

function addDigitalArchitecture(scene, compact = false) {
  const architecture = new THREE.Group()
  const nodeCount = compact ? 32 : 64
  const nodes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.23, 0.055, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x80e9ff, emissive: CYAN, emissiveIntensity: 1.4, roughness: 0.32, metalness: 0.62 }),
    nodeCount,
  )
  const transform = new THREE.Object3D()
  for (let index = 0; index < nodeCount; index += 1) {
    const band = Math.floor(index / 16)
    const slot = index % 16
    const angle = -1.2 + (slot / 15) * 2.4
    const radius = 6.65 + band * 0.22
    transform.position.set(Math.sin(angle) * radius, 1.15 + band * 0.34, -Math.cos(angle) * radius + 0.6)
    transform.rotation.set(-0.06, angle, 0)
    transform.scale.set(0.72 + ((slot + band) % 4) * 0.13, 1, 1)
    transform.updateMatrix()
    nodes.setMatrixAt(index, transform.matrix)
    nodes.setColorAt(index, new THREE.Color((index + band) % 5 === 0 ? VIOLET : CYAN))
  }
  nodes.instanceMatrix.needsUpdate = true
  if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true
  nodes.castShadow = false
  architecture.add(nodes)

  const portalMaterial = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
  const portals = []
  ;(compact ? [3.15, 3.85] : [3.15, 3.65, 4.15]).forEach((radius, index) => {
    const portal = mesh(new THREE.TorusGeometry(radius, 0.018 + index * 0.007, 6, 128, Math.PI), portalMaterial.clone(), [0, 0.15, -6.16])
    portal.rotation.z = Math.PI / 2
    portals.push(portal)
    architecture.add(portal)
  })

  const horizon = mesh(
    new THREE.PlaneGeometry(11, 0.035),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }),
    [0, 2.75, -6.28],
  )
  architecture.add(horizon)
  scene.add(architecture)
  return { architecture, nodes, portals, horizon }
}

function addReactiveStage(scene, compact = false) {
  const stage = new THREE.Group()
  const grid = new THREE.GridHelper(16, compact ? 28 : 48, CYAN, VIOLET)
  grid.position.y = -0.045
  grid.position.z = -0.6
  grid.material.transparent = true
  grid.material.opacity = 0.075
  grid.material.blending = THREE.AdditiveBlending
  grid.material.depthWrite = false
  stage.add(grid)

  const shockwaves = []
  for (let index = 0; index < (compact ? 3 : 5); index += 1) {
    const color = index % 2 ? CYAN : VIOLET
    const surface = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const wave = mesh(new THREE.TorusGeometry(1, 0.028, 6, 112), surface, [0, 0.035 + index * 0.002, -0.55])
    wave.rotation.x = Math.PI / 2
    wave.scale.setScalar(0.25)
    wave.userData.life = -1
    shockwaves.push(wave)
    stage.add(wave)
  }

  const hologramMaterial = new (compact ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial)({
    color: VIOLET,
    emissive: VIOLET,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.11,
    roughness: 0.08,
    metalness: 0.2,
    ...(compact ? {} : { transmission: 0.35 }),
    depthWrite: false,
  })
  const hologram = mesh(new THREE.CylinderGeometry(0.82, 1.12, 1.9, 48, 1, true), hologramMaterial, [0, 1.02, -2.4])
  stage.add(hologram)

  const orbiters = new THREE.Group()
  const orbiterCount = compact ? 10 : 18
  for (let index = 0; index < orbiterCount; index += 1) {
    const angle = (index / orbiterCount) * Math.PI * 2
    const shard = mesh(
      new THREE.OctahedronGeometry(0.025 + (index % 3) * 0.007, 0),
      new THREE.MeshBasicMaterial({ color: index % 4 === 0 ? GOLD : CYAN, transparent: true, opacity: 0.7 }),
      [Math.cos(angle) * (1.04 + (index % 2) * 0.12), 0.35 + (index % 6) * 0.24, -2.4 + Math.sin(angle) * (1.04 + (index % 2) * 0.12)],
    )
    shard.userData.baseY = shard.position.y
    orbiters.add(shard)
  }
  stage.add(orbiters)
  scene.add(stage)
  return { stage, grid, shockwaves, hologram, orbiters }
}

function cylinderBetween(start, end, radius, surface, segments = 18) {
  const from = new THREE.Vector3(...start)
  const to = new THREE.Vector3(...end)
  const direction = to.clone().sub(from)
  const limb = mesh(new THREE.CylinderGeometry(radius, radius * 1.04, direction.length(), segments), surface)
  limb.position.copy(from.clone().add(to).multiplyScalar(0.5))
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
  return limb
}

function addEye(parent, x, y, z) {
  const white = mesh(new THREE.SphereGeometry(0.034, 22, 14), material(0xeeeae2, 0.48), [x, y, z])
  white.scale.set(1.16, 0.52, 0.34)
  const iris = mesh(new THREE.SphereGeometry(0.014, 16, 10), material(0x70899a, 0.34), [x, y, z + 0.029])
  const pupil = mesh(new THREE.SphereGeometry(0.0065, 12, 8), material(0x080b0d, 0.24), [x, y, z + 0.04])
  const glint = mesh(new THREE.SphereGeometry(0.0024, 8, 6), material(0xffffff, 0.1), [x - 0.004, y + 0.005, z + 0.046])
  parent.add(white, iris, pupil, glint)
}

function addFaceDetails(group, skin, y, options = {}) {
  const leftEar = mesh(new THREE.SphereGeometry(0.07, 18, 12), skin, [-0.31, y + 0.02, 0.05])
  const rightEar = mesh(new THREE.SphereGeometry(0.07, 18, 12), skin, [0.31, y + 0.02, 0.05])
  leftEar.scale.set(0.55, 1, 0.45)
  rightEar.scale.copy(leftEar.scale)
  const mouth = mesh(new THREE.CapsuleGeometry(0.008, 0.105, 3, 12), material(options.lipColor || 0x713a3d, 0.68), [0, y - 0.16, 0.36])
  mouth.rotation.z = Math.PI / 2
  const chin = mesh(new THREE.SphereGeometry(0.085, 22, 14), skin, [0, y - 0.235, 0.285])
  chin.scale.set(1.18, 0.48, 0.48)
  const cheekLeft = mesh(new THREE.SphereGeometry(0.085, 20, 12), skin, [-0.19, y - 0.045, 0.29])
  const cheekRight = mesh(new THREE.SphereGeometry(0.085, 20, 12), skin, [0.19, y - 0.045, 0.29])
  cheekLeft.scale.set(1.1, 0.68, 0.38)
  cheekRight.scale.copy(cheekLeft.scale)
  group.add(leftEar, rightEar, mouth, chin, cheekLeft, cheekRight)
  if (options.brows) {
    ;[-0.105, 0.105].forEach((x, index) => {
      const brow = mesh(new THREE.CapsuleGeometry(0.007, 0.075, 3, 10), material(options.browColor || 0x7b6445, 0.8), [x, y + 0.115, 0.355])
      brow.rotation.z = Math.PI / 2 + (index ? -0.1 : 0.1)
      group.add(brow)
    })
  }
}

function createRebel() {
  const group = new THREE.Group()
  const purple = fabricMaterial(0x35135f, 0.64)
  const purpleDark = fabricMaterial(0x160d25, 0.52)
  const black = material(0x07090d, 0.3, 0.62)
  const skin = skinMaterial(0xb97d60)
  const glow = new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 3.2, roughness: 0.25 })

  const torso = mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.18, 32), purple, [0, 1.55, 0])
  torso.scale.z = 0.68
  const shoulders = mesh(new THREE.CapsuleGeometry(0.22, 0.78, 6, 20), purple, [0, 2.02, 0])
  shoulders.rotation.z = Math.PI / 2
  shoulders.scale.z = 0.66
  const neck = mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.24, 20), skin, [0, 2.27, 0.03])
  const yoke = mesh(new THREE.BoxGeometry(1.02, 0.3, 0.5), purpleDark, [0, 2.03, 0.04])
  yoke.rotation.x = -0.08
  group.add(torso, shoulders, neck, yoke)

  const shoulderPanelLeft = mesh(new THREE.BoxGeometry(0.42, 0.055, 0.48), purpleDark, [-0.39, 2.08, 0.02])
  const shoulderPanelRight = mesh(new THREE.BoxGeometry(0.42, 0.055, 0.48), purpleDark, [0.39, 2.08, 0.02])
  shoulderPanelLeft.rotation.z = -0.08
  shoulderPanelRight.rotation.z = 0.08
  group.add(shoulderPanelLeft, shoulderPanelRight)

  const head = mesh(new THREE.SphereGeometry(0.34, 48, 32), skin, [0, 2.62, 0.08])
  head.scale.set(0.86, 1.08, 0.9)
  const jaw = mesh(new THREE.SphereGeometry(0.27, 32, 20), skin, [0, 2.5, 0.11])
  jaw.scale.set(0.92, 0.72, 0.9)
  const nose = mesh(new THREE.ConeGeometry(0.055, 0.17, 18), skin, [0, 2.61, 0.39])
  nose.rotation.x = Math.PI / 2
  group.add(head, jaw, nose)
  addFaceDetails(group, skin, 2.6)

  const goggleFrame = material(0x030405, 0.2, 0.86)
  ;[-0.125, 0.125].forEach((x) => {
    const rim = mesh(new THREE.TorusGeometry(0.1, 0.028, 12, 32), goggleFrame, [x, 2.69, 0.39])
    const lens = mesh(new THREE.CircleGeometry(0.085, 32), new THREE.MeshPhysicalMaterial({ color: 0x030207, metalness: 0.45, roughness: 0.06, clearcoat: 1, emissive: 0x1b0634, emissiveIntensity: 0.42 }), [x, 2.69, 0.405])
    group.add(rim, lens)
  })
  const bridge = mesh(new THREE.BoxGeometry(0.08, 0.025, 0.03), goggleFrame, [0, 2.69, 0.41])
  const strap = mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 40, Math.PI), goggleFrame, [0, 2.69, 0.05])
  strap.rotation.z = Math.PI
  group.add(bridge, strap)

  const upperLeft = cylinderBetween([-0.49, 1.95, 0], [-0.55, 1.47, 0.18], 0.125, purple)
  const upperRight = cylinderBetween([0.49, 1.95, 0], [0.55, 1.47, 0.18], 0.125, purple)
  const lowerLeft = cylinderBetween([-0.55, 1.47, 0.18], [-0.27, 1.2, 0.49], 0.115, purple)
  const lowerRight = cylinderBetween([0.55, 1.47, 0.18], [0.27, 1.2, 0.49], 0.115, purple)
  const leftHand = mesh(new THREE.SphereGeometry(0.135, 24, 18), black, [-0.26, 1.18, 0.51])
  const rightHand = mesh(new THREE.SphereGeometry(0.135, 24, 18), black, [0.26, 1.18, 0.51])
  leftHand.scale.set(0.76, 1.12, 0.58)
  rightHand.scale.copy(leftHand.scale)
  group.add(upperLeft, upperRight, lowerLeft, lowerRight, leftHand, rightHand)

  const stripe = mesh(new THREE.BoxGeometry(0.038, 1.08, 0.018), glow, [-0.36, 1.56, 0.35])
  stripe.rotation.z = -0.13
  const collarGlow = mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 36, Math.PI * 1.65), new THREE.MeshStandardMaterial({ color: 0xff37cc, emissive: 0xff37cc, emissiveIntensity: 2.2 }), [0, 2.23, 0.11])
  collarGlow.rotation.x = Math.PI / 2
  const badge = mesh(new THREE.OctahedronGeometry(0.105, 0), material(0xd9dce5, 0.18, 0.94), [0.27, 1.94, 0.35])
  badge.scale.set(0.5, 1.35, 0.2)
  group.add(stripe, collarGlow, badge)

  group.position.set(-1.5, 0, 0.35)
  group.rotation.y = 0.34
  group.userData.label = 'AORB rebel'
  group.userData.danceParts = {
    torso,
    shoulders,
    upperLeft,
    upperRight,
    leftHand,
    rightHand,
    lowerLeft,
    lowerRight,
    leftHandBase: leftHand.position.clone(),
    rightHandBase: rightHand.position.clone(),
    lowerLeftBase: lowerLeft.quaternion.clone(),
    lowerRightBase: lowerRight.quaternion.clone(),
    upperLeftBase: upperLeft.quaternion.clone(),
    upperRightBase: upperRight.quaternion.clone(),
    shouldersBase: shoulders.quaternion.clone(),
  }
  return group
}

function createUrsula() {
  const group = new THREE.Group()
  const cream = fabricMaterial(0xd7cec1, 0.78)
  const creamDark = fabricMaterial(0xbeb3a5, 0.8)
  const skin = skinMaterial(0xd2a085)
  const hair = material(0xc6a56f, 0.76, 0.02)
  const dark = material(0x171b21, 0.7)

  const torso = mesh(new THREE.CylinderGeometry(0.38, 0.47, 1.1, 32), cream, [0, 1.5, 0])
  torso.scale.z = 0.67
  const shoulders = mesh(new THREE.CapsuleGeometry(0.2, 0.7, 6, 20), cream, [0, 1.94, 0])
  shoulders.rotation.z = Math.PI / 2
  shoulders.scale.z = 0.65
  const neck = mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 20), skin, [0, 2.18, 0.03])
  const lapelA = mesh(new THREE.BoxGeometry(0.24, 0.62, 0.035), creamDark, [-0.14, 1.7, 0.32])
  lapelA.rotation.z = -0.22
  const lapelB = mesh(new THREE.BoxGeometry(0.24, 0.62, 0.035), creamDark, [0.14, 1.7, 0.32])
  lapelB.rotation.z = 0.22
  group.add(torso, shoulders, neck, lapelA, lapelB)

  const head = mesh(new THREE.SphereGeometry(0.325, 48, 32), skin, [0, 2.51, 0.08])
  head.scale.set(0.84, 1.08, 0.9)
  const jaw = mesh(new THREE.SphereGeometry(0.25, 32, 20), skin, [0, 2.39, 0.11])
  jaw.scale.set(0.9, 0.72, 0.88)
  const nose = mesh(new THREE.ConeGeometry(0.05, 0.16, 18), skin, [0, 2.5, 0.375])
  nose.rotation.x = Math.PI / 2
  group.add(head, jaw, nose)
  addEye(group, -0.1, 2.57, 0.37)
  addEye(group, 0.1, 2.57, 0.37)
  addFaceDetails(group, skin, 2.49, { brows: true, browColor: 0x806b4c, lipColor: 0x945e61 })

  const hairCap = mesh(new THREE.SphereGeometry(0.35, 34, 22, 0, Math.PI * 2, 0, Math.PI * 0.6), hair, [0, 2.66, 0.01])
  hairCap.scale.set(1.08, 0.88, 1.04)
  group.add(hairCap)
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2
    const curl = mesh(new THREE.SphereGeometry(0.085, 16, 12), hair, [Math.cos(angle) * 0.31, 2.59 + Math.sin(angle * 2) * 0.065, -0.01 + Math.sin(angle) * 0.23])
    curl.scale.set(1.5, 0.72, 0.72)
    curl.rotation.z = angle * 0.5
    group.add(curl)
  }

  const upperLeft = cylinderBetween([-0.45, 1.88, 0], [-0.5, 1.43, 0.16], 0.115, cream)
  const upperRight = cylinderBetween([0.45, 1.88, 0], [0.5, 1.43, 0.16], 0.115, cream)
  const lowerLeft = cylinderBetween([-0.5, 1.43, 0.16], [-0.12, 1.2, 0.46], 0.103, cream)
  const lowerRight = cylinderBetween([0.5, 1.43, 0.16], [0.12, 1.2, 0.46], 0.103, cream)
  const leftHand = mesh(new THREE.SphereGeometry(0.11, 22, 16), skin, [-0.1, 1.18, 0.48])
  const rightHand = mesh(new THREE.SphereGeometry(0.11, 22, 16), skin, [0.1, 1.18, 0.48])
  leftHand.scale.set(0.72, 1.05, 0.56)
  rightHand.scale.copy(leftHand.scale)
  const pin = mesh(new THREE.BoxGeometry(0.075, 0.075, 0.025), dark, [0.29, 1.91, 0.34])
  group.add(upperLeft, upperRight, lowerLeft, lowerRight, leftHand, rightHand, pin)

  group.position.set(1.5, 0, 0.35)
  group.rotation.y = -0.34
  group.userData.label = 'European Commission president'
  group.userData.danceParts = {
    torso,
    shoulders,
    upperLeft,
    upperRight,
    leftHand,
    rightHand,
    lowerLeft,
    lowerRight,
    leftHandBase: leftHand.position.clone(),
    rightHandBase: rightHand.position.clone(),
    lowerLeftBase: lowerLeft.quaternion.clone(),
    lowerRightBase: lowerRight.quaternion.clone(),
    upperLeftBase: upperLeft.quaternion.clone(),
    upperRightBase: upperRight.quaternion.clone(),
    shouldersBase: shoulders.quaternion.clone(),
  }
  return group
}

function addAtmosphere(scene, compact = false) {
  const geometry = new THREE.BufferGeometry()
  const particleCount = compact ? 160 : 420
  const positions = new Float32Array(particleCount * 3)
  for (let index = 0; index < particleCount; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 17
    positions[index * 3 + 1] = Math.random() * 7
    positions[index * 3 + 2] = (Math.random() - 0.5) * 14
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x8ac7ff, size: 0.018, transparent: true, opacity: 0.48 }))
  scene.add(points)
  return points
}

const cameraViews = {
  faceoff: { position: new THREE.Vector3(0, 2.25, 5.25), target: new THREE.Vector3(0, 1.58, 0.1) },
  rebel: { position: new THREE.Vector3(-3.4, 2.25, 4.05), target: new THREE.Vector3(-1.45, 1.75, 0.3) },
  parliament: { position: new THREE.Vector3(0, 5.25, 10.5), target: new THREE.Vector3(0, 1.75, -2.25) },
  free: { position: new THREE.Vector3(5.6, 3.15, 6.2), target: new THREE.Vector3(0, 1.5, -0.6) },
}

const SpatialScene = forwardRef(function SpatialScene({ onReady }, ref) {
  const mountRef = useRef(null)
  const apiRef = useRef(null)

  useImperativeHandle(ref, () => ({
    goTo: (name) => apiRef.current?.goTo(name),
    setAutoRotate: (value) => apiRef.current?.setAutoRotate(value),
    setDirectorMode: (value) => apiRef.current?.setDirectorMode(value),
    connectAudio: (audio) => apiRef.current?.connectAudio(audio),
  }), [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05070c)
    scene.fog = new THREE.FogExp2(0x07101d, 0.036)

    const isMobile = mount.clientWidth < 760 || window.matchMedia('(pointer: coarse)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resolveView = (name) => {
      const base = cameraViews[name] || cameraViews.free
      const position = base.position.clone()
      if (isMobile) {
        position.z += name === 'parliament' ? 2.8 : 2.15
        position.y += 0.2
      }
      return { position, target: base.target.clone() }
    }
    const initialView = resolveView('faceoff')
    const camera = new THREE.PerspectiveCamera(isMobile ? 50 : 42, mount.clientWidth / mount.clientHeight, 0.1, 60)
    camera.position.copy(initialView.position)

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance', stencil: false, depth: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    let renderScale = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.55)
    renderer.setPixelRatio(renderScale)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.88
    renderer.shadowMap.enabled = !isMobile
    renderer.shadowMap.type = THREE.PCFShadowMap
    mount.appendChild(renderer.domElement)

    const useBloom = mount.clientWidth >= 900 && !reduceMotion
    const composer = useBloom ? new EffectComposer(renderer) : null
    const bloomPass = useBloom ? new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.12, 0.24, 1.02) : null
    const rgbPass = useBloom ? new ShaderPass(RGBShiftShader) : null
    const vignettePass = useBloom ? new ShaderPass(VignetteShader) : null
    if (composer && bloomPass) {
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(bloomPass)
      rgbPass.uniforms.amount.value = 0.00022
      vignettePass.uniforms.offset.value = 1.06
      vignettePass.uniforms.darkness.value = 1.16
      composer.addPass(rgbPass)
      composer.addPass(vignettePass)
      composer.addPass(new OutputPass())
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(initialView.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.minDistance = 2.2
    controls.maxDistance = 16
    controls.maxPolarAngle = Math.PI * 0.89
    controls.autoRotateSpeed = 0.85

    scene.add(new THREE.HemisphereLight(0x8bbcff, 0x160d22, 1.25))
    const key = new THREE.SpotLight(0xfff4ea, 62, 18, Math.PI / 5, 0.62, 1.5)
    key.position.set(0, 8, 5)
    key.castShadow = !isMobile
    key.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024)
    scene.add(key)
    const violet = new THREE.PointLight(VIOLET, 38, 12, 1.5)
    violet.position.set(-5, 3, 2)
    const cyan = new THREE.PointLight(CYAN, 32, 10, 1.4)
    cyan.position.set(5, 3, 1)
    const red = new THREE.PointLight(RED, 22, 8, 1.6)
    red.position.set(0, 4, -5)
    scene.add(violet, cyan, red)

    const chamberFx = addChamber(scene, isMobile)
    const technoFx = addTechnoRig(scene, isMobile)
    const digitalFx = addDigitalArchitecture(scene, isMobile)
    const reactiveFx = addReactiveStage(scene, isMobile)
    const rebel = createRebel()
    const ursula = createUrsula()
    scene.add(rebel, ursula)
    const atmosphere = addAtmosphere(scene, isMobile)

    let animationFrame
    let desiredPosition = initialView.position.clone()
    let desiredTarget = initialView.target.clone()
    let cameraMoving = false
    let audioContext
    let analyser
    let mediaSource
    let compressor
    let masterGain
    let bassShelf
    let airShelf
    let audioData
    let bassLevel = 0
    let midLevel = 0
    let highLevel = 0
    let previousBass = 0
    let lastBeatAt = -1
    let shockwaveIndex = 0
    let kickEnergy = 0
    let directorMode = false
    let directorIndex = 0
    let nextDirectorCut = 0
    let qualityWindowStarted = 0
    let qualityFrames = 0
    let qualitySettled = false
    let pageVisible = !document.hidden
    const rebelBase = { y: rebel.position.y, rotationY: rebel.rotation.y }
    const ursulaBase = { y: ursula.position.y, rotationY: ursula.rotation.y }
    const danceAxis = new THREE.Vector3(0, 0, 1)
    const danceTwist = new THREE.Quaternion()

    const goTo = (name) => {
      const next = resolveView(name)
      desiredPosition = next.position
      desiredTarget = next.target
      cameraMoving = true
    }
    const setAutoRotate = (value) => { controls.autoRotate = value }
    const setDirectorMode = (value) => {
      directorMode = value
      controls.autoRotate = false
      nextDirectorCut = 0
    }
    const connectAudio = (audio) => {
      if (!audio) return
      if (audioContext) {
        void audioContext.resume()
        return
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      try {
        audioContext = new AudioContextClass()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.82
        compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -18
        compressor.knee.value = 18
        compressor.ratio.value = 4
        compressor.attack.value = 0.008
        compressor.release.value = 0.22
        masterGain = audioContext.createGain()
        masterGain.gain.value = 1.08
        bassShelf = audioContext.createBiquadFilter()
        bassShelf.type = 'lowshelf'
        bassShelf.frequency.value = 115
        bassShelf.gain.value = 3.2
        airShelf = audioContext.createBiquadFilter()
        airShelf.type = 'highshelf'
        airShelf.frequency.value = 6800
        airShelf.gain.value = -1.4
        audioData = new Uint8Array(analyser.frequencyBinCount)
        mediaSource = audioContext.createMediaElementSource(audio)
        mediaSource.connect(analyser)
        analyser.connect(bassShelf)
        bassShelf.connect(airShelf)
        airShelf.connect(compressor)
        compressor.connect(masterGain)
        masterGain.connect(audioContext.destination)
        void audioContext.resume()
      } catch {
        analyser = undefined
      }
    }
    apiRef.current = { goTo, setAutoRotate, setDirectorMode, connectAudio }

    const timer = new THREE.Timer()
    timer.connect(document)
    const animate = () => {
      timer.update()
      const elapsed = timer.getElapsed()
      const delta = Math.min(timer.getDelta(), 0.05)
      if (!pageVisible) {
        animationFrame = requestAnimationFrame(animate)
        return
      }
      if (analyser && audioData) {
        analyser.getByteFrequencyData(audioData)
        let bass = 0
        let mids = 0
        let highs = 0
        for (let index = 0; index < 12; index += 1) bass += audioData[index]
        for (let index = 12; index < 34; index += 1) mids += audioData[index]
        for (let index = 34; index < audioData.length; index += 1) highs += audioData[index]
        bassLevel += ((bass / (12 * 255)) - bassLevel) * 0.24
        midLevel += ((mids / (22 * 255)) - midLevel) * 0.2
        highLevel += ((highs / ((audioData.length - 34) * 255)) - highLevel) * 0.16
      } else {
        bassLevel += (0.08 - bassLevel) * 0.03
        midLevel += (0.05 - midLevel) * 0.03
        highLevel += (0.025 - highLevel) * 0.03
      }
      const pulse = Math.max(0.04, bassLevel)
      const beatDetected = bassLevel > 0.19 && bassLevel > previousBass + 0.018 && elapsed - lastBeatAt > 0.28
      if (beatDetected) {
        const wave = reactiveFx.shockwaves[shockwaveIndex % reactiveFx.shockwaves.length]
        wave.userData.life = 0
        wave.scale.setScalar(0.3)
        wave.material.opacity = 0.72
        shockwaveIndex += 1
        lastBeatAt = elapsed
        kickEnergy = Math.min(1, kickEnergy + 0.62)
      }
      previousBass = bassLevel
      kickEnergy *= 0.86
      if (!qualitySettled) {
        qualityFrames += 1
        if (!qualityWindowStarted) qualityWindowStarted = elapsed
        if (elapsed - qualityWindowStarted >= 4) {
          const fps = qualityFrames / (elapsed - qualityWindowStarted)
          if (fps < 43 && renderScale > 1) {
            renderScale = Math.max(1, renderScale - 0.2)
            renderer.setPixelRatio(renderScale)
            renderer.setSize(mount.clientWidth, mount.clientHeight, false)
            composer?.setSize(mount.clientWidth, mount.clientHeight)
            qualityFrames = 0
            qualityWindowStarted = elapsed
          } else {
            qualitySettled = true
          }
        }
      }
      if (directorMode && elapsed >= nextDirectorCut) {
        const sequence = ['faceoff', 'rebel', 'parliament', 'free']
        goTo(sequence[directorIndex % sequence.length])
        directorIndex += 1
        nextDirectorCut = elapsed + 7.5
      }
      const dance = reduceMotion ? 0 : Math.min(1, bassLevel * 0.82 + midLevel * 0.48)
      const rebelBeat = Math.sin(elapsed * (3.35 + dance * 1.8))
      const rebelSway = Math.sin(elapsed * 1.9)
      rebel.position.y = rebelBase.y + Math.abs(rebelBeat) * (0.018 + dance * 0.075)
      rebel.rotation.y = rebelBase.rotationY + rebelSway * dance * 0.045
      rebel.rotation.z = rebelSway * dance * 0.07
      const rebelParts = rebel.userData.danceParts
      rebelParts.leftHand.position.y = rebelParts.leftHandBase.y + Math.max(0, rebelBeat) * dance * 0.075
      rebelParts.rightHand.position.y = rebelParts.rightHandBase.y + Math.max(0, -rebelBeat) * dance * 0.075
      danceTwist.setFromAxisAngle(danceAxis, rebelSway * dance * 0.12)
      rebelParts.lowerLeft.quaternion.copy(rebelParts.lowerLeftBase).multiply(danceTwist)
      danceTwist.setFromAxisAngle(danceAxis, -rebelSway * dance * 0.12)
      rebelParts.lowerRight.quaternion.copy(rebelParts.lowerRightBase).multiply(danceTwist)
      danceTwist.setFromAxisAngle(danceAxis, -rebelBeat * dance * 0.09)
      rebelParts.upperLeft.quaternion.copy(rebelParts.upperLeftBase).multiply(danceTwist)
      danceTwist.setFromAxisAngle(danceAxis, rebelBeat * dance * 0.09)
      rebelParts.upperRight.quaternion.copy(rebelParts.upperRightBase).multiply(danceTwist)
      rebelParts.shoulders.rotation.x = Math.sin(elapsed * 3.1) * dance * 0.025
      rebelParts.torso.scale.y = 1 + Math.max(0, rebelBeat) * dance * 0.018

      const ursulaBeat = Math.sin(elapsed * (2.6 + dance * 1.15) + 1.1)
      const ursulaSway = Math.sin(elapsed * 1.45 + 0.7)
      ursula.position.y = ursulaBase.y + Math.abs(ursulaBeat) * dance * 0.032
      ursula.rotation.y = ursulaBase.rotationY - ursulaSway * dance * 0.024
      ursula.rotation.z = -ursulaSway * dance * 0.035
      const ursulaParts = ursula.userData.danceParts
      ursulaParts.leftHand.position.y = ursulaParts.leftHandBase.y + Math.max(0, ursulaBeat) * dance * 0.035
      ursulaParts.rightHand.position.y = ursulaParts.rightHandBase.y + Math.max(0, -ursulaBeat) * dance * 0.035
      danceTwist.setFromAxisAngle(danceAxis, -ursulaSway * dance * 0.045)
      ursulaParts.upperLeft.quaternion.copy(ursulaParts.upperLeftBase).multiply(danceTwist)
      danceTwist.setFromAxisAngle(danceAxis, ursulaSway * dance * 0.045)
      ursulaParts.upperRight.quaternion.copy(ursulaParts.upperRightBase).multiply(danceTwist)
      ursulaParts.shoulders.rotation.x = Math.sin(elapsed * 2.2 + 0.8) * dance * 0.014
      violet.intensity = 30 + pulse * 76 + Math.sin(elapsed * 1.5) * 2
      cyan.intensity = 27 + pulse * 68 + Math.cos(elapsed * 1.15) * 2
      red.intensity = 17 + pulse * 42
      chamberFx.ring.material.emissiveIntensity = 1.5 + pulse * 6
      chamberFx.dais.scale.y = 1 + pulse * 0.08
      technoFx.rig.rotation.y = elapsed * 0.025
      technoFx.beams.forEach((beam, index) => {
        beam.material.opacity = 0.012 + pulse * (0.06 + (index % 2) * 0.018)
        beam.rotation.y = elapsed * (index % 2 ? -0.055 : 0.045) + index
      })
      technoFx.pulseRings.forEach((floorRing, index) => {
        const scale = 1 + pulse * (0.025 + index * 0.008)
        floorRing.scale.setScalar(scale)
        floorRing.material.opacity = 0.11 + pulse * 0.5
      })
      technoFx.equalizerBars.forEach((bar, index) => {
        const spectrumValue = audioData ? audioData[Math.min(audioData.length - 1, 2 + index)] / 255 : (Math.sin(elapsed * 3.2 + index * 0.72) + 1) * 0.08
        const height = 0.08 + spectrumValue * 1.35
        bar.scale.y += (height - bar.scale.y) * 0.28
        bar.position.y = 0.56 + bar.scale.y * 0.5
        bar.material.emissiveIntensity = 1.6 + spectrumValue * 5.4
      })
      technoFx.ceilingRings.forEach((halo, index) => {
        halo.rotation.z = elapsed * (index % 2 ? -0.035 : 0.028) + index * 0.18
        halo.material.opacity = 0.18 + pulse * (0.28 + index * 0.04)
      })
      technoFx.scannerRing.position.y = 0.25 + ((elapsed * 0.38) % 1) * 3.4
      technoFx.scannerRing.material.opacity = 0.035 + pulse * 0.16
      technoFx.starHalo.rotation.z = elapsed * (0.08 + midLevel * 0.18)
      technoFx.starHalo.scale.setScalar(1 + pulse * 0.09)
      reactiveFx.grid.material.opacity = 0.045 + pulse * 0.16
      reactiveFx.hologram.material.opacity = 0.065 + midLevel * 0.2
      reactiveFx.hologram.material.emissiveIntensity = 0.65 + pulse * 3.4
      reactiveFx.hologram.rotation.y = elapsed * 0.18
      reactiveFx.orbiters.rotation.y = elapsed * (0.2 + midLevel * 0.28)
      reactiveFx.orbiters.children.forEach((shard, index) => {
        shard.position.y = shard.userData.baseY + Math.sin(elapsed * 2.1 + index) * 0.035
        shard.scale.setScalar(0.72 + pulse * 1.25 + Math.sin(elapsed * 2.7 + index) * 0.08)
      })
      reactiveFx.shockwaves.forEach((wave) => {
        if (wave.userData.life < 0) return
        wave.userData.life += delta * (1.18 + pulse * 0.9)
        const progress = wave.userData.life
        wave.scale.setScalar(0.3 + progress * 5.8)
        wave.material.opacity = Math.max(0, (1 - progress) * 0.62)
        if (progress >= 1) wave.userData.life = -1
      })
      chamberFx.screen.material.map.offset.x = Math.sin(elapsed * 0.42) * 0.003
      digitalFx.nodes.material.emissiveIntensity = 0.8 + midLevel * 3.4
      digitalFx.portals.forEach((portal, index) => {
        portal.material.opacity = 0.11 + pulse * (0.22 + index * 0.04)
        portal.scale.setScalar(1 + Math.sin(elapsed * 0.65 + index) * 0.004)
      })
      digitalFx.horizon.material.opacity = 0.2 + highLevel * 0.8
      if (bloomPass) bloomPass.strength = 0.09 + pulse * 0.16
      if (rgbPass) {
        rgbPass.uniforms.amount.value = 0.00012 + pulse * 0.00042 + kickEnergy * 0.00032
        rgbPass.uniforms.angle.value = elapsed * 0.12
      }
      const baseFov = isMobile ? 50 : 42
      camera.fov += ((baseFov + kickEnergy * 1.35) - camera.fov) * 0.18
      camera.updateProjectionMatrix()
      atmosphere.material.size = 0.016 + pulse * 0.026 + highLevel * 0.018
      atmosphere.rotation.y = elapsed * 0.008
      if (cameraMoving) {
        camera.position.lerp(desiredPosition, 0.055)
        controls.target.lerp(desiredTarget, 0.055)
        if (camera.position.distanceTo(desiredPosition) < 0.035 && controls.target.distanceTo(desiredTarget) < 0.025) cameraMoving = false
      }
      controls.update()
      if (composer) composer.render()
      else renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }
    animate()

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
      composer?.setSize(clientWidth, clientHeight)
    }
    window.addEventListener('resize', resize)
    const updateVisibility = () => { pageVisible = !document.hidden }
    document.addEventListener('visibilitychange', updateVisibility)
    const readyFrame = requestAnimationFrame(() => onReady?.())

    return () => {
      cancelAnimationFrame(animationFrame)
      cancelAnimationFrame(readyFrame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', updateVisibility)
      controls.dispose()
      timer.dispose()
      if (mediaSource) mediaSource.disconnect()
      if (analyser) analyser.disconnect()
      if (bassShelf) bassShelf.disconnect()
      if (airShelf) airShelf.disconnect()
      if (compressor) compressor.disconnect()
      if (masterGain) masterGain.disconnect()
      if (audioContext) void audioContext.close()
      scene.traverse((item) => {
        item.geometry?.dispose()
        const materials = Array.isArray(item.material) ? item.material : [item.material]
        materials.filter(Boolean).forEach((entry) => {
          entry.map?.dispose()
          entry.dispose()
        })
      })
      renderer.dispose()
      composer?.dispose()
      renderer.domElement.remove()
      textureCache.clear()
      apiRef.current = null
    }
  }, [onReady])

  return <div className="spatial-canvas" ref={mountRef} aria-label="Interactive 3D scene of an AORB political debate in the European Parliament" />
})

export default SpatialScene
