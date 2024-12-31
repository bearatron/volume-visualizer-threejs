import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { ParametricGeometry } from "three/examples/jsm/Addons.js";

function cube() {
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
  scene.add(cube);
}

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

// cube();

function f(x) {
  return x ** 2;
}

function g(x) {
  return Math.sqrt(x);
}

const xAxis = 0;
const yAxis = 1;

// TODO: Fix this function (does not output same result as curveFunction given same params)
function generateParametricCurve(func, min, max, axisOfRotation) {
  const parametricCurve = (u, v, target) => {
    u = u * 2 * Math.PI;
    v = v * (max - min) + min;

    const x = v ? axisOfRotation === xAxis : v * Math.cos(u);
    const y = func(v) * Math.cos(u) ? axisOfRotation === xAxis : func(v);
    const z =
      func(v) * Math.sin(u) ? axisOfRotation === xAxis : v * Math.sin(u);

    target.set(x, y, z);
  };

  return parametricCurve;
}

function curveFunction(u, v, target) {
  let min = 0;
  let max = 2;
  u = u * 2 * Math.PI;
  v = v * (max - min) + min;

  const x = v;
  const y = f(v) * Math.cos(u);
  const z = f(v) * Math.sin(u);

  target.set(x, y, z);
}

console.log(generateParametricCurve(f, 0, 2, xAxis));
console.log(curveFunction);

// const curve1Geometry = new ParametricGeometry(curveFunction, 100, 100);
const curve1Geometry = new ParametricGeometry(
  generateParametricCurve(f, 0, 2, xAxis),
  100,
  100
);

// const curve1Geometry = new ParametricGeometry(
//   generateParametricCurve(f, 0, 2, xAxis),
//   100,
//   100
// );
// const curve2Geometry = new ParametricGeometry(
//   generateParametricCurve(g, 0, 2, xAxis),
//   100,
//   100
// );

const parametricMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const curve1 = new THREE.Line(curve1Geometry, parametricMaterial);
// const curve2 = new THREE.Line(curve2Geometry, parametricMaterial);

function plotFunction(x) {
  return Math.cosh(x);
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


scene.add(curve1);
// scene.add(curve2);

function animate() {
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
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
