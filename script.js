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

function findIntersectionPoints(func1, func2, range, step) {
  const intersections = [];
  for (let x = -range; x <= range; x += step) {
    if (Math.abs(func1(x) - func2(x)) < 0.01) {
      intersections.push(x);
    }
  }
  return intersections;
}

function drawFunctionsAndAreaBetween(func1, func2, color1, color2, fillColor) {
  const range = 10; // X-axis range
  const step = 0.01; // Granularity of the plot
  const curvePoints1 = [];
  const curvePoints2 = [];
  const fillPoints = [];

  // Find intersection points
  const intersections = findIntersectionPoints(func1, func2, range, step);
  if (intersections.length < 2) {
    console.error("The two functions do not intersect within the range.");
    return;
  }

  const minIntersection = Math.min(...intersections);
  const maxIntersection = Math.max(...intersections);

  // Generate points for the curves and the area between
  for (let x = minIntersection; x <= maxIntersection; x += step) {
    const y1 = func1(x); // First function
    const y2 = func2(x); // Second function

    // Determine which function is on top and which is on the bottom
    const topY = Math.max(y1, y2);
    const bottomY = Math.min(y1, y2);

    curvePoints1.push(new THREE.Vector3(x, y1, 0)); // Points for the first curve
    curvePoints2.push(new THREE.Vector3(x, y2, 0)); // Points for the second curve

    // Add the points for the fill area
    fillPoints.push(new THREE.Vector2(x, topY)); // Top boundary
    fillPoints.unshift(new THREE.Vector2(x, bottomY)); // Bottom boundary
  }

  // Draw the first curve
  const curveGeometry1 = new THREE.BufferGeometry().setFromPoints(curvePoints1);
  const curveMaterial1 = new THREE.LineBasicMaterial({ color: color1 });
  const curveLine1 = new THREE.Line(curveGeometry1, curveMaterial1);
  scene.add(curveLine1);

  // Draw the second curve
  const curveGeometry2 = new THREE.BufferGeometry().setFromPoints(curvePoints2);
  const curveMaterial2 = new THREE.LineBasicMaterial({ color: color2 });
  const curveLine2 = new THREE.Line(curveGeometry2, curveMaterial2);
  scene.add(curveLine2);

  // Create the shape and geometry for the filled area
  const shape = new THREE.Shape(fillPoints);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: fillColor,
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true,
  });
  const filledArea = new THREE.Mesh(geometry, material);
  scene.add(filledArea);

  return { filledArea, curveLine1, curveLine2 };
}


function plotFunction1(x) {
  return x**2; 
}

function plotFunction2(x) {
  return x**3;
}

// Draw the functions and the area between them
const { filledArea, curveLine1, curveLine2 } = drawFunctionsAndAreaBetween(
  plotFunction1,
  plotFunction2,
  0xff0000, // Red line for the first function
  0x0000ff, // Blue line for the second function
  0x00ff00 // Green fill for the area between curves
);

let globalRotationAxis = "y"; // Can be "x", "y", or "z"

function animate() {
  if (filledArea) {
    if (globalRotationAxis === "x") filledArea.rotation.x += 0.01;
    if (globalRotationAxis === "y") filledArea.rotation.y += 0.01;
    if (globalRotationAxis === "z") filledArea.rotation.z += 0.01;
  }

  if (curveLine1) {
    if (globalRotationAxis === "x") curveLine1.rotation.x += 0.01;
    if (globalRotationAxis === "y") curveLine1.rotation.y += 0.01;
    if (globalRotationAxis === "z") curveLine1.rotation.z += 0.01;
  }
  if (curveLine2) {
    if (globalRotationAxis === "x") curveLine2.rotation.x += 0.01;
    if (globalRotationAxis === "y") curveLine2.rotation.y += 0.01;
    if (globalRotationAxis === "z") curveLine2.rotation.z += 0.01;
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

