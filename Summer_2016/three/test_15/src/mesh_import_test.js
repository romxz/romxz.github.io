/*global variables*/
var scene, camera, renderer;
var controls, guiControls, datGUI;
var stats;
var spotLight, hemi;
var VIEW_SCALE = 0.8;
var SCREEN_WIDTH, SCREEN_HEIGHT;
var loader, model;

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
    renderer.setClearColor(0x333300, 1.0);
    
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    
    // SCENE
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffff90, .01, 500);
    setLights(); // lights
    
    // CAMERA
    camera = new THREE.PerspectiveCamera(45, canvasRatio, .1, 10000);
    camera.position.set(50, 50, 50);
    camera.lookAt(scene.position);
    
    // CONTROLS
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.addEventListener('change', render); //???
    
     // adjusting view when resizing window
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasWidth, canvasHeight);
    }, false);
    
    /*add loader call add model function*/
    loader = new THREE.JSONLoader();
    //loader.load('./json/test_bones.json', addModel);
    loader.load('./json/AnatomyModel_muscle.json', addModel);
    
    // Testing geometry view
    /*
    var sphereTest = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial({color: 0x0000ff}));
    scene.add(sphereTest);*/
    
    /*datGUI controls object*/
    guiControls = new function () {
        this.Bone_0 = 0.0;
        this.Bone_1 = 0.0;
        //this.Bone_2 = 0.0;
        //this.Bone_3 = 0.0;
        this.rotationX = 0.0;
        this.rotationY = 0.0;
        this.rotationZ = 0.0;
        this.lightX = 131;
        this.lightY = 107;
        this.lightZ = 180;
        this.scene = function () {
            console.log(scene);
        };
    }
    
    /*adds controls to scene*/
    datGUI = new dat.GUI();
    /*edit bones*/
    datGUI.add(guiControls, "scene");
    var cfolder = datGUI.addFolder('Controls');
    cfolder.add(guiControls, 'Bone_0', -3.14, 3.14);
    cfolder.add(guiControls, 'Bone_1', -3.14, 3.14);
    //cfolder.add(guiControls, 'Bone_2', -3.14, 3.14);
    //cfolder.add(guiControls, 'Bone_3', -3.14, 3.14);
    //datGUI.open();
    cfolder.open();
}
var test_mesh;
var help_mesh;
var scaleVal = 3;


function addModel(geometry, materials) {
    for (var i = 0; i < 1; i++) {
        //log(materials[0]);
        materials[0].skinning = true;
        //log('baba');
        //log(materials[0]);
        var cs = scaleVal;
        log(geometry);
        //test_mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial({color: 0x00ff00, skinning: true}));
        test_mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
        log(test_mesh);
        test_mesh.position.set(0, 0, 0);
        test_mesh.scale.set(cs, cs, cs);
        //test_mesh.castShadow = true;
        //test_mesh.receiveShadow = true;
        scene.add(test_mesh);
        help_mesh = new THREE.SkeletonHelper(test_mesh);
        log(help_mesh);
        scene.add(help_mesh);
    }
}
/*
function addModel(geometry, materials) {
    for (var i = 0; i < 800; i++) {
        materials[0].skinning = true;
        var cs = scaleVal * Math.random();
        set[i] = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
        set[i].position.set(Math.random() * 250, Math.random() * 250, Math.random() * 250);
        set[i].scale.set(cs, cs, cs);
        set[i].castShadow = true;
        set[i].receiveShadow = true;
        scene.add(set[i]);
        helpset[i] = new THREE.SkeletonHelper(set[i]);
        //scene.add(helpset[i]);
    }
}*/

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
    /*
    //add some nice lighting
    hemi = new THREE.HemisphereLight(0xff0090, 0xff0011);
    scene.add(hemi);
    //add some fog
    
    */ 
}

function render() {
    //log('hey');
    /*spotLight.position.x = guiControls.lightX;
    spotLight.position.y = guiControls.lightY;
    spotLight.position.z = guiControls.lightZ;*/
    //log('you');
    scene.traverse(function (child) {
        if (child instanceof THREE.SkinnedMesh) {
            //log('ho');
            child.rotation.y += .01;
            child.skeleton.bones[0].rotation.z = guiControls.Bone_0;
            child.skeleton.bones[1].rotation.z = guiControls.Bone_1;
            child.skeleton.bones[2].rotation.z = guiControls.Bone_2;
            child.skeleton.bones[3].rotation.z = guiControls.Bone_3;
        }
        else if (child instanceof THREE.SkeletonHelper) {
            child.update();
            //log('huh');
        }
        //log('ha');
    });
}

function animate() {
    requestAnimationFrame(animate);
    render();
    
    //stats.update();
    //log('b');
    renderer.render(scene, camera);
    //log('a');
}

function log(toLog){
    window.console.log(toLog);
}

try {
    init();
    animate();
}
catch (e) {
    var errorReport = "program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
    $('#container').append(errorReport + e);
}
/*
$(window).resize(function () {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
});*/