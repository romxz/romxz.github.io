"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Basic Head Structure: bust
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, $, document, window, dat*/
var camera, scene, renderer, cameraControls, effectController, gui;
var clock = new THREE.Clock();
var lights = [];
var state = { restart: false };
var Alice, Bob, Carl, Eve;
var aliceRad = 9, bobRad = 10, carlRad = 9.5, eveRad = 8.5;
var mInit = 20;
var kInit = 1400;
var bInit = 0;
var c = 100;
var maxDistance = 30;
var eveFollowAlice = true;
var VIEW_SCALE = 0.8;
var tailObjects = [[], []];
var tailSegments = 30;
var tailIndex = 0;
var environment = {heat: 5};

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
    camera.position.set(-100, 100, 100);

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
    var aliceSphere = new THREE.Mesh(new THREE.SphereGeometry( aliceRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0xff0000, transparent: true, opacity: 0.8} ));
    Alice.m = mInit;
    Alice.k = kInit;
    Alice.b = bInit;
    Alice.add(aliceSphere);
    Alice.position.x = 1;
    Alice.velocity = V3(5*aliceRad,5*aliceRad,5*aliceRad);
    scene.add(Alice);

    // Bob
    Bob = new THREE.Object3D();
    //MeshLambertMaterial({color: 0x0000ff, transparent: true, opacity: 0.5});
    var bobSphere = new THREE.Mesh(new THREE.SphereGeometry( bobRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x0000ff, transparent: true, opacity: 0.8} ));
    Bob.add(bobSphere);
    Bob.m = mInit;
    Bob.k = kInit;
    Bob.b = bInit;
    Bob.velocity = V3(0,0,0);
    scene.add(Bob);
    
    // Carl
    Carl = new THREE.Object3D();
    //MeshLambertMaterial({color: 0x0000ff, transparent: true, opacity: 0.5});
    var carlSphere = new THREE.Mesh(new THREE.SphereGeometry( carlRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x00ffff, transparent: true, opacity: 0.2} ));
    Carl.add(carlSphere);
    Carl.m = mInit/10;
    Carl.k = kInit*2;
    Carl.b = bInit*10;
    Carl.velocity = V3(-carlRad,-carlRad,-carlRad);
    scene.add(Carl);

    // Eve
    Eve = new THREE.Object3D();
    var eveSphere = new THREE.Mesh(new THREE.SphereGeometry( eveRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0xff00ff} ));
    Eve.m = mInit/10;
    Eve.k = kInit*2;
    Eve.b = bInit/3;
    Eve.add(eveSphere);
    Eve.velocity = V3(50*eveRad,-20*eveRad,-15*eveRad);
    scene.add(Eve);
    
    // Tails
    var tailObject;
    var tailSphere; 
    var tailPosition;
    var tailRad;
    // Eve's tail
    var tailColor = new THREE.Color();
    for (var i = 0; i < tailSegments; i++){
        // hacky function for curvy radiuses
        tailRad = eveRad*Math.exp(-Math.pow(2*(i-tailSegments/2)/tailSegments,2));
        tailColor.setRGB(1-i*0.5/tailSegments,i*0.5/tailSegments,1-i*0.5/tailSegments);
        tailSphere = new THREE.Mesh(new THREE.SphereGeometry(tailRad, 32, 32), new THREE.MeshBasicMaterial({color:tailColor.getHex(), transparent: true, opacity: 0.2}));
        tailObject = new THREE.Object3D();
        tailObject.add(tailSphere);
        tailObject.position.copy(Eve.position);
        scene.add(tailObject);
        tailObjects[0].push(tailObject);                                                                       
    }
    // Carl's tail
    tailColor = new THREE.Color();
    for (var i = 0; i < tailSegments; i++){
        // hacky function for curvy radiuses
        tailRad = carlRad*Math.exp(-Math.pow(2*(i-tailSegments/2)/tailSegments,2));
        tailColor.setRGB(i*0.5/tailSegments,1-i*0.5/tailSegments, 1-i*0.5/tailSegments);
        tailSphere = new THREE.Mesh(new THREE.SphereGeometry(tailRad, 32, 32), new THREE.MeshBasicMaterial({color:tailColor.getHex(), transparent: true, opacity: 0.2}));
        tailObject = new THREE.Object3D();
        tailObject.add(tailSphere);
        tailObject.position.copy(Carl.position);
        scene.add(tailObject);
        tailObjects[1].push(tailObject);                                                                       
    }
}

function render() {
    var delta = clock.getDelta();
    delta = Math.min(delta, 1);
    //log(delta);
    if(delta <1){
        cameraControls.update(delta);
        //var time = Date.now()*0.001;
        
        // Position updates
        var currPos, currVel;
        
        // Eve update
        var eve2Alice = dist3(Eve.position, Alice.position);
        var eve2Bob = dist3(Eve.position, Bob.position);
        if (1.3*eve2Alice < eve2Bob){
            eveFollowAlice = true;
        } else {
            eveFollowAlice = false;
        }
        var currPos, curVel;
        if (eveFollowAlice == true){
            currPos = updatePosition(Eve, Alice, delta);
            currVel = updateVelocity(Eve, Alice, delta);
        } else {
            currPos = updatePosition(Eve, Bob, delta);
            currVel = updateVelocity(Eve, Bob, delta);
        }
        Eve.position.x = currPos.x;
        Eve.position.y = currPos.y;
        Eve.position.z = currPos.z;
        Eve.velocity = currVel;
        
        // Alice update
        currPos = updatePosition(Alice, Bob, delta);
        currVel = updateVelocity(Alice, Bob, delta);
        Alice.position.x = currPos.x;
        Alice.position.y = currPos.y;
        Alice.position.z = currPos.z;
        Alice.velocity = currVel;
        
        // Carl update
        currPos = updatePosition(Carl, Bob, delta);
        currVel = updateVelocity(Carl, Bob, delta);
        Carl.position.x = currPos.x;
        Carl.position.y = currPos.y;
        Carl.position.z = currPos.z;
        Carl.velocity = currVel;
        
        // Tail update
        tailObjects[0][tailIndex].position.copy(Eve.position);
        tailObjects[1][tailIndex].position.copy(Carl.position);
        tailIndex += 1;
        tailIndex = tailIndex % tailSegments;
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
    var py = c0*ppy+c1*qqy+c2*p.velocity.y+c3*q.velocity.y;
    var pz = c0*ppz+c1*qqz+c2*p.velocity.z+c3*q.velocity.z;
    var ppos = V3(px, py, pz);
    var qpos = q.position.clone();
    var disp = V3(0,0,0).subVectors(ppos, qpos);
    var dist = disp.length;
    if (dist > maxDistance){
        disp.multiplyScalar(maxDistance/(dist+1));
        ppos.addVectors(qpos, disp);
    }
    return ppos;
}

function updateVelocity(p, q, delta){
    var c4 = getC4(p.m, p.k, p.b, delta);
    var c5 = getC5(p.m, p.k, p.b, delta);
    var c6 = getC6(p.m, p.k, p.b, delta);
    var c7 = getC7(p.m, p.k, p.b, delta);
    var vx = c4*p.position.x+c5*q.position.x+c6*p.velocity.x+c7*q.velocity.x+environment.heat*Math.random();
    var vy = c4*p.position.y+c5*q.position.y+c6*p.velocity.y+c7*q.velocity.y+environment.heat*Math.random();
    var vz = c4*p.position.z+c5*q.position.z+c6*p.velocity.z+c7*q.velocity.z+environment.heat*Math.random();
    // limiting speed:
    var vel = V3(vx,vy,vz);
    var speed = vel.length();
    if (speed > c){
        vel.multiplyScalar(c/(speed+1));
    }
    return vel;
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
    folder.__controllers[0].name("Position (x)");
    folder.add(Bob.position, "z", -50, 50);
    folder.__controllers[1].name("Position (y)");
    folder = gui.addFolder("Constants");
    folder.add(Alice, 'm', .01, Alice.m+2000);
    folder.add(Alice, 'k', .01, Alice.k+2000);
    folder.add(Alice, 'b', 0, 2000);
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