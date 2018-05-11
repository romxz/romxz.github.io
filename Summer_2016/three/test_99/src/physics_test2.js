//"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Basic Head Structure: bust
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, $, document, window, dat*/
var camera, scene, renderer, cameraControls, effectController, gui;
var clock = new THREE.Clock();
var lights = [];
//var state = { restart: false };
var Alice, Bob, Carl, Eve;
var aliceRad = 9, bobRad = 10, carlRad = 9.5, eveRad = 8.5;
var carlScale; //, carlColor, bobColor;
var invisibleVolumeFactor = 0.2;
var mInit = 500;
var kInit = 700;
var bInit = 15;
var c = 100;
var maxDistance = 200;
var eveFollowAlice = true;
var VIEW_SCALE = 0.8;
var tailObjects = [[], []];
var tailSegments = 30;
var tailIndex = 0;
var environment = {heat: 2, strongDistance: bobRad*20, gravity: 1000};

function init() {
    var canvasWidth = VIEW_SCALE*window.innerWidth;
    var canvasHeight = VIEW_SCALE*window.innerHeight;
    var canvasRatio = canvasWidth / canvasHeight;

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x111111, 1.0);
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x808080, 2000, 4000);
    setLights(); // Lights

    // CAMERA
    camera = new THREE.PerspectiveCamera(30, canvasRatio, 1, 10000);
    camera.position.set(-200, 200, 200);

    // CONTROLS
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 10, 0);

    // adjusting view when resizing window
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasWidth, canvasHeight);
    }, false);

    // Alice
    Alice = new THREE.Object3D();
    var aliceSphere = new THREE.Mesh(new THREE.SphereGeometry( aliceRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0xff0000, transparent: true, opacity: 0.9} ));
    Alice.mesh = aliceSphere;
    Alice.m = mInit;
    Alice.k = kInit;
    Alice.b = bInit;
    Alice.rad = aliceRad;
    Alice.add(aliceSphere);
    Alice.position.x = aliceRad;
    Alice.velocity = V3(5*aliceRad,5*aliceRad,5*aliceRad);
    scene.add(Alice);

    // Bob
    Bob = new THREE.Object3D();
    Bob.bobColor = new THREE.Color(0x0000ff);
    //MeshLambertMaterial({color: 0x0000ff, transparent: true, opacity: 0.5});
    var bobSphere = new THREE.Mesh(new THREE.SphereGeometry( bobRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x0000ff, transparent: true, opacity: 0.5} ));
    Bob.mesh = bobSphere;
    Bob.m = mInit;
    Bob.k = kInit;
    Bob.b = bInit;
    Bob.rad = bobRad;
    Bob.add(bobSphere);
    Bob.velocity = V3(0,0,0);
    scene.add(Bob);

    // Carl
    Carl = new THREE.Object3D();
    Carl.color = new THREE.Color(0x00ffff);
    //MeshLambertMaterial({color: 0x0000ff, transparent: true, opacity: 0.5});
    var carlSphere = new THREE.Mesh(new THREE.SphereGeometry( carlRad, 32, 32 ), new THREE.MeshLambertMaterial( {color: Carl.color.getHex(), transparent: true, opacity: 0.7} ));
    Carl.add(carlSphere);
    Carl.mesh = carlSphere;
    Carl.m = mInit/10;
    Carl.k = kInit*2;
    Carl.b = bInit*10;
    Carl.rad = carlRad;
    Carl.velocity = V3(-carlRad,-carlRad,-carlRad);
    Carl.sc = Carl.velocity.clone();
    Carl.sc.normalize();
    scene.add(Carl);

    // Eve
    Eve = new THREE.Object3D();
    var eveSphere = new THREE.Mesh(new THREE.SphereGeometry( eveRad, 32, 32 ), new THREE.MeshBasicMaterial( {color: 0x00ff00, transparent: true, opacity: 0.7} ));
    Eve.mesh = eveSphere;
    Eve.m = mInit/10;
    Eve.k = kInit*4;
    Eve.b = bInit/3;
    Eve.rad = eveRad;
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
        tailColor.setRGB(0,1-i*0.5/tailSegments,i*0.5/tailSegments);
        tailSphere = new THREE.Mesh(new THREE.SphereGeometry(tailRad, 32, 32), new THREE.MeshBasicMaterial({color:tailColor.getHex(), transparent: true, opacity: 0.6}));
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
    var time = clock.getElapsedTime();
    // Bob's position
    Bob.position.x = Bob.position.x + environment.heat*delta*(0.5-Math.random())/Bob.m;
    Bob.position.y = Bob.position.y + environment.heat*delta*(0.5-Math.random())/Bob.m;
    Bob.position.z = Bob.position.z + environment.heat*delta*(0.5-Math.random())/Bob.m;

    if(delta <1){ // to avoid very high changes, only apply them if latency is small
        scene.rotation.x += .01*delta;
        scene.rotation.y += .005*delta;
        scene.rotation.z += .0025*delta;
        cameraControls.update(delta);
        //var time = Date.now()*0.001;

        // Update state variables
        var currPos, currVel, currVel2;

        // Velocity updates
        // Eve's velocity update
        var eve2Alice = distV3(Eve.position, Alice.position);
        var eve2Bob = distV3(Eve.position, Bob.position);
        if (eve2Alice < Alice.rad){ 
            eveFollowAlice = true;
        } 
        else if (eve2Alice - Alice.rad > eve2Bob - Bob.rad) { 
            eveFollowAlice = false;
        }
        if (eveFollowAlice){
            currVel = updateVelocity(Eve, Alice, delta);        
        } else {
            currVel = updateVelocity(Eve, Alice, delta);
            currVel.multiplyScalar((eve2Alice+0.05)/(eve2Alice+eve2Bob+0.1));
            currVel2 = updateVelocity(Eve, Bob, delta);
            currVel2.multiplyScalar((eve2Bob+0.05)/(eve2Alice+eve2Bob+0.1));
            currVel.add(currVel2);
            currVel.multiplyScalar(0.5);
        }
        Eve.velocity = currVel;
        // Alice's velocity update
        currVel = updateVelocity(Alice, Bob, delta);
        Alice.velocity = currVel;
        // Carl velocity update
        currVel = updateVelocity(Carl, Bob, delta);
        Carl.velocity = currVel;

        // Position updates
        // Eve's position update
        currPos = updatePosition(Eve, Alice, delta);
        currPos = updatePosition(Eve, Bob, delta);
        Eve.position.x = currPos.x;
        Eve.position.y = currPos.y;
        Eve.position.z = currPos.z;

        // Alice update
        currPos = updatePosition(Alice, Bob, delta);
        Alice.position.x = currPos.x;
        Alice.position.y = currPos.y;
        Alice.position.z = currPos.z;

        // Carl's position update
        currPos = updatePosition(Carl, Bob, delta);
        Carl.position.x = currPos.x;
        Carl.position.y = currPos.y;
        Carl.position.z = currPos.z;

        // Tail update
        tailObjects[0][tailIndex].position.copy(Eve.position);
        tailObjects[1][tailIndex].position.copy(Carl.position);
        tailIndex += 1;
        tailIndex = tailIndex % tailSegments;

        // Pulsating updates
        // Alice
        Alice.mesh.scale.set(0.9+0.1*Math.pow(Math.sin(5*Math.PI*time),2), 0.9+0.1*Math.pow(Math.sin(5*Math.PI*time+1),2), 0.9+0.1*Math.pow(Math.sin(5*Math.PI*time+2),2));
        // Bob
        Bob.mesh.scale.set(0.9+0.1*Math.pow(Math.sin(5*Math.PI*time+0.4),2), 0.9+0.1*Math.pow(Math.sin(5*Math.PI*time+1.4),2), 0.9+0.1*Math.pow(Math.sin(5*Math.PI*time+2.1),2));
        var bobColorNew = new THREE.Color(0xffffff);
        bobColorNew.lerp(Bob.bobColor, Math.abs(Math.sin(Math.PI*time+0.3)));
        Bob.mesh.material.color = bobColorNew;
        // Carl
        Carl.mesh.scale.set(0.8+0.4*Math.pow(Math.sin(Math.PI*time),2), 0.8+0.4*Math.pow(Math.sin(Math.PI*time+1),2), 0.8+0.4*Math.pow(Math.sin(Math.PI*time+2),2));
        Carl.mesh.material.color.setRGB(0.4,0.2+0.8*Math.pow(Math.sin(Math.PI*time),2),0.2+0.8*Math.pow(Math.cos(Math.PI*time),2));
        // Eve
        Eve.mesh.scale.set(0.8+0.4*Math.pow(Math.sin(2*Math.PI*time),2), 0.8+0.4*Math.pow(Math.sin(2*Math.PI*time+1),2), 0.8+0.4*Math.pow(Math.sin(2*Math.PI*time+2),2));
        Eve.mesh.material.color.setRGB(0.2+0.8*Math.pow(Math.sin(Math.PI*time),2),1,0.2*Math.pow(Math.cos(0.1*Math.PI*time),2));
        
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
    //var c0, c1, c2, c3;
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
    /*
    var ppx = p.position.x, ppy = p.position.y, ppz = p.position.z;
    var qqx = q.position.x, qqy = q.position.y, qqz = q.position.z;
    var disp = Math.sqrt(Math.pow(ppx-qqx,2)+Math.pow(ppy-qqy,2)+Math.pow(ppz-qqz,2));
    var ppos, pvel;
    if (disp < invisibleVolumeFactor*(p.rad+q.rad)/2){
        ppos = q.position.clone();
        ppos.add(V3((environment.heat+invisibleVolumeFactor*q.rad)*(0.5-Math.random()),(environment.heat+invisibleVolumeFactor*q.rad)*(0.5-Math.random()),(environment.heat+invisibleVolumeFactor*q.rad)*(0.5-Math.random())));
    } else {
        pvel = p.velocity.clone();
        pvel.multiplyScalar(delta);
        ppos = V3().addVectors(q.position, pvel);
    }
    if (ppos.length > maxDistance){
        ppos.multiplyScaler(maxDistance/(1+ppos.length));
    }
    */
    return ppos;
}

function updateVelocity(p, q, delta){
    var c4, c5, c6, c7;
    //log(0.5-Math.random());
    var ppx = p.position.x, ppy = p.position.y, ppz = p.position.z;
    var ppvx = p.velocity.x, ppvy = p.velocity.y, ppvz = p.velocity.z;
    var qqx = q.position.x, qqy = q.position.y, qqz = q.position.z;
    var vx, vy, vz, velDelta, rad;
    var distance = dist3(ppx,ppy,ppz,qqx,qqy,qqz);
    //if (distance < environment.strongDistance){ // under dev
    if (true){
        c4 = getC4(p.m, p.k, p.b, delta);
        c5 = getC5(p.m, p.k, p.b, delta);
        c6 = getC6(p.m, p.k, p.b, delta);
        c7 = getC7(p.m, p.k, p.b, delta);
        vx = c4*ppx+c5*qqx+c6*ppvx+c7*q.velocity.x;
        vy = c4*ppy+c5*qqy+c6*ppvy+c7*q.velocity.y;
        vz = c4*ppz+c5*qqz+c6*ppvz+c7*q.velocity.z;
    } else {
        velDelta = V3(qqx-ppx, qqy-ppy, qqz-ppz);
        rad = velDelta.length;
        velDelta.multiplyScalar(environment.gravity*q.m/(p.m*Math.pow(0.01+rad,0.5)));
        velDelta.multiplyScalar(delta);
        vx = ppvx+velDelta.x;
        vy = ppvy+velDelta.y;
        vz = ppvz+velDelta.z;
    }
    // limiting speed:
    var vel = V3(vx+environment.heat*(0.5-Math.random()),vy+environment.heat*(0.5-Math.random()),vz+environment.heat*(0.5-Math.random()));
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

/*
function apply(){
    renderer.render(scene,camera);
}*/

function setupGui() {
    gui = new dat.GUI();
    var folder;
    folder = gui.addFolder("Environment");
    folder.add(environment, 'heat').min(0).max(Math.max(100,environment.heat)).name("Heat").step(1);
    folder.add(environment, 'strongDistance').min(0).max(Math.max(maxDistance/2, environment.strongDistance)).name("Boundaries").step(1);
    //folder.add(environment, 'gravity').min(0).max(9001).name("Gravity").step(1);
    folder = gui.addFolder("Bob");
    folder.add(Bob.position, "x", -75*bobRad, 75*bobRad).name("position (x)").step(1);
    folder.add(Bob.position, "y", -75*bobRad, 75*bobRad).name("position (y)").step(1);
    folder.add(Bob.position, "z", -75*bobRad, 75*bobRad).name("position (z)").step(1);
    folder.add(Bob, 'm').min(.01).max(1000).name("mass").step(1);
    folder = gui.addFolder("Alice");
    folder.add(Alice, 'm').min(.01).max(1000).name("mass").step(1);
    folder.add(Alice, 'k').min(-200).max(Math.max(1000,kInit*10)).name("interaction").step(1);
    folder.add(Alice, 'b').min(0).max(1000).name("damping").step(1);
    folder = gui.addFolder("Carl");
    folder.add(Carl, 'm').min(.01).max(1000).name("C's mass").step(1);
    folder.add(Carl, 'k').min(-200).max(Math.max(1000,kInit*10)).name("C's interaction").step(1);
    folder.add(Carl, 'b').min(0).max(1000).name("C's damping").step(1);
    folder = gui.addFolder("Eve");
    folder.add(Eve, 'm').min(.01).max(1000).name("E's mass").step(1);
    folder.add(Eve, 'k').min(-200).max(Math.max(1000,kInit*10)).name("E's interaction").step(1);
    folder.add(Eve, 'b').min(0).max(1000).name("E's damping").step(1);
    gui.open();
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
function dist3(x1,y1,z1,x2,y2,z2){
    return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)+(z1-z2)*(z1-z2));
}
function distV3(V3a, V3b){
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