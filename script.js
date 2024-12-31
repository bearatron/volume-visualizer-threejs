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
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
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

function plotFunction(x) {
  return Math.sin(x);
}

let filledArea, curveLine;

function addRotatingFunction() {
  const curvePoints = [];
  const fillPoints = [];
  const range = 20; // X-axis range
  const step = 0.1; // Granularity of the plot

  for (let x = -range; x <= range; x += step) {
    const y = plotFunction(x);
    curvePoints.push(new THREE.Vector2(x, Math.max(y, 0))); // Points on the curve
    fillPoints.push(new THREE.Vector2(x, Math.max(y, 0))); // Points above or on the X-axis
  }

  fillPoints.push(new THREE.Vector2(range, 0)); // Bottom-right corner (X-axis)
  fillPoints.push(new THREE.Vector2(-range, 0)); // Bottom-left corner (X-axis)

  const shape = new THREE.Shape(fillPoints);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffaaaa,
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true,
  });
  filledArea = new THREE.Mesh(geometry, material);
  scene.add(filledArea);

  const curveGeometry = new THREE.BufferGeometry().setFromPoints(
    curvePoints.map((p) => new THREE.Vector3(p.x, p.y, 0))
  );
  const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  curveLine = new THREE.Line(curveGeometry, curveMaterial);
  scene.add(curveLine);
}

addRotatingFunction();

function animate() {
  if (filledArea && curveLine) {
    filledArea.rotation.x += 0.01;
    curveLine.rotation.x += 0.01;
  }
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
