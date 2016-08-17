"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
////////////////////////////////////////////////////////////////////////////////
// Basic Head Structure: bust
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, $, document, window, dat*/
var camera, scene, renderer, cameraControls, effectController;
var clock = new THREE.Clock();
var loader, gui;
var lights = [];
var frameBones, frameSkeleton, frameMesh, frameSkeletonHelper;
const VIEW_SCALE = 0.8;
var frameState = { animateBones: false };

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

}

function fillScene() {
    /*
    // Loaded Skinned Mesh
    loader = new THREE.JSONLoader();
    loader.load('./json/test_bones2.json', makeSkeletalRig);*/

    // Manual Skinned Mesh
    makeTestBoneFrame();
}

function makeTestBoneFrame() {
    // frame options
    var frameOptions = {
        skinning: true,
        boneLength: 8,
        numBones: 4,
        farBoneWeight: 0,
        scale: 1
    };
    frameOptions.length = frameOptions.boneLength*frameOptions.numBones;

    // frame geometry
    var frameGeometry = makeTestGeometry(frameOptions);

    // frame bones
    frameBones = [];
    var prevBone = new THREE.Bone();
    frameBones.push(prevBone);
    //prevBone.position.y = -frameOptions.length/2;
    prevBone.position.y = 0;
    for (var i=0; i < frameOptions.numBones; i++){
        var bone = new THREE.Bone();
        bone.position.y = frameOptions.boneLength;
        frameBones.push(bone);
        prevBone.add(bone);
        prevBone = bone;
    };

    // frame material
    var frameMaterial = new THREE.MeshPhongMaterial({
        skinning: frameOptions.skinning, 
        color: 0x0F0FFD, 
        emissive: 0x072534,
        side: THREE.DoubleSide,
        specular: 0xFFFFFF, 
        shininess: 30
    });

    // frame mesh
    if (frameOptions.skinning == true){
        frameMesh = new THREE.SkinnedMesh(frameGeometry, frameMaterial);
        frameSkeleton = new THREE.Skeleton(frameBones);
        frameMesh.add(frameBones[0]);
        frameMesh.bind(frameSkeleton);
        frameSkeletonHelper = new THREE.SkeletonHelper(frameMesh);
        frameSkeletonHelper.material.linewidth = 2;
        scene.add(frameSkeletonHelper);
    } else {
        frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    }
    frameMesh.scale.multiplyScalar(frameOptions.scale);
    scene.add(frameMesh);
}

function makeTestGeometry(options){
    var testGeometry = new THREE.Geometry();
    var length = options.length;

    // skinned options
    var skinning = options.skinning;
    //log(skinning);
    var numBones = options.numBones;
    var boneLength = options.boneLength;
    var farBoneWeight = options.farBoneWeight;
    var verticesPerSegment = 6;

    // generate vertices
    var i, j, iShift;
    for (j = 0; j < numBones; j++){
        iShift = verticesPerSegment*j;
        for (i = 0; i < 4; i++){
            var x = (i%2) ? -1:1;
            var z = (i<2) ? -1:1;
            testGeometry.vertices.push(new THREE.Vector3(x*(boneLength/5), (0.25+j)*boneLength,z*(boneLength/5)));
        }
        testGeometry.vertices.push(V3(0,boneLength*j,0));
        testGeometry.vertices.push(V3(0,boneLength*(j+1),0));
        for (i = 0; i < 4; i++){
            testGeometry.faces.push(F3(iShift+((1+2*i)%5),iShift+i,iShift+4));
            testGeometry.faces.push(F3(iShift+i,iShift+((1+2*i)%5),iShift+5));
        }
    }
    if (skinning == true){ // skinned weights
        log(true);
        for (i=0; i < testGeometry.vertices.length; i++){
            var vertex = testGeometry.vertices[i];
            var y = vertex.y;
            log(y);
            var skinIndex = Math.floor(y/boneLength);
            var skinWeight = (y%boneLength)/boneLength;
            testGeometry.skinIndices.push(V4((skinIndex==0) ? 0 : (skinIndex-1), skinIndex, skinIndex+1, (skinIndex>=numBones-1)?(skinIndex+1):(skinIndex+2)));
            testGeometry.skinWeights.push(V4(((skinIndex==0) ? 0:farBoneWeight)*(1-skinWeight), ((skinIndex==0) ? 1:(1-farBoneWeight))*(1-skinWeight), ((skinIndex>=numBones-1) ? 1:(1-farBoneWeight))*skinWeight, ((skinIndex>=numBones-1) ? 0:farBoneWeight)*skinWeight));
        }
    }
    testGeometry.computeFaceNormals();
    log(testGeometry);
    return testGeometry;
}

function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);
    var time = Date.now()*0.001;

    if (frameState.animateBones){
        for (var i = 0; i < frameMesh.skeleton.bones.length; i++){
            frameMesh.skeleton.bones[i].rotation.z = Math.sin(time)*2/frameMesh.skeleton.bones.length;
        }
    }
    frameSkeletonHelper.update();
}

function animate() {
    window.requestAnimationFrame(animate);
    render();
    renderer.render(scene, camera);
}

function setupGui() {
    effectController = {
        Bone0: 0,
        Bone1: 0,
        Bone2: 0,
        Bone3: 0
    };
    gui = new dat.GUI();
    var folder = gui.addFolder("Manual Meshed Bones");
    folder.add(frameState, "animateBones");
    folder.__controllers[0].name("Animate Bones");
    folder.add(frameMesh, "pose");
    folder.__controllers[1].name(".pose()");
    var frameBones = frameMesh.skeleton.bones;
    for (var i=0; i<frameBones.length; i++){
        var frameBone = frameBones[i];
        folder = gui.addFolder("Bone " + i);
        folder.add(frameBone.position, 'x', -10+frameBone.position.x, 10+frameBone.position.x);
        folder.add(frameBone.position, 'y', -10+frameBone.position.y, 10+frameBone.position.y);
        folder.add(frameBone.position, 'z', -10+frameBone.position.z, 10+frameBone.position.z);
        folder.add(frameBone.rotation, 'x', -Math.PI*0.5, Math.PI*0.5);
        folder.add(frameBone.rotation, 'y', -Math.PI*0.5, Math.PI*0.5);
        folder.add(frameBone.rotation, 'z', -Math.PI*0.5, Math.PI*0.5);
        folder.add(frameBone.scale, 'x', 0, 2);
        folder.add(frameBone.scale, 'y', 0, 2);
        folder.add(frameBone.scale, 'z', 0, 2);
        folder.__controllers[0].name("position.x");
        folder.__controllers[1].name("position.y");
        folder.__controllers[2].name("position.z");
        folder.__controllers[3].name("rotation.x");
        folder.__controllers[4].name("rotation.y");
        folder.__controllers[5].name("rotation.z");
        folder.__controllers[6].name("scale.x");
        folder.__controllers[7].name("scale.y");
        folder.__controllers[8].name("scale.z");
    }
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
        fillScene();
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