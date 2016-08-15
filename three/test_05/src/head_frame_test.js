//"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Basic Head Structure: bust
////////////////////////////////////////////////////////////////////////////////

/*global THREE, Coordinates, $, document, window, dat*/

var camera, scene, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var gridX = true;
var gridY = false;
var gridZ = false;
var axes = true;
var ground = true;

//var arm, forearm;
var rig4, rig3, rig2, rig1;

function fillScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

    // LIGHTS
    var ambientLight = new THREE.AmbientLight( 0x222222 );

    var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    light.position.set( 200, 400, 500 );

    var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    light2.position.set( -500, 250, -200 );

    scene.add(ambientLight);
    scene.add(light);
    scene.add(light2);

    if (ground) {
        Coordinates.drawGround({size:10000});		
    }
    if (gridX) {
        Coordinates.drawGrid({size:10000,scale:0.01});
    }
    if (gridY) {
        Coordinates.drawGrid({size:10000,scale:0.01, orientation:"y"});
    }
    if (gridZ) {
        Coordinates.drawGrid({size:10000,scale:0.01, orientation:"z"});	
    }
    if (axes) {
        Coordinates.drawAllAxes({axisLength:200,axisRadius:1,axisTess:50});
    }

    // rig material
    var rigMaterial = new THREE.MeshPhongMaterial( { color: 0x0F0FFD, specular: 0x20858D, shininess: 50 } );

    rig4 = new THREE.Object3D();
    rig4.length = 80;
    createRig(rig4, rig4.length, rigMaterial);

    rig3 = new THREE.Object3D();
    rig3.length = 40;
    createRig(rig3, rig3.length, rigMaterial);

    rig2 = new THREE.Object3D();
    rig2.length = 40;
    createRig(rig2, rig2.length, rigMaterial);

    rig1 = new THREE.Object3D();
    rig1.length = 80;
    createRig(rig1, rig1.length, rigMaterial);

    rig4.rotation.z = 10*Math.PI/108;
    rig4.position.y = rig3.length;
    rig3.add(rig4);
    rig3.position.y = rig2.length;
    rig2.add(rig3);
    rig2.rotation.z = -10*Math.PI/108;
    rig2.position.y = rig1.length;
    rig1.add(rig2);
    rig1.rotation.z = 10*Math.PI/180;
    scene.add(rig1);

    // Cone geometry test
    var coneTest = new THREE.Mesh(new THREE.ConeGeometry(16, 80, 4), 
                                  new THREE.MeshBasicMaterial({color: 0xFF00FF}));
    coneTest.position.x = 80;
    coneTest.position.y = 80/2;
    scene.add(coneTest);
}

function createRig(part, length, material){
    var rigGeometry = new THREE.Geometry();
    // generate vertices
    for (var i = 0; i < 4; i++){
        var x = (i % 2) ? -1 : 1; 
        var z = (i < 2) ? -1 : 1; 
        rigGeometry.vertices.push( new THREE.Vector3(x*(length/5),0,z*(length/5)));
    }
    rigGeometry.vertices.push(new THREE.Vector3(0,length*0.75,0));
    rigGeometry.vertices.push(new THREE.Vector3(0,-length*0.25,0));
    // generate faces
    rigGeometry.faces.push(new THREE.Face3(0,1,4));
    rigGeometry.faces.push(new THREE.Face3(1,3,4));
    rigGeometry.faces.push(new THREE.Face3(3,2,4));
    rigGeometry.faces.push(new THREE.Face3(2,0,4));
    rigGeometry.faces.push(new THREE.Face3(1,0,5));
    rigGeometry.faces.push(new THREE.Face3(3,1,5));
    rigGeometry.faces.push(new THREE.Face3(2,3,5));
    rigGeometry.faces.push(new THREE.Face3(0,2,5));
    var rigObject = new THREE.Mesh(rigGeometry, material);
    rigObject.position.y = length*0.25;

    part.add(rigObject);
}

function init() {
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;
    var canvasRatio = canvasWidth / canvasHeight;

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColorHex( 0xAAAAAA, 1.0 );

    var container = document.getElementById('container');
    container.appendChild( renderer.domElement );

    // CAMERA
    camera = new THREE.PerspectiveCamera( 30, canvasRatio, 1, 10000 );
    camera.position.set( -510, 240, 100 );
    // CONTROLS
    cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
    cameraControls.target.set(0,100,0);

    fillScene();
}

function animate() {
    window.requestAnimationFrame(animate);
    render();
}

function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);

    if ( effectController.newGridX !== gridX || effectController.newGridY !== gridY || effectController.newGridZ !== gridZ || effectController.newGround !== ground || effectController.newAxes !== axes)
    {
        gridX = effectController.newGridX;
        gridY = effectController.newGridY;
        gridZ = effectController.newGridZ;
        ground = effectController.newGround;
        axes = effectController.newAxes;

        fillScene();
    }

    rig4.rotation.y = effectController.Hrotate * Math.PI/180; // head yaw
    rig4.rotation.z = effectController.Hflex * Math.PI/180; // head forward flex/ back extend
    rig4.rotation.x = effectController.Htilt * Math.PI/180; // head lateral tilt

    rig2.rotation.y = effectController.LNrotate * Math.PI/180; // head yaw
    rig2.rotation.z = effectController.LNflex * Math.PI/180; // head forward flex/ back extend
    rig2.rotation.x = effectController.LNtilt * Math.PI/180; // head lateral tilt

    renderer.render(scene, camera);
}



function setupGui() {

    effectController = {

        newGridX: gridX,
        newGridY: gridY,
        newGridZ: gridZ,
        newGround: ground,
        newAxes: axes,
        // Head relative angles
        Hrotate: 0,
        Hflex: 0,
        Htilt: 0,
        // Lower neck relative angles
        LNrotate: 0,
        LNflex: 0,
        LNtilt: 0
    };

    var gui = new dat.GUI();
    var h = gui.addFolder("Grid display");
    h.add( effectController, "newGridX").name("Show XZ grid");
    h.add( effectController, "newGridY" ).name("Show YZ grid");
    h.add( effectController, "newGridZ" ).name("Show XY grid");
    h.add( effectController, "newGround" ).name("Show ground");
    h.add( effectController, "newAxes" ).name("Show axes");
    // Head angles
    h = gui.addFolder("Head Movements");
    h.add(effectController, "Hrotate", -80, 80, 0.025).name("Rotation");
    h.add(effectController, "Hflex", -70, 80, 0.025).name("Flexion/Extension");
    h.add(effectController, "Htilt", -40, 40, 0.025).name("Lateral Tilt");
    // Lower neck angles
    h = gui.addFolder("Lower Neck Movements");
    h.add(effectController, "LNrotate", -80, 80, 0.025).name("Rotation");
    h.add(effectController, "LNflex", -70, 80, 0.025).name("Flexion/Extension");
    h.add(effectController, "LNtilt", -40, 40, 0.025).name("Lateral Tilt");
}

try {
    init();
    setupGui();
    animate();
} catch(e){
    var errorReport = "program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
    $('#container').append(errorReport+e);
}