var camera, scene, renderer, controls;

var objects = [];

let skyBox;
var raycaster;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

var sword;
var avatarList = [];

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new THREE.Scene();
    var listener = new THREE.AudioListener();
    camera.add(listener);

    var sound = new THREE.Audio(listener);
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/ambiance.ogg', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
        sound.play();
    });

    var imagePrefix = "static/textures/skybox/hills2_";
    var directions = ["ft", "bk", "up", "dn", "rt", "lf"];
    var imageSuffix = ".jpg";
    var materialArray = [];
    for (var i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(imagePrefix + directions[i] + imageSuffix),
            side: THREE.BackSide
        }));
    var skyGeometry = new THREE.CubeGeometry(1000, 1000, 1000);
    var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    skyBox.position.y = 50;
    scene.add(skyBox);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 1, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;
    scene.add(spotLight);

    controls = new THREE.PointerLockControls(camera);
    var blocker = document.getElementById('blocker');
    var instructions = document.getElementById('instructions');
    instructions.addEventListener('click', function () {
        controls.lock();
    }, false);
    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });
    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    scene.add(controls.getObject());

    var onKeyDown = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 90: // z
                moveForward = true;
                break;
            case 37: // left
            case 81: // q
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
        }
    };

    var onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 90: // z
                moveForward = false;
                break;
            case 37: // left
            case 81: // q
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    var swordgeometry = new THREE.BoxGeometry(0.1, 30, 1);
    const swordTexture = new THREE.TextureLoader().load("static/textures/metal.jpg");
    const swordcolTexture = new THREE.TextureLoader().load("static/textures/rock.jpg");

    var materialsword = new THREE.MeshBasicMaterial({ map: swordTexture, dithering: true });
    var materialcol = new THREE.MeshBasicMaterial({ map: swordcolTexture, dithering: true });
    sword = new THREE.Mesh(swordgeometry, materialsword);
    var colgeometry = new THREE.BoxGeometry(0.3, 1, 5);
    col = new THREE.Mesh(colgeometry, materialcol);
    swordgr = new THREE.Group();
    swordgr.add(sword, col);
    swordgr.position.z = controls.getObject().position.z - 7;
    swordgr.position.y = controls.getObject().position.y - 13;
    swordgr.position.x = controls.getObject().position.x + 7;

    var sound_sword_swing = new THREE.PositionalAudio(listener);
    var audioLoader_sword_swing = new THREE.AudioLoader();
    audioLoader_sword_swing.load('static/sounds/sword_swing.ogg', function (buffer) {
        sound_sword_swing.setBuffer(buffer);
        sound_sword_swing.setRefDistance(20);
    });
    swordgr.add(sound_sword_swing);
    controls.getObject().add(swordgr);

    let start_pos = swordgr.rotation.x;
    let animate_sword = false;
    let sword_end_first_pos = false;
    document.addEventListener('click', () => {
        if (!animate_sword) {
            sound_sword_swing.play();
            animate_sword = true;
            let start_sword_anim = setInterval(() => {
                if (swordgr.rotation.x > -2 && !sword_end_first_pos) {
                    swordgr.rotation.x -= 0.06;
                } else {
                    sword_end_first_pos = true;
                    swordgr.rotation.x += 0.06;
                    if (swordgr.rotation.x >= 0.1) {
                        sword_end_first_pos = false;
                        animate_sword = false;
                        clearInterval(start_sword_anim);
                    }
                }
                console.log(start_pos);
            }, 0);
        }
    });

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

    // floor

    var floorGeometry = new THREE.PlaneBufferGeometry(500, 500, 20, 20);
    floorGeometry.rotateX(- Math.PI / 2);

    // vertex displacement

    var position = floorGeometry.attributes.position;

    for (var i = 0, l = position.count; i < l; i++) {
        vertex.fromBufferAttribute(position, i);
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 4;
        vertex.z += Math.random() * 20 - 10;
        vertex.receiveShadow = true;
        vertex.castShadow = false;
        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    position = floorGeometry.attributes.position;

    const floorTexture = new THREE.TextureLoader().load("static/textures/grass.jpg");
    var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, dithering: true });

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.castShadow = false;
    floor.receiveShadow = true;

    scene.add(floor);

    function rotate(avatar) {
        if (!avatar.initrotate) {
            avatar.initrotate = true;
            if (avatar.rotation.z > 3.125) {
                avatar.rotaMin = Math.random() * 3.125;
                avatar.rotatePlus = setInterval(() => {
                    avatar.rotation.z -= 0.025;
                    if (avatar.rotation.z <= avatar.rotaMin) {
                        console.log(avatar.initrotate);
                        clearInterval(avatar.rotatePlus);
                        avatar.rotatePlus = setInterval(() => { }, 100000);
                        avatar.initrotate = false;
                        avatar.j = 0;
                    }
                }, 0);
            } else if (avatar.rotation.z < 3.125) {
                avatar.rotaMax = Math.random() * 6.15;
                avatar.rotateMoin = setInterval(() => {
                    avatar.rotation.z += 0.025;
                    if (avatar.rotation.z >= avatar.rotaMax) {
                        clearInterval(avatar.rotateMoin);
                        avatar.rotateMin = setInterval(() => { }, 100000);
                        avatar.initrotate = false;
                        avatar.j = 0;
                    }
                }, 0);
            }
        }
    }

    for (var i = 0; i < 15; i++) {
        var loadering = new THREE.ColladaLoader();
        loadering.load('static/models/monster/Wolf_dae.dae', function (collada) {
            var avatar = collada.scene;
            collada.scene.traverse(function (node) {
                if (node.isMesh && node.name == "Wolf_obj_body") {
                    node.material = new THREE.MeshBasicMaterial({ map: new THREE.ImageUtils.loadTexture('static/models/monster/Wolf_Body.jpg') });
                }
                if (node.isMesh && node.name == "Wolf_obj_fur") {
                    node.material = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('static/models/monster/Wolf_Fur.jpg') });
                }
            });
            avatar.position.x = Math.floor(Math.random() * (250 - (-250)) + (-250));
            avatar.position.y = 2;
            avatar.position.z = Math.floor(Math.random() * (250 - (-250)) + (-250));


            let size = (Math.floor(Math.random() * 5) + 7);
            avatar.scale.set(size, size, size);
            avatarList.push(avatar);
            avatar.rotation.x -= 0.04;
            avatar.rotation.z -= Math.random() * -6.25;

            avatar.initrotate = false;

            avatar.k = 0;
            avatar.j = 0;
            setInterval(() => {
                avatar.k++;
                if (avatar.k < 100) {
                    avatar.rotation.x += 0.002;
                } else {
                    if (avatar.k == 200) {
                        avatar.k = 0;
                    }
                    avatar.rotation.x -= 0.002;
                }
                avatar.j = avatar.j + 1;
                if (avatar.j < 1000 && !avatar.initrotate) {
                    if (avatar.rotation.z >= 5.43875 || avatar.rotation.z <= 0.78125) {
                        if (avatar.position.z >= 250) {
                            rotate(avatar);
                        }
                        avatar.position.z += 0.08;
                    } else if (avatar.rotation.z >= 0.78125 && avatar.rotation.z <= 2.34375) {
                        if (avatar.position.x >= 250 || avatar.position.z <= -250) {
                            rotate(avatar);
                        }
                        avatar.position.x += 0.04;
                        avatar.position.z -= 0.04;
                    } else if (avatar.rotation.z >= 2.34375 && avatar.rotation.z <= 3.90625) {
                        if (avatar.position.z <= -250) {
                            rotate(avatar);
                        }
                        avatar.position.z -= 0.05;
                    } else if (avatar.rotation.z >= 3.90625 && avatar.rotation.z <= 5.43875) {
                        if (avatar.position.x <= -250) {
                            rotate(avatar);
                        }
                        avatar.position.x -= 0.08;
                    }
                } else {
                    rotate(avatar);
                }
            }, 0);
            scene.add(avatar);
        });
    }

    for (var i = 0; i < 10; i++) {
        var sword_power = new THREE.Mesh(swordgeometry, materialsword);
        sword_power.position.z = Math.floor(Math.random() * 20 - 10) * 20;
        sword_power.position.y = controls.getObject().position.y - 13;
        sword_power.position.x = Math.floor(Math.random() * 20 - 10) * 20;
        scene.add(sword_power);
    }
    setInterval(() => {
        sword_power.rotation.y += 1;
    }, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canva').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    var originPoint = controls.getObject().position.clone();
    for (var vertexIndex = 0; vertexIndex < sword.geometry.vertices.length; vertexIndex++) {
        var localVertex = sword.geometry.vertices[vertexIndex].clone();
        var globalVertex = localVertex.applyMatrix4(sword.matrix);
        var directionVector = globalVertex.sub(sword.position);

        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(avatarList);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            console.log("hit");
        }
    }

    if (controls.isLocked === true) {
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects(objects);

        var onObject = intersections.length > 0;

        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 12 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y - 10);
            canJump = true;
        }

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    }
    renderer.render(scene, camera);
}