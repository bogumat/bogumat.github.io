// Function to create and animate 3D object in a specified div
function createAndAnimateObject(containerId) {
  // Initialize scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(350, 350);
  renderer.setClearColor(0xffffff);

  const container = document.getElementById(containerId);
  container.appendChild(renderer.domElement);

  // Create geometry and material for the cube
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Position the camera  
  camera.position.z = 5;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene
    renderer.render(scene, camera);
  }

  // Start the animation loop
  animate();
}

// Call the function to create and animate the 3D object in the specified divs
createAndAnimateObject("canvas-container");
createAndAnimateObject("canvas-container2");
