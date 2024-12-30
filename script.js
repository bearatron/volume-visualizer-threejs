import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { ParametricGeometry } from "three/examples/jsm/Addons.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
console.log(controls);
controls.enableDamping = true;

const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

const geometry = new THREE.BoxGeometry(1, 1, 1);

const vertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec3 vNormal;
void main() {
  // Simple gradient effect based on the normal direction
  float intensity = dot(vNormal, vec3(0.0, 0.0, 1.0));
  gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
}
`;

const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
});

const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// Parametric curve function: x(v), y(v, u), z(v, u)
function curveFunction(u, v, target) {
  u = u * 2 * Math.PI;
  v = v * Math.PI;

  // Define the parametric equations
  const x = v * Math.cos(u);
  const y = Math.sin(3 * v);
  const z = v * Math.sin(u);

  // Set the target position
  target.set(x, y, z);
}

const parametricGeometry = new ParametricGeometry(curveFunction, 100, 100);

const parametricMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const line = new THREE.Line(parametricGeometry, parametricMaterial);
scene.add(line);

function animate() {
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;

  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);
animate();
