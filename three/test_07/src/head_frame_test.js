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
var loader;
var objTest;
var helpObjTest;
var scaleVal = 3;

//var arm, forearm;
var rig4, rig3, rig2, rig1;

function fillScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

    loader = new THREE.JSONLoader();
    loader.load('./json/test_bones2.json', makeSkeletalRig);

    setLights();
    makeNeckRig();
    makeTest(); // Cone geometry test
}




function makeTest(){
    var coneTest = new THREE.Mesh(new THREE.ConeGeometry(1.6, 8, 4), 
                                  new THREE.MeshBasicMaterial({color: 0xFF00FF}));
    coneTest.position.x = 8;
    coneTest.position.y = 8/2;
    coneTest.position.z = 5;
    scene.add(coneTest);
}

function makeGrids(){
    if (ground) { Coordinates.drawGround({size:10000});}
    if (gridX) { Coordinates.drawGrid({size:10000,scale:0.01});}
    if (gridY) { Coordinates.drawGrid({size:10000,scale:0.01, orientation:"y"});}
    if (gridZ) { Coordinates.drawGrid({size:10000,scale:0.01, orientation:"z"});}
    if (axes) { Coordinates.drawAllAxes({axisLength:200,axisRadius:1,axisTess:50});}
}

function makeNeckRig(){
    // rig material
    var rigMaterial = new THREE.MeshPhongMaterial( { color: 0x0F0FFD, specular: 0xFFFFFF, shininess: 30} );

    rig4 = new THREE.Object3D();
    rig4.length = 8;
    createRig(rig4, rigMaterial);

    rig3 = new THREE.Object3D();
    rig3.length = 4;
    createRig(rig3, rigMaterial);

    rig2 = new THREE.Object3D();
    rig2.length = 4;
    createRig(rig2, rigMaterial);

    rig1 = new THREE.Object3D();
    rig1.length = 8;
    createRig(rig1, rigMaterial);

    rig4.rotation.z = 10*Math.PI/108;
    rig4.position.y = rig3.length;
    rig3.add(rig4);
    rig3.position.y = rig2.length;
    rig2.add(rig3);
    rig2.rotation.z = -10*Math.PI/108;
    rig2.position.y = rig1.length;
    rig1.add(rig2);
    rig1.rotation.z = 10*Math.PI/180;
    rig1.position.x = 10;
    rig1.position.z = 10;

    scene.add(rig1);
}

function createRig(part, material){
    var rigGeometry = new THREE.Geometry();
    var length = part.length;
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
    rigGeometry.computeFaceNormals();
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
    renderer.setSize(canvasWidth/2, canvasHeight/2);
    renderer.setClearColor(0xAAAAAA, 1.0 );

    var container = document.getElementById('container');
    container.appendChild( renderer.domElement );

    // CAMERA
    camera = new THREE.PerspectiveCamera( 30, canvasRatio, 1, 10000 );
    camera.position.set( -61, 34, 10 );
    // CONTROLS
    cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
    cameraControls.target.set(0,10,0);

    fillScene();
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
    rig2.rotation.x = (effectController.LNtilt+effectController.Bone0)* Math.PI/180; // head lateral tilt

    scene.traverse(function(child){
        if (child instanceof THREE.SkinnedMesh){
            //child.rotation.y += 0.01;
            //child.rotation.x += 0.01;
            //child.pose();
            //window.console.log(child.skeleton.bones[3]);
            //child.skeleton.bones[0].rotation.z = effectController.Bone0*Math.Pi/180;
            //child.skeleton.update();
            /*
            child.skeleton.bones[0].matrix.makeRotationFromEuler(new THREE.Euler(0,0,effectController.Bone0*Math.Pi/180, 'XYZ'));
            child.skeleton.bones[0].matrixAutoUpdate = false;
            child.skeleton.bones[1].matrix.makeRotationFromEuler(new THREE.Euler(0,0,effectController.Bone1*Math.Pi/180, 'XYZ'));
            child.skeleton.bones[1].matrixAutoUpdate = false;
            child.skeleton.bones[1].matrix.makeRotationFromEuler(new THREE.Euler(0,0,effectController.Bone2*Math.Pi/180, 'XYZ'));
            child.skeleton.bones[2].matrixAutoUpdate = false;
            child.skeleton.bones[1].matrix.makeRotationFromEuler(new THREE.Euler(0,0,effectController.Bone3*Math.Pi/180, 'XYZ'));
            child.skeleton.bones[3].matrixAutoUpdate = false;*/
        } else if (child instanceof THREE.SkeletonHelper){
            child.update();
        }
    });
    //objTest.skeleton.bones[0].rotation.x += 0.01;
    //objTest.rotation.x = 1.2;
}

//function makeSkeletalRig(geometry, materials){
function makeSkeletalRig(geometry){
    //materials[0].skinning = true;
    var material = new THREE.MeshPhongMaterial( {
					skinning : true,
					color: 0x156289,
					emissive: 0x072534,
					side: THREE.DoubleSide,
					shading: THREE.FlatShading
				} );
    objTest = new THREE.SkinnedMesh(geometry, material);
    objTest.scale.set(scaleVal, scaleVal, scaleVal);
    objTest.castShadow = true;
    objTest.receiveShadow = true;
    scene.add(objTest);
    helpObjTest = new THREE.SkeletonHelper(objTest);
    scene.add(helpObjTest);
}

function animate(){
    window.requestAnimationFrame(animate);
    render();
    //stats.update();
    renderer.render(scene, camera);
}

function setupGui() {
    effectController = {
        Bone0: 0,
        Bone1: 0,
        Bone2: 0,
        Bone3: 0,
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
    var h;
    h = gui.addFolder("Meshed Bones");
    h.add( effectController, "Bone0", -90, 90).name("Bone 0");
    h.add( effectController, "Bone1", -90, 90).name("Bone 1");
    h.add( effectController, "Bone2", -90, 90).name("Bone 2");
    h.add( effectController, "Bone3", -90, 90).name("Bone 3");
    h = gui.addFolder("Grid display");
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

function setLights(){
    // LIGHTS
    var ambientLight = new THREE.AmbientLight( 0x222222 );
    var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    light.position.set( 20, 40, 50 );
    var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    light2.position.set( -50, 25, -20 );

    scene.add(ambientLight);
    scene.add(light);
    scene.add(light2);
}

try {
    init();
    setupGui();
    animate();
} catch(e){
    var errorReport = "program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
    $('#container').append(errorReport+e);
}