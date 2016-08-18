"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Basic Head Structure: bust
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, $, document, window, dat*/
var camera, scene, renderer, cameraControls, effectController, gui;
var clock = new THREE.Clock();
var lights = [];
var state = { restart: false };
var Alice, Bob;
var mInit = 500;
var kInit = 100;
var bInit = 15;
var VIEW_SCALE = 0.8;

function init() {
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;
    var canvasRatio = canvasWidth / canvasHeight;

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setSize(VIEW_SCALE*canvasWidth, VIEW_SCALE*canvasHeight);
    renderer.setClearColor(0xAAAAAA, 1.0);
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x808080, 2000, 4000);
    setLights();

    // CAMERA
    camera = new THREE.PerspectiveCamera(30, canvasRatio, 1, 10000);
    camera.position.set(-61, 34, 10);

    // CONTROLS
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 10, 0);

    // adjusting view when resizing window
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(VIEW_SCALE*canvasWidth, VIEW_SCALE*canvasHeight);
    }, false);

    // Alice
    Alice = new THREE.Object3D();
    var aliceSphere = new THREE.Mesh(new THREE.SphereGeometry( 5, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0xff0000} ));
    Alice.m = mInit;
    Alice.k = kInit;
    Alice.b = bInit;
    Alice.add(aliceSphere);
    Alice.velocity = V3(5,5,5);
    scene.add(Alice);
    
    // Bob
    Bob = new THREE.Object3D();
    var bobSphere = new THREE.Mesh(new THREE.SphereGeometry( 5, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x00ffff} ));
    Bob.m = mInit;
    Bob.k = kInit;
    Bob.b = bInit;
    Bob.add(bobSphere);
    Bob.velocity = V3(0,0,0);
    scene.add(Bob);
}

function render() {
    var delta = clock.getDelta();
    //log(delta);
    cameraControls.update(delta);
    var time = Date.now()*0.001;
    var currPos = updatePosition(Alice, Bob, delta);
    var currVel = updateVelocity(Alice, Bob, delta);
    Alice.position.x = currPos.x;
    Alice.position.y = currPos.y;
    Alice.position.z = currPos.z;
    //log(Alice.position);
    Alice.velocity = currVel;
    //log(Alice.velocity);
}

function getC0(m, k, b, delta){ return (1-k*delta*delta/(2*m)); }
function getC1(m, k, b, delta){ return k*delta*delta/(2*m); }
function getC2(m, k, b, delta){ return (delta-b*delta*delta/(2*m)); }
function getC3(m, k, b, delta){ return b*delta*delta/(2*m); }
function getC4(m, k, b, delta){ return -k*delta/m; }
function getC5(m, k, b, delta){ return k*delta/m; }
function getC6(m, k, b, delta){ return (1-b*delta/m); }
function getC7(m, k, b, delta){ return b*delta/m; }

function updatePosition(p, q, delta){
    var c0 = getC0(p.m, p.k, p.b, delta);
    var c1 = getC1(p.m, p.k, p.b, delta);
    var c2 = getC2(p.m, p.k, p.b, delta);
    var c3 = getC3(p.m, p.k, p.b, delta);
    var px = c0*p.position.x+c1*q.position.x+c2*p.velocity.x+c3*q.velocity.x;
    var py = c0*p.position.y+c1*q.position.y+c2*p.velocity.y+c3*q.velocity.y;
    var pz = c0*p.position.z+c1*q.position.z+c2*p.velocity.z+c3*q.velocity.z;
    return V3(px, py, pz);
}

function updateVelocity(p, q, delta){
    var c4 = getC4(p.m, p.k, p.b, delta);
    var c5 = getC5(p.m, p.k, p.b, delta);
    var c6 = getC6(p.m, p.k, p.b, delta);
    var c7 = getC7(p.m, p.k, p.b, delta);
    var vx = c4*p.position.x+c5*q.position.x+c6*p.velocity.x+c7*q.velocity.x;
    var vy = c4*p.position.y+c5*q.position.y+c6*p.velocity.y+c7*q.velocity.y;
    var vz = c4*p.position.z+c5*q.position.z+c6*p.velocity.z+c7*q.velocity.z;
    return V3(vx, vy, vz);
}

function animate() {
    window.requestAnimationFrame(animate);
    render();
    renderer.render(scene, camera);
}

function setupGui() {
    gui = new dat.GUI();
    var folder = gui.addFolder("Bob Location");
    folder.add(Bob.position, "x", -50, 50);
    folder.__controllers[0].name("position");
    folder = gui.addFolder("Constants");
    folder.add(Alice, 'm', .01, Alice.m+1000);
    folder.add(Alice, 'k', .01, Alice.k+1000);
    folder.add(Alice, 'b', .01, Alice.b+1000);
    folder.__controllers[0].name(".m");
    folder.__controllers[1].name(".k");
    folder.__controllers[2].name(".b");
}

function setLights() {
    // LIGHTS
    var ambientLight = new THREE.AmbientLight(0x222222);
    var light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 40, 50);
    var light2 = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light2.position.set(-50, 25, -20);
    scene.add(ambientLight);
    scene.add(light);
    scene.add(light2);
}

// wrapper functions
function V3(x,y,z){ return new THREE.Vector3(x,y,z);}
function V4(x,y,z,w){ return new THREE.Vector4(x,y,z,w);}
function F3(x,y,z){ return new THREE.Face3(x,y,z);}
function log(check){ window.console.log(check);}

if (true){
    try {
        init();
        setupGui();
        animate();
    }
    catch (e) {
        var errorReport = "program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
        $('#container').append(errorReport + e);
    }
} else {
    init();
    fillScene();
    setupGui();
    animate();
}