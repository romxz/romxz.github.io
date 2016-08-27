"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Basic Head Structure: bust
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, $, document, window, dat*/
var camera, scene, renderer, cameraControls, effectController, gui;
var clock = new THREE.Clock();
var lights = [];
var state = { restart: false };
var Alice, Bob, Carl, Dan, Swag, Yolo2;
var aliceRad = 5, bobRad = 5;
var mInit = 200//10;
var kInit = 100//10;
var bInit = 0//20;
var c = 100;
var maxDistance = 30;
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
    renderer.setClearColor(0xF0F8FF, 1.0);
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x808080, 2000, 4000);
    setLights();

    // CAMERA
    camera = new THREE.PerspectiveCamera(65, canvasRatio, 1, 10000);
    camera.position.set(-10, 100, 100);

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
    var aliceSphere = new THREE.Mesh(new THREE.SphereGeometry( aliceRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0xff0000} ));
    Alice.m = mInit;
    Alice.k = kInit;
    Alice.b = bInit;
    Alice.add(aliceSphere);
    Alice.position.x = 20;
    Alice.velocity = V3(5,5,5);
    scene.add(Alice);

    // Bob
    Bob = new THREE.Object3D();
    var bobSphere = new THREE.Mesh(new THREE.SphereGeometry( bobRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x0000ff} ));
    Bob.m = mInit;
    Bob.k = kInit;
    Bob.b = bInit;
    Bob.add(bobSphere);
    Bob.velocity = V3(0,0,0);
    scene.add(Bob);
    
    var length_yolo = 50;
    var length_swag = 100;
    
    // Carl
    Carl = new THREE.Object3D();
    var carlSphere = new THREE.Mesh(new THREE.SphereGeometry( bobRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x00ffff} ));
    Carl.m = mInit;
    Carl.k = kInit;
    Carl.b = bInit;
    Carl.add(carlSphere);
    Carl.position.x = -length_swag ;
    Carl.velocity = V3(0,0,0);
    scene.add(Carl);
    
    //Dan
    Dan = new THREE.Object3D();
    var danSphere = new THREE.Mesh(new THREE.SphereGeometry( bobRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x00ff00} ));
    Dan.m = mInit;
    Dan.k = kInit;
    Dan.b = bInit;
    Dan.add(danSphere);
    Dan.position.x = -length_swag + 20;
    Dan.velocity = V3(5,5,5);
    scene.add(Dan);
    
    
    Yolo2 = new THREE.Mesh(new THREE.CylinderGeometry(aliceRad+1, aliceRad+1, length_yolo + 2*Alice.position.x  , 32 ), new THREE.MeshBasicMaterial( {color: 0xff62f0,  transparent: true, opacity: 0.75} ));
    Yolo2.rotateZ(Math.PI/2.0);
    Yolo2.position.x = length_yolo/2;
    scene.add(Yolo2);
    
    Swag = new THREE.Mesh(new THREE.CylinderGeometry(aliceRad+1, aliceRad+1, length_swag , 32 ), new THREE.MeshBasicMaterial( {color: 0xffff00,  transparent: true, opacity: 0.5} ));
    Swag.rotateZ(Math.PI/2.0);
    Swag.position.x = Alice.position.x - length_swag/2;
    scene.add(Swag);
}

    

function render() {
    var delta = clock.getDelta();
    delta = Math.min(delta, 1);
    //log(delta);
    if(delta <1){
        cameraControls.update(delta);
        //var time = Date.now()*0.001;
        // Alice and Dan update
        var currPosx = updatePosition(Alice, Bob, delta);
        var currVelx = updateVelocity(Alice, Bob, delta);
        var currPosy = updatePosition(Dan, Carl, delta);
        var currVely = updateVelocity(Dan, Carl, delta);
        Alice.position.x = currPosx;
        Alice.velocity.x = currVelx;
        Dan.position.x = currPosy;
        Dan.velocity.x = currVely;
        // Yolo 2 Update
        var length1 = 70 - currPosx;
        Yolo2.position.x =  - (length1/2 - 70);
        Yolo2.scale.y = length1/90;
        // Swag Update
        var length2 = currPosx - currPosy;
        Swag.position.x = currPosx - length2/2; 
        Swag.scale.y = length2/100;
        
    }
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
    var ppx = p.position.x, ppy = p.position.y, ppz = p.position.z;
    var qqx = q.position.x, qqy = q.position.y, qqz = q.position.z;
    var px = c0*ppx+c1*qqx+c2*p.velocity.x+c3*q.velocity.x;
    return px;
}

function updateVelocity(p, q, delta){
    var c4 = getC4(p.m, p.k, p.b, delta);
    var c5 = getC5(p.m, p.k, p.b, delta);
    var c6 = getC6(p.m, p.k, p.b, delta);
    var c7 = getC7(p.m, p.k, p.b, delta);
    var vx = c4*p.position.x+c5*q.position.x+c6*p.velocity.x+c7*q.velocity.x;
    return vx;
}

function getf0(m, k, b, delta){ return 1; }
function getf1(m, k, b, delta){ return delta; }
function getf2(m, k, b, delta){ return k*delta*delta/(2*m); }
function getf3(m, k, b, delta){ return -k*delta*delta/m; }
function getf4(m, k, b, delta){ return k*delta*delta/(2*m); }
function getf5(m, k, b, delta){ return 1; }
function getf6(m, k, b, delta){ return k*delta/m; }
function getf7(m, k, b, delta){ return -2*k*delta/m; }
function getf8(m, k, b, delta){ return k*delta/m; }

function updatePosition2(p, q, delta){
    var f0 = getf0(p.m, p.k, p.b, delta);
    var f1 = getf1(p.m, p.k, p.b, delta);
    var f2 = getf2(p.m, p.k, p.b, delta);
    var f3 = getf3(p.m, p.k, p.b, delta);
    var f4 = getf4(p.m, p.k, p.b, delta);
    var ppx = p.position.x;
    var qqx = q.position.x;
    var h = -(ppx - qqx);
    var px = f0*ppx+f1*p.velocity.x+f2*ppx*ppx*s(h)+f3*ppx*qqx*s(h)+f4*qqx*qqx*s(h);
    log('px: '); log(px);
    log('s(h): '); log(s(h));
    return px;
}

function updateVelocity2(p, q, delta){
    var f5 = getf5(p.m, p.k, p.b, delta);
    var f6 = getf6(p.m, p.k, p.b, delta);
    var f7 = getf7(p.m, p.k, p.b, delta);
    var f8 = getf8(p.m, p.k, p.b, delta);
    var ppx = p.position.x;
    var qqx = q.position.x;
    var h = -(ppx - qqx);
    var vx = f5*p.velocity.x+f6*ppx*ppx*s(h)+f7*ppx*qqx*s(h)+f8*qqx*qqx*s(h);
    log('vx: '); log(vx);
    return vx;
}

function s(h){
    if (h>=0){
        return 1;
    }
    else{
        return -1;
    }
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
function dist3(V3a, V3b){
    var vx = V3a.x, vy = V3a.y, vz = V3a.z;
    var ux = V3b.x, uy = V3b.y, uz = V3b.z;
    return Math.sqrt((vx-ux)*(vx-ux)+(vy-uy)*(vy-uy)+(vz-uz)*(vz-uz));
}

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