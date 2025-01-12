import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { ParametricGeometry } from "three/examples/jsm/Addons.js";


function f(x) {
  return x**2;
}

function g(x) {
  return 0;
}

const XAXIS = 0;
const YAXIS = 1;

const cutoffMax = 0.1; //Bounds
const cutoffMin = -0.1; // You must set this to greater than 0 for logarithmic functions
let globalRotationAxis = 1; // Can be 0 for x axis and 1 for y axis


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

function findIntersectionPoints(func1, func2, start, end, step) {
  if (((func1(0) === 0)&&(func1(1000) === 0)) || ((func2(0) === 0)&&(func2(1000) === 0))) {
    return [0]; // Special case when f(x) = 0 or g(x) = 0
  }

  const intersections = [];
  for (let x = -start; x <= end; x += step) {
    if (Math.abs(func1(x) - func2(x)) < 0.01) {
      if (!intersections.some(val => Math.abs(val - x) < 0.1)) {
        intersections.push(x);
      }
    }
  }
  return intersections;
}

const intersection1 = findIntersectionPoints(f,g, 10, 10, 0.0001)
let min = Math.min(...intersection1);
let max = Math.max(...intersection1);


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


//  console.log(intersection1);

const parametricMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const parametricMaterial2 = new THREE.LineBasicMaterial({ color: 0x0000ff});
const parametricCurve1 = new ParametricGeometry(generateParametricCurve(f, min, max, globalRotationAxis), 100, 100);
const parametricCurve2 = new ParametricGeometry(generateParametricCurve(g, min, max, globalRotationAxis), 100, 100);
const curveparam = new THREE.Line(parametricCurve1, parametricMaterial)
const curveparam2 = new THREE.Line(parametricCurve2, parametricMaterial2)



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
    Number( x.toPrecision(10) )
    const y1 = func1(x); // First function
    const y2 = func2(x); // Second function

    // Determine which function is on top and which is on the bottom
    const topY = Math.max(y1, y2);
    const bottomY = Math.min(y1, y2);

    curvePoints1.push(new THREE.Vector3(x, y1, 0)); // Points for the first curve
    curvePoints2.push(new THREE.Vector3(x, y2, 0)); // Points for the second curve

    // Add the points for the fill area
    if (globalRotationAxis === 1 && ((g(1000) == 0) || f(1000) == 0)) {
      // If one function is zero, draw the area from the non-zero function to the y-axis
      const nonZeroFunc = g(1000) == 0 ? f : g; // Determine the non-zero function
      const yValue = nonZeroFunc(x); // Get the value of the non-zero function at x
      fillPoints.push(new THREE.Vector2(0, yValue)); // Top boundary: Point on the non-zero function
      fillPoints.unshift(new THREE.Vector2(x, yValue)); // Bottom boundary: Corresponding point on the y-axis
    }
     else {
      fillPoints.push(new THREE.Vector2(x, topY)); // Top boundary
      fillPoints.unshift(new THREE.Vector2(x, bottomY)); // Bottom boundary
   }
  } 
  console.log(intersection1)
  // Draw the first curve
  const curveGeometry1 = new THREE.BufferGeometry().setFromPoints(curvePoints1);
  const curveMaterial1 = new THREE.LineBasicMaterial({ color: color1 });
  const curveLine1 = new THREE.Line(curveGeometry1, curveMaterial1);

  // Draw the second curve
  const curveGeometry2 = new THREE.BufferGeometry().setFromPoints(curvePoints2);
  const curveMaterial2 = new THREE.LineBasicMaterial({ color: color2 });
  const curveLine2 = new THREE.Line(curveGeometry2, curveMaterial2);

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

function createOpenEndedCylinder(radiusTop, radiusBottom, bottomLocation, topLocation, radialSegments = 32, color = 0xff0000) {
  // Calculate height and cylinder direction
  const height = new THREE.Vector3()
    .subVectors(topLocation, bottomLocation)
    .length(); // Distance between top and bottom
  
  const cylinderGeometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    1, // One height segment
    true // Open-ended cylinder (no caps)
  );

  // Create material
  const cylinderMaterial = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    side: THREE.DoubleSide, // Ensure both sides of the surface are visible
    opacity: 0.5, // Set the opacity to 50%
  transparent: true, // Allow the material to be transparent
  });

  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

  // Position the cylinder's midpoint
  const midpoint = new THREE.Vector3()
    .addVectors(topLocation, bottomLocation)
    .multiplyScalar(0.5);
  cylinder.position.set(midpoint.x, midpoint.y, midpoint.z);

  // Align the cylinder with the vector between bottomLocation and topLocation
  const direction = new THREE.Vector3()
    .subVectors(topLocation, bottomLocation)
    .normalize();
  const axis = new THREE.Vector3(0, 1, 0); // Default cylinder points along y-axis
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
  cylinder.setRotationFromQuaternion(quaternion);

  return cylinder;
}

if(intersection1.length<2 && globalRotationAxis==1 && g(1000) != 0){
  let bottomLocation;
  let topLocation;
  let bottomLocationFinal;
  let topLocationFinal;
  if(f(cutoffMin)>g(cutoffMin)){
    bottomLocation = new THREE.Vector3(0, g(cutoffMin), 0);
    topLocation = new THREE.Vector3(0, f(cutoffMin), 0);
  } else{
    bottomLocation = new THREE.Vector3(0, f(cutoffMin), 0);
    topLocation = new THREE.Vector3(0, g(cutoffMin), 0);
  }
  if(f(cutoffMax)>g(cutoffMax)){
    bottomLocationFinal = new THREE.Vector3(0, g(cutoffMax), 0);
    topLocationFinal = new THREE.Vector3(0, f(cutoffMax), 0); 
  } else{
    bottomLocationFinal = new THREE.Vector3(0, f(cutoffMax), 0);
    topLocationFinal = new THREE.Vector3(0, g(cutoffMax), 0); 
  }

// Create the cylinder
  const openCylinder = createOpenEndedCylinder(cutoffMin, cutoffMin, bottomLocation, topLocation, 64, 0x42f5cb);
  const openCylinderFinal = createOpenEndedCylinder(cutoffMax, cutoffMax, bottomLocationFinal, topLocationFinal, 64, 0x42f5cb);

  // Add it to the scene
  scene.add(openCylinder);
  scene.add(openCylinderFinal)
}

function createRing(outerRadius, innerRadius, color = 0xff0000, opacity = 0.5, location) {
  // Create a shape for the outer circle
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

  // Add a hole for the inner circle
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  // Create geometry and material
  const geometry = new THREE.ShapeGeometry(shape, 256);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: opacity,
  });

    // Create the mesh
    const ring = new THREE.Mesh(geometry, material);

    if (globalRotationAxis === 0){
      ring.rotation.y = Math.PI / 2;
      ring.position.x = location;
    } else {
      ring.rotation.x = Math.PI / 2;
      ring.position.y = location;
    }
    return ring;
}

if(globalRotationAxis === 0 && intersection1.length < 2){
  if(Math.abs(f(cutoffMin))>Math.abs(g(cutoffMin))){
    const ringMesh = createRing(f(cutoffMin), g(cutoffMin), 0x00ff00, 0.7, cutoffMin); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh);

  } else {
    const ringMesh = createRing(g(cutoffMin), f(cutoffMin), 0x00ff00, 0.7, cutoffMin); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh);

  }
  if(Math.abs(f(cutoffMax))>Math.abs(g(cutoffMax))){
    const ringMesh = createRing(f(cutoffMax), g(cutoffMax), 0x00ff00, 0.7, cutoffMax); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh);
  } else {
    const ringMesh = createRing(g(cutoffMax), f(cutoffMax), 0x0000ff, 0.7, cutoffMax); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh);
    
  }
}

if (globalRotationAxis === 1 && intersection1.length < 2 && g(1000) === 0){
  if(f(cutoffMax)-f(cutoffMin)===0){
    const ringMesh = createRing(cutoffMax, 0, 0x00ff00, 0.7, f(cutoffMax)); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh);
  } else {
    const ringMesh = createRing(cutoffMax, 0, 0x00ff00, 0.7, f(cutoffMax)); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh);
    const ringMesh2 = createRing(cutoffMin, 0, 0x00ff00, 0.7, f(cutoffMin)); // Outer radius: 2, Inner radius: 1
    scene.add(ringMesh2);
  }
}

scene.add(axesHelper);
scene.add(curveLine1);
scene.add(curveLine2);
if(!((f(0) === 0)&&(f(1000) === 0))){
  scene.add(curveparam)
}
if(!((g(0) === 0)&&(g(1000) === 0))){
  scene.add(curveparam2)
}


function animate() {
  if (filledArea) {
    if (globalRotationAxis === XAXIS) filledArea.rotation.x += 0.02;
    if (globalRotationAxis === YAXIS) filledArea.rotation.y += 0.02;
  }

  if (curveLine1) {
    if (globalRotationAxis === XAXIS) curveLine1.rotation.x += 0.02;
    if (globalRotationAxis === YAXIS) curveLine1.rotation.y += 0.02;
  }
  if (curveLine2) {
    if (globalRotationAxis === XAXIS) curveLine2.rotation.x += 0.02;
    if (globalRotationAxis === YAXIS) curveLine2.rotation.y += 0.02;
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

