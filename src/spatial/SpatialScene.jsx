import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const VIOLET = 0x7c3aed
const CYAN = 0x00d9ff
const RED = 0xff315b
const GOLD = 0xffd700

function material(color, roughness = 0.62, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
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

function addChamber(scene) {
  const chamber = new THREE.Group()
  const floor = mesh(new THREE.CylinderGeometry(8.5, 8.5, 0.22, 72), material(0x11131a, 0.38, 0.35), [0, -0.18, 0])
  chamber.add(floor)

  const ring = mesh(new THREE.TorusGeometry(7.5, 0.055, 8, 96), new THREE.MeshStandardMaterial({ color: VIOLET, emissive: VIOLET, emissiveIntensity: 2.2 }), [0, 0.02, 0])
  ring.rotation.x = Math.PI / 2
  chamber.add(ring)

  const wall = mesh(new THREE.CylinderGeometry(8.35, 8.35, 5.8, 72, 1, true, 0.25, Math.PI * 1.82), material(0x101823, 0.78, 0.2), [0, 2.65, 0])
  wall.material.side = THREE.BackSide
  wall.rotation.y = -0.1
  chamber.add(wall)

  const deskMat = material(0x20171a, 0.42, 0.28)
  const seatMat = material(0x182b3f, 0.72, 0.06)
  for (let row = 0; row < 4; row += 1) {
    const radius = 3.8 + row * 0.85
    const count = 17 + row * 5
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

  for (let index = 0; index < 7; index += 1) {
    addEuFlag(chamber, -3.25 + index * 1.08, 1.5, -6.25)
  }

  const dais = mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.42, 40), material(0x211922, 0.38, 0.36), [0, 0.12, -2.4])
  chamber.add(dais)
  scene.add(chamber)
  return { ring, screenFrame, dais }
}

function addTechnoRig(scene) {
  const rig = new THREE.Group()
  const beams = []
  const pulseRings = []
  const equalizerBars = []
  const colors = [VIOLET, CYAN, RED, VIOLET, CYAN, RED]

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
    const beam = mesh(new THREE.ConeGeometry(0.52, 6.8, 20, 1, true), beamMaterial, [Math.cos(angle) * 4.5, 3.3, Math.sin(angle) * 4.5 - 1.2])
    beam.rotation.z = Math.sin(angle) * 0.11
    beam.rotation.x = Math.cos(angle) * 0.11
    beams.push(beam)
    rig.add(beam)
  })

  ;[1.55, 2.25, 3.1, 4.15, 5.35].forEach((radius, index) => {
    const color = index % 2 ? CYAN : VIOLET
    const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
    const floorRing = mesh(new THREE.TorusGeometry(radius, 0.018, 6, 96), ringMaterial, [0, 0.015 + index * 0.002, -0.6])
    floorRing.rotation.x = Math.PI / 2
    pulseRings.push(floorRing)
    rig.add(floorRing)
  })

  for (let index = 0; index < 28; index += 1) {
    const ratio = index / 27
    const color = new THREE.Color().setHSL(0.52 + ratio * 0.24, 0.9, 0.56)
    const barMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.1, roughness: 0.24, metalness: 0.32 })
    const bar = mesh(new THREE.BoxGeometry(0.085, 1, 0.09), barMaterial, [-2.75 + ratio * 5.5, 1.04, -5.82])
    bar.scale.y = 0.12
    equalizerBars.push(bar)
    rig.add(bar)
  }

  scene.add(rig)
  return { rig, beams, pulseRings, equalizerBars }
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
  const white = mesh(new THREE.SphereGeometry(0.036, 18, 12), material(0xf5f3ea, 0.52), [x, y, z])
  white.scale.set(1.18, 0.58, 0.36)
  const pupil = mesh(new THREE.SphereGeometry(0.012, 12, 8), material(0x17202b, 0.3), [x, y, z + 0.031])
  parent.add(white, pupil)
}

function addFaceDetails(group, skin, y) {
  const leftEar = mesh(new THREE.SphereGeometry(0.07, 18, 12), skin, [-0.31, y + 0.02, 0.05])
  const rightEar = mesh(new THREE.SphereGeometry(0.07, 18, 12), skin, [0.31, y + 0.02, 0.05])
  leftEar.scale.set(0.55, 1, 0.45)
  rightEar.scale.copy(leftEar.scale)
  const mouth = mesh(new THREE.BoxGeometry(0.13, 0.015, 0.015), material(0x6d3032, 0.8), [0, y - 0.16, 0.36])
  group.add(leftEar, rightEar, mouth)
}

function createRebel() {
  const group = new THREE.Group()
  const purple = material(0x35135f, 0.67, 0.12)
  const purpleDark = material(0x160d25, 0.52, 0.28)
  const black = material(0x07090d, 0.3, 0.62)
  const skin = material(0xb97d60, 0.72)
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
  return group
}

function createUrsula() {
  const group = new THREE.Group()
  const cream = material(0xd7cec1, 0.82, 0.02)
  const creamDark = material(0xbeb3a5, 0.84, 0.02)
  const skin = material(0xd2a085, 0.76)
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
  addFaceDetails(group, skin, 2.49)

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
  return group
}

function addAtmosphere(scene) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(420 * 3)
  for (let index = 0; index < 420; index += 1) {
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
    connectAudio: (audio) => apiRef.current?.connectAudio(audio),
  }), [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05070c)
    scene.fog = new THREE.FogExp2(0x07101d, 0.036)

    const isMobile = mount.clientWidth < 700
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.4 : 1.8))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.06
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    mount.appendChild(renderer.domElement)

    const useBloom = mount.clientWidth >= 700
    const composer = useBloom ? new EffectComposer(renderer) : null
    const bloomPass = useBloom ? new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.18, 0.2, 0.94) : null
    if (composer && bloomPass) {
      composer.addPass(new RenderPass(scene, camera))
      composer.addPass(bloomPass)
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

    scene.add(new THREE.HemisphereLight(0x8bbcff, 0x160d22, 2.1))
    const key = new THREE.SpotLight(0xffffff, 108, 18, Math.PI / 5, 0.55, 1.5)
    key.position.set(0, 8, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    scene.add(key)
    const violet = new THREE.PointLight(VIOLET, 75, 12, 1.5)
    violet.position.set(-5, 3, 2)
    const cyan = new THREE.PointLight(CYAN, 65, 10, 1.4)
    cyan.position.set(5, 3, 1)
    const red = new THREE.PointLight(RED, 40, 8, 1.6)
    red.position.set(0, 4, -5)
    scene.add(violet, cyan, red)

    const chamberFx = addChamber(scene)
    const technoFx = addTechnoRig(scene)
    scene.add(createRebel(), createUrsula())
    const atmosphere = addAtmosphere(scene)

    let animationFrame
    let desiredPosition = initialView.position.clone()
    let desiredTarget = initialView.target.clone()
    let cameraMoving = false
    let audioContext
    let analyser
    let mediaSource
    let audioData
    let bassLevel = 0

    const goTo = (name) => {
      const next = resolveView(name)
      desiredPosition = next.position
      desiredTarget = next.target
      cameraMoving = true
    }
    const setAutoRotate = (value) => { controls.autoRotate = value }
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
        audioData = new Uint8Array(analyser.frequencyBinCount)
        mediaSource = audioContext.createMediaElementSource(audio)
        mediaSource.connect(analyser)
        analyser.connect(audioContext.destination)
        void audioContext.resume()
      } catch {
        analyser = undefined
      }
    }
    apiRef.current = { goTo, setAutoRotate, connectAudio }

    const timer = new THREE.Timer()
    timer.connect(document)
    const animate = () => {
      timer.update()
      const elapsed = timer.getElapsed()
      if (analyser && audioData) {
        analyser.getByteFrequencyData(audioData)
        let bass = 0
        for (let index = 0; index < 12; index += 1) bass += audioData[index]
        bassLevel += ((bass / (12 * 255)) - bassLevel) * 0.24
      } else {
        bassLevel += (0.08 - bassLevel) * 0.03
      }
      const pulse = Math.max(0.04, bassLevel)
      violet.intensity = 58 + pulse * 145 + Math.sin(elapsed * 1.5) * 4
      cyan.intensity = 52 + pulse * 125 + Math.cos(elapsed * 1.15) * 4
      red.intensity = 28 + pulse * 78
      chamberFx.ring.material.emissiveIntensity = 1.5 + pulse * 6
      chamberFx.dais.scale.y = 1 + pulse * 0.08
      technoFx.rig.rotation.y = elapsed * 0.025
      technoFx.beams.forEach((beam, index) => {
        beam.material.opacity = 0.025 + pulse * (0.16 + (index % 2) * 0.035)
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
      if (bloomPass) bloomPass.strength = 0.13 + pulse * 0.24
      atmosphere.material.size = 0.016 + pulse * 0.026
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
    const readyFrame = requestAnimationFrame(() => onReady?.())

    return () => {
      cancelAnimationFrame(animationFrame)
      cancelAnimationFrame(readyFrame)
      window.removeEventListener('resize', resize)
      controls.dispose()
      timer.dispose()
      if (mediaSource) mediaSource.disconnect()
      if (analyser) analyser.disconnect()
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
      apiRef.current = null
    }
  }, [onReady])

  return <div className="spatial-canvas" ref={mountRef} aria-label="Interactive 3D scene of an AORB political debate in the European Parliament" />
})

export default SpatialScene
