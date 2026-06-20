import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

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
}

function addEye(parent, x, y, z) {
  const white = mesh(new THREE.SphereGeometry(0.055, 16, 10), material(0xf5f3ea, 0.5), [x, y, z])
  white.scale.set(1.2, 0.72, 0.42)
  const pupil = mesh(new THREE.SphereGeometry(0.022, 12, 8), material(0x1c2430, 0.3), [x, y, z + 0.045])
  parent.add(white, pupil)
}

function createRebel() {
  const group = new THREE.Group()
  const purple = material(0x381365, 0.54, 0.16)
  const black = material(0x090b10, 0.32, 0.56)
  const skin = material(0xc58e70, 0.68)
  const glow = new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 3.2, roughness: 0.25 })

  const torso = mesh(new THREE.CapsuleGeometry(0.58, 1.04, 8, 18), purple, [0, 1.55, 0])
  torso.scale.set(1.08, 1, 0.62)
  const yoke = mesh(new THREE.BoxGeometry(1.23, 0.42, 0.55), black, [0, 2.16, 0.04])
  yoke.rotation.x = -0.08
  group.add(torso, yoke)

  const head = mesh(new THREE.SphereGeometry(0.39, 40, 28), skin, [0, 2.82, 0.08])
  head.scale.set(0.88, 1.12, 0.92)
  const nose = mesh(new THREE.ConeGeometry(0.07, 0.2, 16), skin, [0, 2.78, 0.43])
  nose.rotation.x = Math.PI / 2
  group.add(head, nose)

  const goggleFrame = material(0x050608, 0.2, 0.82)
  ;[-0.15, 0.15].forEach((x) => {
    const rim = mesh(new THREE.TorusGeometry(0.12, 0.035, 10, 28), goggleFrame, [x, 2.91, 0.43])
    const lens = mesh(new THREE.CircleGeometry(0.1, 28), new THREE.MeshStandardMaterial({ color: 0x06040a, metalness: 0.55, roughness: 0.1, emissive: 0x21053d, emissiveIntensity: 0.35 }), [x, 2.91, 0.447])
    group.add(rim, lens)
  })
  const bridge = mesh(new THREE.BoxGeometry(0.1, 0.03, 0.035), goggleFrame, [0, 2.91, 0.45])
  group.add(bridge)

  const armGeometry = new THREE.CapsuleGeometry(0.16, 0.78, 6, 14)
  const leftArm = mesh(armGeometry, purple, [-0.67, 1.53, 0.12])
  leftArm.rotation.z = -0.23
  const rightArm = mesh(armGeometry, purple, [0.67, 1.53, 0.12])
  rightArm.rotation.z = 0.23
  const leftHand = mesh(new THREE.SphereGeometry(0.17, 20, 16), black, [-0.78, 0.95, 0.26])
  const rightHand = mesh(new THREE.SphereGeometry(0.17, 20, 16), black, [0.78, 0.95, 0.26])
  group.add(leftArm, rightArm, leftHand, rightHand)

  const stripe = mesh(new THREE.BoxGeometry(0.055, 1.5, 0.02), glow, [-0.49, 1.52, 0.35])
  stripe.rotation.z = -0.15
  const badge = mesh(new THREE.OctahedronGeometry(0.13, 0), material(0xc9cbd3, 0.2, 0.92), [0.31, 2.02, 0.34])
  badge.scale.set(0.55, 1.3, 0.22)
  group.add(stripe, badge)

  group.position.set(-1.55, 0, 0.35)
  group.rotation.y = 0.38
  group.userData.label = 'AORB rebel'
  return group
}

function createUrsula() {
  const group = new THREE.Group()
  const cream = material(0xd9d0c3, 0.78, 0.03)
  const skin = material(0xd8aa8f, 0.72)
  const hair = material(0xc9a76d, 0.74, 0.02)
  const dark = material(0x171b21, 0.7)

  const torso = mesh(new THREE.CapsuleGeometry(0.54, 0.95, 8, 18), cream, [0, 1.5, 0])
  torso.scale.set(1, 1, 0.6)
  const lapelA = mesh(new THREE.BoxGeometry(0.3, 0.78, 0.04), cream, [-0.17, 1.72, 0.34])
  lapelA.rotation.z = -0.22
  const lapelB = mesh(new THREE.BoxGeometry(0.3, 0.78, 0.04), cream, [0.17, 1.72, 0.34])
  lapelB.rotation.z = 0.22
  group.add(torso, lapelA, lapelB)

  const head = mesh(new THREE.SphereGeometry(0.36, 40, 28), skin, [0, 2.69, 0.08])
  head.scale.set(0.86, 1.08, 0.9)
  const nose = mesh(new THREE.ConeGeometry(0.06, 0.18, 16), skin, [0, 2.66, 0.41])
  nose.rotation.x = Math.PI / 2
  group.add(head, nose)
  addEye(group, -0.12, 2.76, 0.41)
  addEye(group, 0.12, 2.76, 0.41)

  const hairCap = mesh(new THREE.SphereGeometry(0.39, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.58), hair, [0, 2.83, 0.02])
  hairCap.scale.set(1.06, 0.9, 1.03)
  group.add(hairCap)
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2
    const curl = mesh(new THREE.SphereGeometry(0.12, 14, 10), hair, [Math.cos(angle) * 0.34, 2.78 + Math.sin(angle * 2) * 0.07, -0.02 + Math.sin(angle) * 0.22])
    curl.scale.set(1.4, 0.75, 0.75)
    group.add(curl)
  }

  const armGeometry = new THREE.CapsuleGeometry(0.145, 0.74, 6, 14)
  const leftArm = mesh(armGeometry, cream, [-0.61, 1.48, 0.1])
  leftArm.rotation.z = -0.19
  const rightArm = mesh(armGeometry, cream, [0.61, 1.48, 0.1])
  rightArm.rotation.z = 0.19
  const hands = mesh(new THREE.SphereGeometry(0.16, 18, 14), skin, [0, 1.03, 0.45])
  hands.scale.set(1.35, 0.75, 0.8)
  const pin = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.03), dark, [0.36, 2.0, 0.36])
  group.add(leftArm, rightArm, hands, pin)

  group.position.set(1.55, 0, 0.35)
  group.rotation.y = -0.38
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
}

const cameraViews = {
  faceoff: { position: new THREE.Vector3(0, 2.25, 7.2), target: new THREE.Vector3(0, 1.55, 0.1) },
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(initialView.target)
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.minDistance = 2.2
    controls.maxDistance = 16
    controls.maxPolarAngle = Math.PI * 0.89
    controls.autoRotateSpeed = 0.85

    scene.add(new THREE.HemisphereLight(0x8bbcff, 0x160d22, 2.1))
    const key = new THREE.SpotLight(0xffffff, 130, 18, Math.PI / 5, 0.55, 1.5)
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

    addChamber(scene)
    scene.add(createRebel(), createUrsula())
    addAtmosphere(scene)

    let animationFrame
    let desiredPosition = initialView.position.clone()
    let desiredTarget = initialView.target.clone()
    let cameraMoving = false

    const goTo = (name) => {
      const next = resolveView(name)
      desiredPosition = next.position
      desiredTarget = next.target
      cameraMoving = true
    }
    const setAutoRotate = (value) => { controls.autoRotate = value }
    apiRef.current = { goTo, setAutoRotate }

    const clock = new THREE.Clock()
    const animate = () => {
      const elapsed = clock.getElapsedTime()
      violet.intensity = 70 + Math.sin(elapsed * 1.5) * 7
      cyan.intensity = 62 + Math.cos(elapsed * 1.15) * 6
      if (cameraMoving) {
        camera.position.lerp(desiredPosition, 0.055)
        controls.target.lerp(desiredTarget, 0.055)
        if (camera.position.distanceTo(desiredPosition) < 0.035 && controls.target.distanceTo(desiredTarget) < 0.025) cameraMoving = false
      }
      controls.update()
      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }
    animate()

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
    }
    window.addEventListener('resize', resize)
    const readyFrame = requestAnimationFrame(() => onReady?.())

    return () => {
      cancelAnimationFrame(animationFrame)
      cancelAnimationFrame(readyFrame)
      window.removeEventListener('resize', resize)
      controls.dispose()
      scene.traverse((item) => {
        item.geometry?.dispose()
        const materials = Array.isArray(item.material) ? item.material : [item.material]
        materials.filter(Boolean).forEach((entry) => {
          entry.map?.dispose()
          entry.dispose()
        })
      })
      renderer.dispose()
      renderer.domElement.remove()
      apiRef.current = null
    }
  }, [onReady])

  return <div className="spatial-canvas" ref={mountRef} aria-label="Interactive 3D scene of an AORB political debate in the European Parliament" />
})

export default SpatialScene
