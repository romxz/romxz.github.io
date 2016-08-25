$(function () {
    var scene, camera, renderer;
    var controls, guiControls, datGUI;
    var stats;
    var dae, spotLight;
    var SCREEN_WIDTH, SCREEN_HEIGHT;
    var savedMeshes = {};
    var VIEW_SCALE = 0.8;

    // texture path locations for some parts of the woman model:
    var textMaps = {
        'woman_02-ponytail01': 'json/textures/ponytail01_diffuse.png'
        , 'woman_02-highpolyeyes': 'json/textures/brown_eye.png'
        , 'woman_02-eyebrow010': 'json/textures/eyebrow010.png'
        , 'woman_02-eyelashes02': 'json/textures/eyelashes02.png'
        , 'woman_02-female_casualsuit01': 'json/textures/female_casualsuit01_diffuse.png'
    }
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = false;
    loader.load('./json/woman_bust4.dae', function (collada) {
        dae = collada.scene;
        // dae.scale.x = dae.scale.y = dae.scale.z = 1;
        dae.traverse(function (child) {
            if (child instanceof THREE.SkinnedMesh) {
                var id = child.parent.colladaId;
                var material = child.material;
                material.shininess = 1;
                if (id in textMaps) {
                    //var texture = new THREE.ImageUtils.loadTexture( 'json/textures/ponytail01_diffuse.png' );
                    var texture = new THREE.ImageUtils.loadTexture(textMaps[id]);
                    material.map = texture;
                    if (id == 'woman_02-highpolyeyes' || id == 'woman_02-eyebrow010' || 'woman_02-eyelashes02' || 'woman_02-ponytail01') {
                        material.transparent = true;
                        material.receiveShadow = true;
                        material.alphaTest = 0.1;
                        material.opacity = 1;
                        material.side = THREE.Doubleside;
                        //child.material.alphaMap = 1;
                        log('mesh from colladaId == ' + id + ':');
                        log(child);
                        log(id + '.material:');
                        log(material);
                        log('texture:');
                        log(material.map);
                    }
                }
                savedMeshes[id] = child;
            }
        });
        dae.updateMatrix();
        init();
        animate();
        log(scene);
    });

    function init() {
        /*creates empty scene object and renderer*/
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 500);
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setClearColor(0x000000);
        renderer.setSize(VIEW_SCALE * window.innerWidth, VIEW_SCALE * window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMapSoft = true;
        // test sphere
        var sphereTest = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({
            color: 0xff0000
        }));
        //scene.add(sphereTest);
        /*add controls*/
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', render);
        camera.position.x = 0.2;
        camera.position.y = 0.2;
        camera.position.z = 1.5;
        //camera.lookAt(scene.position);
        camera.lookAt(V3(-0.2, 0.2, -1.5));
        dae.position.y -= 1;
        scene.add(dae);
        /*datGUI controls object*/
        guiControls = new function () {
            this.rotationX = 0.0;
            this.rotationY = 0.0;
            this.rotationZ = 0.0;
            this.lightX = 19;
            this.lightY = 47;
            this.lightZ = 19;
            this.intensity = 2.5;
            this.distance = 373;
            this.angle = 1.6;
            this.exponent = 38;
        }
        var firstKey = Object.keys(savedMeshes)[0];
        var bonesArray = savedMeshes[firstKey].skeleton.bones;
        controlledRegions = {
            0: 'Thoracic_[middle]'
            , 1: 'Thoracic_[upper]'
            , 3: 'Cervical_[lower]'
            , 6: 'Cervical_[middle]'
            , 9: 'Cervical_[upper]'
        }
        for (var i = 0; i < bonesArray.length; i++) {
            let itext = '' + i + '';
            if (i == 0 || i == 1 || i == 3 || i == 6 || i == 9) {
                guiControls[controlledRegions[itext] + '_(x)'] = 0.0;
                guiControls[controlledRegions[itext] + '_(y)'] = 0.0;
                guiControls[controlledRegions[itext] + '_(z)'] = 0.0;
            }
            /*else if (i=1){
                guiControls['Thoracic_[upper]_(x)'] = 0.0;
                guiControls['Thoracic_[upper]_(y)'] = 0.0;
                guiControls['Thoracic_[upper]_(z)'] = 0.0;
            } else if (i=3){
                guiControls['Cervical_[lower]_(x)'] = 0.0;
                guiControls['Cervical_[lower]_(y)'] = 0.0;
                guiControls['Cervical_[lower]_(z)'] = 0.0;
            } else if (i=6){
                guiControls['Cervical_[middle]_(x)'] = 0.0;
                guiControls['Cervical_[middle]_(y)'] = 0.0;
                guiControls['Cervical_[middle]_(z)'] = 0.0;
            } else if (i=9){
                guiControls['Cervical_[upper]_(x)'] = 0.0;
                guiControls['Cervical_[upper]_(y)'] = 0.0;
                guiControls['Cervical_[upper]_(z)'] = 0.0;
            }*/
            /*
            guiControls['Bone_'+i+'_(x)'] = 0.0;
            guiControls['Bone_'+i+'_(y)'] = 0.0;
            guiControls['Bone_'+i+'_(z)'] = 0.0;
            */
        }
        //log('guiControls:'); log(guiControls);
        /*adds spot light with starting parameters*/
        spotLight = new THREE.SpotLight(0xffffff);
        spotLight.castShadow = true;
        spotLight.position.set(20, 35, 40);
        spotLight.intensity = guiControls.intensity;
        spotLight.distance = guiControls.distance;
        spotLight.angle = guiControls.angle;
        scene.add(spotLight);
        var light = new THREE.AmbientLight(0x404040); // soft white light
        scene.add(light);
        /*adds controls to scene*/
        datGUI = new dat.GUI();
        datGUI.addFolder("Movement Control");
        //log('-----'); log('-----'); log('-----');
        for (let i = 0; i < bonesArray.length - 1; i++) {
            if (i == 0 || i == 1 || i == 3 || i == 6 || i == 9) {
                var textControl = controlledRegions[i] + '_(x)';
                datGUI.add(guiControls, textControl, -1, 1).onChange(function (value) {
                    for (var key in savedMeshes) {
                        if (savedMeshes.hasOwnProperty(key)) {
                            savedMeshes[key].skeleton.bones[i].rotation.x = value;
                        }
                    }
                }).step(0.01);
                textControl = controlledRegions[i] + '_(y)';
                datGUI.add(guiControls, textControl, -1, 1).onChange(function (value) {
                    for (var key in savedMeshes) {
                        if (savedMeshes.hasOwnProperty(key)) {
                            savedMeshes[key].skeleton.bones[i].rotation.y = value;
                        }
                    }
                }).step(0.01);
                textControl = controlledRegions[i] + '_(z)';
                datGUI.add(guiControls, textControl, -1, 1).onChange(function (value) {
                    for (var key in savedMeshes) {
                        if (savedMeshes.hasOwnProperty(key)) {
                            savedMeshes[key].skeleton.bones[i].rotation.z = value;
                        }
                    }
                }).step(0.01);
            }
        }
        datGUI.addFolder("Lights");
        datGUI.add(guiControls, 'lightX', -60, 180);
        datGUI.add(guiControls, 'lightY', 0, 180);
        datGUI.add(guiControls, 'lightZ', -60, 180);
        datGUI.add(guiControls, 'intensity', 0.01, 5).onChange(function (value) {
            spotLight.intensity = value;
        });
        datGUI.add(guiControls, 'distance', 0, 1000).onChange(function (value) {
            spotLight.distance = value;
        });
        datGUI.add(guiControls, 'angle', 0.001, 1.570).onChange(function (value) {
            spotLight.angle = value;
        });
        datGUI.open();
        $("#webGL-container").append(renderer.domElement);
        /*stats*/
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        $("#webGL-container").append(stats.domElement);
    }
    var direction = 1;

    function render() {
        /*
        var randomMovX = Math.random();
        var randomMovY = Math.random();
        var randomMovZ = Math.random();
        for (var key in savedMeshes){
            if (savedMeshes.hasOwnProperty(key)){
                for (var i = 0; i < savedMeshes[key].skeleton.bones.length; i++){
                    savedMeshes[key].skeleton.bones[i].rotation.x += randomMovX*0.05;
                    savedMeshes[key].skeleton.bones[i].rotation.y += randomMovY*0.05; 
                    savedMeshes[key].skeleton.bones[i].rotation.z += randomMovZ*0.05; 
                }
            }
        }*/
        spotLight.position.x = guiControls.lightX;
        spotLight.position.y = guiControls.lightY;
        spotLight.position.z = guiControls.lightZ;
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
        renderer.render(scene, camera);
    }

    function V3(x, y, z) {
        return new THREE.Vector3(x, y, z);
    }

    function log(toLog) {
        window.console.log(toLog);
    }
});
$(window).resize(function () {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
});