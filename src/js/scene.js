import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { FisheyeShader } from './Fisheye_kb.js'

const IS_PUPPETEER = navigator.userAgent.indexOf('puppeteer') !== -1;

let camera, scene, renderer;
let composer;
let mesh;
const AMOUNT = 4;
let total_frame = 50;

document.addEventListener('DOMContentLoaded', async function () {
  if(IS_PUPPETEER){
    const fromServer = await fetch('http://localhost:3000/frame', {method:'GET'})
    .then(function(response) {
      return response.json()
    })
    .then(function(responseJson) {
      return responseJson.frame
    })

    total_frame = fromServer;
  }

  init();
  animate();
});


function init() {

  const ASPECT_RATIO = window.innerWidth / window.innerHeight;

  const WIDTH = ( window.innerWidth / AMOUNT ) * window.devicePixelRatio;
  const HEIGHT = ( window.innerHeight / AMOUNT ) * window.devicePixelRatio;

  const cameras = [];

  for ( let y = 0; y < AMOUNT; y ++ ) {

    for ( let x = 0; x < AMOUNT; x ++ ) {

      const subcamera = new THREE.PerspectiveCamera( 40, ASPECT_RATIO, 0.1, 10 );
      subcamera.viewport = new THREE.Vector4( Math.floor( x * WIDTH ), Math.floor( y * HEIGHT ), Math.ceil( WIDTH ), Math.ceil( HEIGHT ) );
      subcamera.position.x = ( x / AMOUNT ) - 0.5;
      subcamera.position.y = 0.5 - ( y / AMOUNT );
      subcamera.position.z = 1.5;
      subcamera.position.multiplyScalar( 2 );
      subcamera.lookAt( 0, 0, 0 );
      subcamera.updateMatrixWorld();
      cameras.push( subcamera );

    }

  }

  camera = new THREE.ArrayCamera( cameras );
  camera.position.z = 3;

  scene = new THREE.Scene();

  scene.add( new THREE.AmbientLight( 0x222244 ) );

  const light = new THREE.DirectionalLight();
  light.position.set( 0.5, 0.5, 1 );
  light.castShadow = true;
  light.shadow.camera.zoom = 4; // tighter shadow map
  scene.add( light );

  const geometryBackground = new THREE.PlaneGeometry( 100, 100 );
  const materialBackground = new THREE.MeshPhongMaterial( { color: 0x000066 } );

  const background = new THREE.Mesh( geometryBackground, materialBackground );
  background.receiveShadow = true;
  background.position.set( 0, 0, - 1 );
  scene.add( background );

  const geometryCylinder = new THREE.CylinderGeometry( 0.5, 0.5, 1, 32 );
  const materialCylinder = new THREE.MeshPhongMaterial( { color: 0xff0000 } );

  mesh = new THREE.Mesh( geometryCylinder, materialCylinder );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add( mesh );

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  document.body.appendChild( renderer.domElement );

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let effect1 = new ShaderPass(FisheyeShader);
  effect1.uniforms['h_fov'].value = 100;
  composer.addPass(effect1);

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  const ASPECT_RATIO = window.innerWidth / window.innerHeight;
  const WIDTH = ( window.innerWidth / AMOUNT ) * window.devicePixelRatio;
  const HEIGHT = ( window.innerHeight / AMOUNT ) * window.devicePixelRatio;

  camera.aspect = ASPECT_RATIO;
  camera.updateProjectionMatrix();

  for ( let y = 0; y < AMOUNT; y ++ ) {

    for ( let x = 0; x < AMOUNT; x ++ ) {

      const subcamera = camera.cameras[ AMOUNT * y + x ];

      subcamera.viewport.set(
        Math.floor( x * WIDTH ),
        Math.floor( y * HEIGHT ),
        Math.ceil( WIDTH ),
        Math.ceil( HEIGHT ) );

      subcamera.aspect = ASPECT_RATIO;
      subcamera.updateProjectionMatrix();

    }

  }

  renderer.setSize( window.innerWidth, window.innerHeight );

}

var count = 0;

async function animate() {

  mesh.rotation.x += 0.005;
  mesh.rotation.z += 0.01;

  if(IS_PUPPETEER){
    await composer.render();

    // await renderer.render( scene, camera );
    if(count < total_frame){
      saveFrame();
      count += 1;
    }
    else{
      console.log("DONE");
    }
  }
  else{
    composer.render();
  }

  requestAnimationFrame( animate );

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
  }).catch(err => {})
}