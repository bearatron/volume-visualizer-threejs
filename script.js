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
  return Math.log(x);
}

function g(x) {
  return x;
}

const XAXIS = 0;
const YAXIS = 1;


function findIntersectionPoints(func1, func2, start, end, step) {
  if (((func1(0) === 0)&&(func1(1000) === 0)) || ((func2(0) === 0)&&(func2(1000) === 0))) {
    return [0]; // Special case when f(x) = 0 or g(x) = 0
  }

  const intersections = [];
  for (let x = -start; x <= end; x += step) {
    if (Math.abs(func1(x) - func2(x)) < 0.01) {
      if (!intersections.some(val => Math.abs(val - x) < 0.04)) {
        intersections.push(x);
      }
    }
  }
  return intersections;
}

const intersection1 = findIntersectionPoints(f,g, 10, 10, 0.0001)
let min = Math.min(...intersection1);
let max = Math.max(...intersection1);
const cutoffMax = 5;
const cutoffMin = 0.1; // You must set this to greater than 0 for logarithmic functions
let globalRotationAxis = 1; // Can be 0 for x axis and 1 for y axis


function generateParametricCurve(func, min, max, axisOfRotation) {

  let effectiveMaxX;
  let effectiveMinX;
  if(intersection1.length > 1){
    const minIntersection = Math.min(...intersection1);
    const maxIntersection = Math.max(...intersection1);
    effectiveMinX = Math.max(minIntersection, cutoffMin)
    effectiveMaxX = Math.min(maxIntersection, cutoffMax);
  } else {
    effectiveMinX = cutoffMin;
    effectiveMaxX = cutoffMax;
  }
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


 console.log(intersection1);

const parametricMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const parametricMaterial2 = new THREE.LineBasicMaterial({ color: 0x0000ff});
const parametricCurve1 = new ParametricGeometry(generateParametricCurve(f, min, max, globalRotationAxis), 100, 100);
const parametricCurve2 = new ParametricGeometry(generateParametricCurve(g, min, max, globalRotationAxis), 100, 100);
const curveparam = new THREE.Line(parametricCurve1, parametricMaterial)
const curveparam2 = new THREE.Line(parametricCurve2, parametricMaterial2)

if(!((f(0) === 0)&&(f(1000) === 0))){
  scene.add(curveparam)
}
if(!((g(0) === 0)&&(g(1000) === 0))){
  scene.add(curveparam2)
}


function drawFunctionsAndAreaBetween(func1, func2, color1, color2, fillColor) {
  const step = 0.001; // Granularity of the plot
  const curvePoints1 = [];
  const curvePoints2 = [];
  const fillPoints = [];
  let effectiveMaxX;
  let effectiveMinX;
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
    if (globalRotationAxis == 1 && ((g(1000) == 0) || f(1000) == 0)) {
      // If one function is zero, draw the area from the non-zero function to the y-axis
      const nonZeroFunc = g(1000) == 0 ? f : g; // Determine the non-zero function
      const yValue = nonZeroFunc(x); // Get the value of the non-zero function at x
    
      fillPoints.push(new THREE.Vector2(x, yValue)); // Top boundary: Point on the non-zero function
      fillPoints.unshift(new THREE.Vector2(0, yValue)); // Bottom boundary: Corresponding point on the y-axis
    }
     else {
      fillPoints.push(new THREE.Vector2(x, topY)); // Top boundary
      fillPoints.unshift(new THREE.Vector2(x, bottomY)); // Bottom boundary
   }
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

function drawEnclosingCircle(radius, position, axis, color) {
  const circleGeometry = new THREE.CircleGeometry(radius, 64); // High segment count for a smooth circle
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });

  const circle = new THREE.Mesh(circleGeometry, circleMaterial);

  // Rotate and position the circle based on the axis of rotation
  if (axis === XAXIS) {
    circle.rotation.y = Math.PI / 2; // Rotate around the y-axis to align with the x-axis
    circle.position.set(position, 0, 0);
  } else if (axis === YAXIS) {
    circle.rotation.x = Math.PI / 2; // Rotate around the x-axis to align with the y-axis
    circle.position.set(0, position, 0);
  }

  scene.add(circle);
  return circle;
}


function generateVolume(func1, func2, minX, maxX, axisOfRotation) {
  const points = [];
  const segments = 500; // Number of segments for the curves
  const angleSteps = 100; // Number of steps for the rotation

  for (let i = 0; i <= segments; i++) {
    const x = minX + (i / segments) * (maxX - minX); // Current x value
    const y1 = func1(x); // First function's value at x
    const y2 = func2(x); // Second function's value at x

    for (let j = 0; j <= angleSteps; j++) {
      const angle = (j / angleSteps) * Math.PI * 2; // Current angle in the rotation

      if (axisOfRotation === XAXIS) {
        // Rotation around the x-axis
        points.push(
          x,                       // X coordinate (unchanged for x-axis rotation)
          y1 * Math.cos(angle),    // Y coordinate (rotated around x-axis)
          y1 * Math.sin(angle)     // Z coordinate (rotated around x-axis)
        );
        points.push(
          x,
          y2 * Math.cos(angle),
          y2 * Math.sin(angle)
        );
      } else if (axisOfRotation === YAXIS) {
        // Rotation around the y-axis
        points.push(
          x * Math.cos(angle),     // X coordinate (rotated around y-axis)
          y1,                      // Y coordinate (unchanged for y-axis rotation)
          x * Math.sin(angle)      // Z coordinate (rotated around y-axis)
        );
        points.push(
          x * Math.cos(angle),
          y2,
          x * Math.sin(angle)
        );
      }
    }
  }

  const vertices = new Float32Array(points);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const material = new THREE.MeshBasicMaterial({
    color: 0xf5c242,
    side: THREE.DoubleSide,
    opacity: 0.3,
    transparent: true,
  });

  return new THREE.Mesh(geometry, material);
}

// Define the volume for rotation around the x-axis and add it to the scene
// const volumeMeshX = generateVolume(f, g, cutoffMin, cutoffMax, globalRotationAxis);
if (((f(0) === 0)&&(f(1000) === 0))||((g(0) === 0)&&(g(1000) === 0))){
  // scene.add(volumeMeshX);
}

if(((f(0) === 0)&&(f(1000) === 0))||((g(0) === 0)&&(g(1000) === 0))){
  // Determine radii for the enclosing circles
  const radiusStart = globalRotationAxis === XAXIS ? Math.abs(f(cutoffMin)) : cutoffMin;
  const radiusEnd = globalRotationAxis === XAXIS ? Math.abs(f(cutoffMax)) : cutoffMax;
  if(globalRotationAxis==1){
    const startCircle = drawEnclosingCircle(radiusStart, f(cutoffMin), globalRotationAxis, 0xff0000); // Red circle at the start
    const endCircle = drawEnclosingCircle(radiusEnd, f(cutoffMax), globalRotationAxis, 0x0000ff); // Blue circle at the end
  } else{
    const startCircle = drawEnclosingCircle(radiusStart, cutoffMin, globalRotationAxis, 0xff0000); // Red circle at the start
    const endCircle = drawEnclosingCircle(radiusEnd, cutoffMax, globalRotationAxis, 0x0000ff); // Blue circle at the end
  }
  // Draw enclosing circles at the beginning and end of the parametric geometry
}
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

