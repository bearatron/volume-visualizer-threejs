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
controls.enableDamping = true;

const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

// cube();

function f(x) {
  return Math.tan(x);
}

function g(x) {
  return x**3;
}

const XAXIS = 0;
const YAXIS = 1;


function findIntersectionPoints(func1, func2, start, end, step) {
  const intersections = [];
  for (let x = -start; x <= end; x += step) {
    if (Math.abs(func1(x) - func2(x)) < 0.01) {
      if (!intersections.some(val => Math.abs(val - x) < 0.02)) {
        intersections.push(x);
      }
    }
  }
  return intersections;
}

const intersection1 = findIntersectionPoints(f,g, 10, 10, 0.0001)
let min = Math.min(...intersection1);
let max = Math.max(...intersection1);
const cutoffMax = 2;
const cutoffMin = -2;

function generateParametricCurve(func, min, max, axisOfRotation) {

  const effectiveMinX = Math.max(min, cutoffMin)
  const effectiveMaxX = Math.min(max, cutoffMax);
  const parametricCurve = (u, v, target) => {
    u = u * 2 * Math.PI;
    v = v * (effectiveMaxX - effectiveMinX) + effectiveMinX;

    const x = (axisOfRotation === XAXIS) ? v : v * Math.cos(u);
    const y = (axisOfRotation === XAXIS) ? (func(v) * Math.cos(u)) : func(v);
    const z =(axisOfRotation === XAXIS) ? (func(v) * Math.sin(u)) : v * Math.sin(u);

    target.set(x, y, z);
  };

  return parametricCurve;
}


 console.log(intersection1)

const parametricMaterial = new THREE.LineBasicMaterial({ color: 0xfc03df });
const parametricMaterial2 = new THREE.LineBasicMaterial({ color: 0xfcba03});
const parametricCurve1 = new ParametricGeometry(generateParametricCurve(f, min, max, YAXIS), 100, 100);
const parametricCurve2 = new ParametricGeometry(generateParametricCurve(g, min, max, YAXIS), 100, 100);
const curveparam = new THREE.Line(parametricCurve1, parametricMaterial)
scene.add(curveparam)
const curveparam2 = new THREE.Line(parametricCurve2, parametricMaterial2)
scene.add(curveparam2)



function drawFunctionsAndAreaBetween(func1, func2, color1, color2, fillColor) {
  const step = 0.001; // Granularity of the plot
  const curvePoints1 = [];
  const curvePoints2 = [];
  const fillPoints = [];
  let effectiveMaxX;
  let effectiveMinX
  if(intersection1.length > 1){
    const minIntersection = Math.min(...intersection1);
    const maxIntersection = Math.max(...intersection1);
    effectiveMinX = Math.max(minIntersection, cutoffMin)
    effectiveMaxX = Math.min(maxIntersection, cutoffMax);
  } else {
    effectiveMinX = cutoffMin;
    effectiveMaxX = cutoffMax;
  }

  // Generate points for the curves and the area between
  for (let x = effectiveMinX; x <= effectiveMaxX; x += step) {
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

// Draw the functions and the area between them
const { filledArea, curveLine1, curveLine2 } = drawFunctionsAndAreaBetween(
  f,
  g,
  0xff0000, // Red line for the first function
  0x0000ff, // Blue line for the second function
  0x00ff00 // Green fill for the area between curves
);

let globalRotationAxis = 1; // Can be "x", "y", or "z"

function animate() {
  if (filledArea) {
    if (globalRotationAxis === XAXIS) filledArea.rotation.x += 0.01;
    if (globalRotationAxis === YAXIS) filledArea.rotation.y += 0.01;
  }

  if (curveLine1) {
    if (globalRotationAxis === XAXIS) curveLine1.rotation.x += 0.01;
    if (globalRotationAxis === YAXIS) curveLine1.rotation.y += 0.01;
  }
  if (curveLine2) {
    if (globalRotationAxis === XAXIS) curveLine2.rotation.x += 0.01;
    if (globalRotationAxis === YAXIS) curveLine2.rotation.y += 0.01;
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

