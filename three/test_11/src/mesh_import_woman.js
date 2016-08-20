$(function(){
    var scene, camera, renderer;
    var controls, guiControls, datGUI;
    var stats;
    var dae, spotLight;
    var SCREEN_WIDTH, SCREEN_HEIGHT;
    var savedObjects = {};
    var VIEW_SCALE = 0.8;

    var loader = new  THREE.ColladaLoader();
    loader.options.convertUpAxis = false;
    loader.load('./json/woman_bust4.dae', function (collada){
        dae = collada.scene;
        dae.scale.x = dae.scale.y = dae.scale.z = 1;
        dae.traverse(function (child){
            if (child instanceof THREE.SkinnedMesh){
                var id = child.parent.colladaId;
                log('mesh from colladaId == ' + id + ':');
                log(child);
                savedObjects[id] = child;
            }
        });
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

        // test sphere
        var sphereTest = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({color: 0xff0000}));
        //scene.add(sphereTest);

        /*add controls*/
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render );

        camera.position.x = 0.2;
        camera.position.y = 0.2;
        camera.position.z = 1.5;	
        //camera.lookAt(scene.position);
        camera.lookAt(V3(-0.2,0.2,-1.5));

        dae.position.y -= 1;
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

    var direction = 1;
    function render() {
        var randomMovX = Math.random();
        var randomMovY = Math.random();
        var randomMovZ = Math.random();
        for (var key in savedObjects){
            if (savedObjects.hasOwnProperty(key)){
                for (var i = 0; i < savedObjects[key].skeleton.bones.length; i++){
                    savedObjects[key].skeleton.bones[i].rotation.x += randomMovX*0.05;
                    savedObjects[key].skeleton.bones[i].rotation.y += randomMovY*0.05; 
                    savedObjects[key].skeleton.bones[i].rotation.z += randomMovZ*0.05; 
                }
            }
        }
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

    function V3(x,y,z){
        return new THREE.Vector3(x,y,z);
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