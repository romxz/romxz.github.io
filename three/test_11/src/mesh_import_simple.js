$(function(){

    var scene, camera, renderer;
    var controls, guiControls, datGUI;
    var stats;
    var dae, spotLight;
    var SCREEN_WIDTH, SCREEN_HEIGHT;
    var savedObjects = {};
    var VIEW_SCALE = 0.8;

    var loader = new  THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    //loader.load('https://cdn.rawgit.com/wpdildine/wpdildine.github.com/master/models/monkey.dae',
    loader.load('./json/collada_test4.dae', function (collada){
        dae = collada.scene;
        dae.scale.x = dae.scale.y = dae.scale.z = 1;
        dae.traverse(function (child){
            if (child.colladaId == "BoneThingy"){
                child.traverse(function(e){
                    e.castShadow = true;
                    e.receiveShadow = true;
                    if (e.material instanceof THREE.MeshPhongMaterial){
                        e.material.needsUpdate = true;
                    }
                    if (e.colladaId == "Bone_002"){
                        savedObjects.Bone2 = e;
                        log(savedObjects);
                        log('bone2 saved');
                    } else if (e.colladaId == "CubeFrameo"){
                        savedObjects.CubeFrameo = e;
                        log('CubeFrameo saved');
                        log(savedObjects);
                    }
                });
                log('Saved cubeBone');
                savedObjects.BoneThingy = child;
                log(savedObjects);
            }
            else if (child.colladaId == "SphereTesto"){
                child.traverse(function(e){
                    e.castShadow = true;
                    e.receiveShadow = true;
                });
                log('Saved sphereTesto');
                savedObjects.SphereTesto = child;
                log(savedObjects);
            } else if (child instanceof THREE.SkinnedMesh){
                log('saved instanceof skinnedmesh');
                savedObjects.skinnedObject = child;
            }	
        });
        log(savedObjects.length);
        dae.updateMatrix();
        init();
        animate();
        log(scene);
    });	
    function init(){
        /*creates empty scene object and renderer*/
        scene = new THREE.Scene();
        camera =  new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, .1, 500);
        renderer = new THREE.WebGLRenderer({antialias:true});

        renderer.setClearColor(0x000000);
        renderer.setSize(VIEW_SCALE*window.innerWidth, VIEW_SCALE*window.innerHeight);
        renderer.shadowMapEnabled= true;
        renderer.shadowMapSoft = true;

        /*add controls*/
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render );

        camera.position.x = 5;
        camera.position.y = 9;
        camera.position.z = 42;	
        camera.lookAt(scene.position);

        scene.add(dae);
        /*datGUI controls object*/
        guiControls = new function(){
            this.rotationX  = 0.0;
            this.rotationY  = 0.0;
            this.rotationZ  = 0.0;

            this.lightX = 19;
            this.lightY = 47;
            this.lightZ = 19;
            this.intensity = 2.5;		
            this.distance = 373;
            this.angle = 1.6;
            this.exponent = 38;
            this.shadowCameraNear = 34;
            this.shadowCameraFar = 2635;
            this.shadowCameraFov = 68;
            this.shadowCameraVisible=false;
            this.shadowMapWidth=512;
            this.shadowMapHeight=512;
            this.shadowBias=0.00;
            this.shadowDarkness=0.11;		

        }
        /*adds spot light with starting parameters*/
        spotLight = new THREE.SpotLight(0xffffff);
        spotLight.castShadow = true;
        spotLight.position.set (20, 35, 40);
        spotLight.intensity = guiControls.intensity;		
        spotLight.distance = guiControls.distance;
        spotLight.angle = guiControls.angle;
        spotLight.exponent = guiControls.exponent;
        spotLight.shadowCameraNear = guiControls.shadowCameraNear;
        spotLight.shadowCameraFar = guiControls.shadowCameraFar;
        spotLight.shadowCameraFov = guiControls.shadowCameraFov;
        spotLight.shadowCameraVisible = guiControls.shadowCameraVisible;
        spotLight.shadowBias = guiControls.shadowBias;
        spotLight.shadowDarkness = guiControls.shadowDarkness;
        scene.add(spotLight);

        var light = new THREE.AmbientLight( 0x404040 ); // soft white light
        scene.add( light );

        /*adds controls to scene*/
        datGUI = new dat.GUI();

        datGUI.add(guiControls, 'lightX',-60,180);	
        datGUI.add(guiControls, 'lightY',0,180);	
        datGUI.add(guiControls, 'lightZ',-60,180);

        datGUI.add(guiControls, 'intensity',0.01, 5).onChange(function(value){
            spotLight.intensity = value;
        });		
        datGUI.add(guiControls, 'distance',0, 1000).onChange(function(value){
            spotLight.distance = value;
        });	
        datGUI.add(guiControls, 'angle',0.001, 1.570).onChange(function(value){
            spotLight.angle = value;
        });		
        datGUI.add(guiControls, 'exponent',0 ,50 ).onChange(function(value){
            spotLight.exponent = value;
        });
        datGUI.add(guiControls, 'shadowCameraNear',0,100).name("Near").onChange(function(value){		
            spotLight.shadowCamera.near = value;
            spotLight.shadowCamera.updateProjectionMatrix();		
        });
        datGUI.add(guiControls, 'shadowCameraFar',0,5000).name("Far").onChange(function(value){
            spotLight.shadowCamera.far = value;
            spotLight.shadowCamera.updateProjectionMatrix();
        });
        datGUI.add(guiControls, 'shadowCameraFov',1,180).name("Fov").onChange(function(value){
            spotLight.shadowCamera.fov = value;
            spotLight.shadowCamera.updateProjectionMatrix();
        });
        datGUI.add(guiControls, 'shadowCameraVisible').onChange(function(value){
            spotLight.shadowCameraVisible = value;
            spotLight.shadowCamera.updateProjectionMatrix();
        });
        datGUI.add(guiControls, 'shadowBias',0,1).onChange(function(value){
            spotLight.shadowBias = value;
            spotLight.shadowCamera.updateProjectionMatrix();
        });
        datGUI.add(guiControls, 'shadowDarkness',0,1).onChange(function(value){
            spotLight.shadowDarkness = value;
            spotLight.shadowCamera.updateProjectionMatrix();
        });
        datGUI.close();
        $("#webGL-container").append(renderer.domElement);
        /*stats*/
        stats = new Stats();		
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';		
        $("#webGL-container").append( stats.domElement );		
    }


    function render() {
        /*dae.traverse(function (child){
			if (child.colladaId == "Cube"){
				child.rotation.y  += .01;
			}
			else if (child.colladaId == "Sphere"){
				child.rotation.y  -= .01;
			}	
		});*/		
        //savedObjects[0].rotation.y += 0.01;
        //savedObjects[1].rotation.z -= 0.01;
        //log(savedObjects['CubeFrameo']);
        //savedObjects["CubeFrameo"].rotation.y += 0.01;
        //log(savedObjects.CubeFrameo);
        //log(savedObjects.Bone2);
        //savedObjects.Bone2.position.z -= 0.01;
        //log(savedObjects.Bone2.position.z);
        //savedObjects.CubeFrameo.rotation.y += 0.01;
        //savedObjects.skinnedObject.skeleton.bones[0].rotation.z += 0.01;
        //savedObjects.skinnedObject.skeleton.bones[1].rotation.y += 0.01;
        //savedObjects.skinnedObject.skeleton.bones[2].rotation.x += 0.01;
        savedObjects.skinnedObject.skeleton.bones[3].rotation.z += 0.01;

        spotLight.position.x = guiControls.lightX;
        spotLight.position.y = guiControls.lightY;
        spotLight.position.z = guiControls.lightZ;

    }

    function animate(){
        requestAnimationFrame(animate);
        render();
        stats.update();		
        renderer.render(scene, camera);
    }

    function log(toLog){
        window.console.log(toLog);
    }
});	


$(window).resize(function(){


    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );



});