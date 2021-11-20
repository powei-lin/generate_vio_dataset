import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { FisheyeEquidistantShader } from './shader/FisheyeShaders'
import { MathUtils } from 'three';

const IS_PUPPETEER = navigator.userAgent.indexOf('puppeteer') !== -1;

let camera, scene, renderer;
let composer;
let mesh;
const AMOUNT = 4;
let total_frame = 50;
let setting;

document.addEventListener('DOMContentLoaded', async function () {
  if (IS_PUPPETEER) {
    const parameters = await fetch('http://localhost:3000/parameters', { method: 'GET' })
      .then(function (response) {
        return response.json()
      })
      .then(function (responseJson) {
        return responseJson;
      })
    total_frame = parameters.total_frame_number;
  }
  else {
    setting = await fetch("config/setting.json")
      .then(response => response.json())
      .then(json => { return json });
  }
  // console.log(setting);

  init();
  animate();
});


function init() {

  const ASPECT_RATIO = window.innerWidth / window.innerHeight;

  const WIDTH = (window.innerWidth / AMOUNT) * window.devicePixelRatio;
  const HEIGHT = (window.innerHeight / AMOUNT) * window.devicePixelRatio;

  camera = new THREE.PerspectiveCamera(40, ASPECT_RATIO, 0.1, 10000);
  camera.position.z = 3;

  scene = new THREE.Scene();


  const loader = new SVGLoader();

  // load a SVG resource
  loader.load(
    // resource URL
    setting.board.file_path,
    // called when the resource is loaded
    function (data) {

      const paths = data.paths;
      const group = new THREE.Group();

      for (let i = 0; i < paths.length; i++) {

        const path = paths[i];

        const material = new THREE.MeshBasicMaterial({
          color: path.color,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        const shapes = SVGLoader.createShapes(path);

        for (let j = 0; j < shapes.length; j++) {

          const shape = shapes[j];
          const geometry = new THREE.ShapeGeometry(shape);
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);

        }

      }
      const rotations = setting.board.rotateXYZ_deg;
      const translations = setting.board.translateXYZ_mm;
      group.rotateX(MathUtils.degToRad(rotations[0]));
      group.rotateY(MathUtils.degToRad(rotations[1]));
      group.rotateZ(MathUtils.degToRad(rotations[2]));
      group.translateX(translations[0]);
      group.translateY(translations[1]);
      group.translateZ(translations[2]);

      scene.add(group);

    },
    // called when loading is in progresses
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

      console.log('An error happened');

    }
  );


  scene.add(new THREE.AmbientLight(0x222244));

  const light = new THREE.DirectionalLight();
  light.position.set(0.5, 0.5, 1);
  light.castShadow = true;
  light.shadow.camera.zoom = 4; // tighter shadow map
  scene.add(light);

  const geometryBackground = new THREE.PlaneGeometry(100, 100);
  const materialBackground = new THREE.MeshPhongMaterial({ color: 0x000066 });

  const background = new THREE.Mesh(geometryBackground, materialBackground);
  background.receiveShadow = true;
  background.position.set(0, 0, - 1);
  scene.add(background);

  const geometryCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  const materialCylinder = new THREE.MeshPhongMaterial({ color: 0xff0000 });

  mesh = new THREE.Mesh(geometryCylinder, materialCylinder);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let effect1 = new ShaderPass(FisheyeEquidistantShader);
  effect1.uniforms['h_fov'].value = 100;
  composer.addPass(effect1);

  const controls = new OrbitControls( camera, renderer.domElement );

  window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

  const ASPECT_RATIO = window.innerWidth / window.innerHeight;
  const WIDTH = (window.innerWidth / AMOUNT) * window.devicePixelRatio;
  const HEIGHT = (window.innerHeight / AMOUNT) * window.devicePixelRatio;

  camera.aspect = ASPECT_RATIO;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

var count = 0;

async function animate() {

  mesh.rotation.x += 0.005;
  mesh.rotation.z += 0.01;

  if (IS_PUPPETEER) {

    // await renderer.render( scene, camera );
    if (count < total_frame) {
      await composer.render();
      await saveFrame();
      count += 1;
    }
    else {
      console.log("DONE");
    }
  }
  else {
    composer.render();
  }

  requestAnimationFrame(animate);

}

async function saveFrame() {
  const img = renderer.domElement.toDataURL()

  const body = JSON.stringify({ img, frame: count })
  console.log("save");
  await fetch('http://localhost:3000', {
    body,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch(err => { console.log(err) })
}