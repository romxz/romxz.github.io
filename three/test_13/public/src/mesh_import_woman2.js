$(function(){
    /* Initializing variables in order to depict scene using threejs */
    // basic elements in any three.js animation
    var scene, camera, renderer, spotLight;
    // used for controlling the camera with the mouse, and for the gui control
    var controls, guiControls, datGUI; 
    // helpful info box on stas about fps and performance
    var stats;
    /* dae (Collada) is the file format that contains the imported objects from a scene. 
    In this case it contains the woman model, including all of its hair/clothes/eyes meshes etc, bones, things like that. These were first created using the free MakeHuman tool, imported into blender, where I deleted the legs etc, and set it up for import into three.js */
    var dae;
    /* dae is not the best format for importing single meshes from blender, but it is the one I was able to get to work when trying to import the multiple meshes that comprise the woman model. Due to how the dae loader works here, I need to save all the mesh objects into an array to use them later */
    var savedMeshes = {};
    // These are parameters used to adjust the screen size that gets rendered. Not working properly when resizing yet
    var SCREEN_WIDTH, SCREEN_HEIGHT;
    // This is a scaling percentage of how big the screen size should be rendered relative to the actual window size
    var VIEW_SCALE = 0.8;

    /* The imported scene is loaded into three.js using a loading library. In this case, since the scene is imported via dae format, a collada loader object needs to be used */
    var loader = new  THREE.ColladaLoader();
    /* Sometimes, programs where you import meshes from (e.g. like blender) have different sense of what is "up".
    convertUpAxis is in case the dae needs this fixup */
    loader.options.convertUpAxis = false;
    /* To load the dae, you pass to the loader the file path, as well as a function indicating what to do with the file once it loads it */
    loader.load('./json/woman_bust4.dae', function (collada){
        // The location of the objects imported are structured hierarchically, starting with the scene object at the top 
        dae = collada.scene;
        // Sometimes the objects imported might look too small or large, depending on the units used
        dae.scale.x = dae.scale.y = dae.scale.z = 1;
        /* In order to obtain the objects to render them, the scene object hierarchy needs to be traversed to find them */
        dae.traverse(function (child){
            /* In this case we only care about the mesh objects, so we save them into savedMeshes, using the id of the parent object as the identifier for that mesh */
            if (child instanceof THREE.SkinnedMesh){
                var id = child.parent.colladaId;
                log('mesh from colladaId == ' + id + ':');
                log(child);
                savedMeshes[id] = child;
            }
        });
        dae.updateMatrix();
        // This initializes all the objects by putting them into the scene
        init();
        // This animates any changes made by rendering the scene over and over again
        animate();
        log(scene);
    });

    function init(){
        /*creates empty scene object and renderer*/
        // The scene where all the objects (i.e. the woman) are placed:
        scene = new THREE.Scene();
        // The camera where all these objects can be viewed from:
        camera =  new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, .1, 500);
        // The rendering object that actually puts what the camera sees into the 2D screen
        renderer = new THREE.WebGLRenderer({antialias:true});

        // The background color (in hex format)
        renderer.setClearColor(0x000000);
        // The size of the window that gets rendered
        renderer.setSize(VIEW_SCALE*window.innerWidth, VIEW_SCALE*window.innerHeight);
        // Enables shadows on objects to be rendered
        renderer.shadowMap.enabled= true;
        renderer.shadowMapSoft = true;

        // Sphere object, used for testing and comparing the scale of objects with those imported from the dae. Not needed
        // var sphereTest = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({color: 0xff0000}));
        //scene.add(sphereTest);

        /* adding camera controls*/
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render );
        // Initializing starting camera position
        camera.position.x = 0.2;
        camera.position.y = 0.2;
        camera.position.z = 1.5;	
        //camera.lookAt(scene.position);
        camera.lookAt(V3(-0.2,0.2,-1.5));
        // adjusting where the relative starting position of the imported scene is
        dae.position.y -= 1;
        // adding all objects from the imported scene into the scene that will be actually rendered
        scene.add(dae);

        /* GUI controls for lighting in the scene, using a datGUI controls object*/
        guiControls = new function(){
            // spotlight's rotation
            this.rotationX  = 0.0;
            this.rotationY  = 0.0;
            this.rotationZ  = 0.0;
            // spotlight's position
            this.lightX = 19;
            this.lightY = 47;
            this.lightZ = 19;
            // the spotlight's intensity, distance, angle and how it fades
            this.intensity = 2.5;		
            this.distance = 373;
            this.angle = 1.6;
            this.exponent = 38;
        }

        /* Setting up controls for the woman's skeleton using the gui:
        The original imported mesh object, the woman, originally has many bones.
        These can be used to control its legs, arms etc, but currently only those controlling the spine are needed.
        Curently, only five of those bones in the skeleton are used for that: bone 0, 1, 3, 6 and 9. */
        // They are given names so that they can be controlled through the gui as well, for debugging purposes
        controlledRegions = {
            0:'Thoracic_[middle]',
            1:'Thoracic_[upper]',
            3:'Cervical_[lower]',
            6:'Cervical_[middle]',
            9:'Cervical_[upper]'
        }
        /*The bone's rotation (as well as position) can be modified by dictating what these values should be.
        Because of a technicality of how the bones are created/imported in the dae, each individual mesh has an identical copy of the entire skeleton that is used to control the body, instead of all meshes sharing the same skeleton */
        var firstKey = Object.keys(savedMeshes)[0];
        var bonesArray = savedMeshes[firstKey].skeleton.bones;
        for (var i = 0; i < bonesArray.length; i++){
            let itext = ''+i+'';
            if (i == 0 || i ==1 || i==3 || i==6 || i==9){
                guiControls[controlledRegions[itext]+'_(x)'] = 0.0;
                guiControls[controlledRegions[itext]+'_(y)'] = 0.0;
                guiControls[controlledRegions[itext]+'_(z)'] = 0.0;
            } 
        }
        log('guiControls:');
        log(guiControls);

        /* Adds a spot light with the stated parameters */
        spotLight = new THREE.SpotLight(0xffffff);
        spotLight.castShadow = true;
        spotLight.position.set (20, 35, 40);
        spotLight.intensity = guiControls.intensity;		
        spotLight.distance = guiControls.distance;
        spotLight.angle = guiControls.angle;
        scene.add(spotLight);
        // The scene stilll needed some baseline illumination, so an additional light is added:
        var light = new THREE.AmbientLight( 0x404040 );
        scene.add( light );

        /* Putting the gui controls into the scene and making sure changes to them will actually update the object they are trying to control */
        datGUI = new dat.GUI(); // Baseline GUI object
        datGUI.addFolder("Movement Control"); // Add folder on the GUI for the movement control
        // log('-----'); log('-----'); log('-----');
        for (let i = 0; i < bonesArray.length-1; i++){
            /* Only add controls for the bones of interest, and for each allow rotation about x, y and z */
            if (i == 0 || i ==1 || i==3 || i==6 || i==9){
                var textControl = controlledRegions[i]+'_(x)';
                /* The set of controls, which control, the min/max values for each parameter, as well as what to do when its value changes needs to be specified */
                datGUI.add(guiControls, textControl, -1, 1).onChange(function(value){
                    /* Since each saved mesh has a copy of the same skeleton, the rotation for that particular bone in each skeleton needs to be updated when the controlling value changes */
                    for (var key in savedMeshes){
                        if (savedMeshes.hasOwnProperty(key)){
                            savedMeshes[key].skeleton.bones[i].rotation.x = value;
                        }
                    }
                }).step(0.01);
                textControl = controlledRegions[i]+'_(y)';
                datGUI.add(guiControls, textControl, -1, 1).onChange(function(value){
                    for (var key in savedMeshes){
                        if (savedMeshes.hasOwnProperty(key)){
                            savedMeshes[key].skeleton.bones[i].rotation.y = value;
                        }
                    }
                }).step(0.01);
                textControl = controlledRegions[i]+'_(z)';
                datGUI.add(guiControls, textControl, -1, 1).onChange(function(value){
                    for (var key in savedMeshes){
                        if (savedMeshes.hasOwnProperty(key)){
                            savedMeshes[key].skeleton.bones[i].rotation.z = value;
                        }
                    }
                }).step(0.01);
            }
        }
        datGUI.addFolder("Lights"); // Add folder on the GUI for the light control
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
        datGUI.open(); // Leave the GUI controls open from the start

        // Append the scene and all of it's contents into the div container named "webGL-container" in the html that loads this javascript file
        $("#webGL-container").append(renderer.domElement);
        /* Also, add the stats info window */
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';		
        $("#webGL-container").append( stats.domElement );		
    }

    // Function used to get the device input data, located in the /device/ path
    function getData(channel) {
        httpGet('/device/' + channel, update);
    }

    // Function that receives the device's data, parses it and updates the bone's according to it
    function update(data) {
        /* The data packet from the device comes all together in one variable. Use " " to split that variable into the actual data that we care about */
        var res = data.split(" ");
        /* These split values are the ones that are used to change the bone's */
        var deviceMovX = res[1];//parseFloat(data.substring(0,1));
        var deviceMovY = res[0]; //parseFloat(data.substring(2,3));
        var deviceMovZ = res[2];//parseFloat(data.substring(4,5));
        log('X:'); log(deviceMovX);
        log('Y:'); log(deviceMovY);
        log('Z:'); log(deviceMovZ);
        // Need to limit the woman's maximum movement, otherwise it will look weird if it goes beyond them by accident
        var minX = -60; var maxX = 60;
        var minY = -45; var maxY = 50;
        var minZ = -60; var maxZ = 60;
        /* Each mesh has a copy of the bone in question, so all these copies need to be updated with the new data */
        for (var key in savedMeshes){
            // objects sometimes have prototype data in them, so check this isn't the case
            if (savedMeshes.hasOwnProperty(key)){
                var i = 1; // In this case, only this bone will be updated
                // setting boundaries for the device's data
                if (deviceMovX > maxX){
                    deviceMovX = maxX;
                } else if (deviceMovX < minX){
                    deviceMovX = minX;
                } if (deviceMovY > maxY){
                    deviceMovY = maxY;
                } else if (deviceMovY < minY){
                    deviceMovY = minY;
                } if (deviceMovZ > maxZ){
                    deviceMovZ = maxZ;
                } else if (deviceMovZ < minZ){
                    deviceMovZ = minZ;
                }
                // updating the actual bone's parameters, using the device data and scaling it
                savedMeshes[key].skeleton.bones[i].rotation.x = deviceMovX*0.01;
                savedMeshes[key].skeleton.bones[i].rotation.y = deviceMovY*0.01; 
                savedMeshes[key].skeleton.bones[i].rotation.z = deviceMovZ*0.01; 
            }
        }
    } 

    // This function makes the changes that need to happen every time the animation frame needs to be updated
    function render() {
        // Update the skeleton using the device's data, in this case through channel 3:
        getData(3);
        /* // Test to see if the rotation controls are working
        var randomMovX = Math.random();
        var randomMovY = Math.random();
        var randomMovZ = Math.random();
        for (var key in savedMeshes){
            if (savedMeshes.hasOwnProperty(key)){
                var i = 1;
                    //savedMeshes[key].skeleton.bones[i].rotation.x += randomMovX*0.05;
                    //savedMeshes[key].skeleton.bones[i].rotation.y += randomMovY*0.05; 
                    //savedMeshes[key].skeleton.bones[i].rotation.z += randomMovZ*0.05; 

            }
        }*/
        // Update the light's position according to the gui controls:
        spotLight.position.x = guiControls.lightX;
        spotLight.position.y = guiControls.lightY;
        spotLight.position.z = guiControls.lightZ;
    }

    // This function is recursive, calling itself over and over every time the animation needs to be updated, and performing the necessary changes to illustrate this on the screen
    function animate(){
        requestAnimationFrame(animate);
        render();
        stats.update();		
        renderer.render(scene, camera);
    }

    // Wrapper functions to quickly access threejs and log methods
    function V3(x,y,z){ return new THREE.Vector3(x,y,z); }
    function log(toLog){ window.console.log(toLog); }
});	

// Resize the viewing window when the screen window size changes
$(window).resize(function(){
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
});