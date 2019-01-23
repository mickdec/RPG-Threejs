//Declaring global objects
let camera, scene, renderer, controls, skybox, raycaster, sword, hit_box_player, player_health;

let objects = [];
let monster_list = [];
let health_power_list = [];
let hit_box_sword;

let move_forward = false;
let move_backward = false;
let move_left = false;
let move_right = false;
let can_jump = false;
let damage_timer = false;
let health_timer = false;
let attack_timer = false;
let dead_wolf_timer = false;

let prev_time = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let color = new THREE.Color();

init();
animate();

function init() {
    //Declaring scene, it's a global object
    scene = new THREE.Scene();

    //Declaring camera, it's a global object
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    //Declaring listener for the camera sounds
    let listener = new THREE.AudioListener();
    camera.add(listener);

    //Declaring the global ambiant sound
    let ambiant_sound = new THREE.Audio(listener);
    let ambiant_sound_loader = new THREE.AudioLoader();
    ambiant_sound_loader.load('static/sounds/ambiance.ogg', function (buffer) {
        ambiant_sound.setBuffer(buffer);
        ambiant_sound.setLoop(true);
        ambiant_sound.setVolume(0.5);
        ambiant_sound.play();
    });

    //Declaring the skybox, it's a global object
    const skybox_image_path = "static/textures/skybox/hills2_";
    const skybox_directions = ["ft", "bk", "up", "dn", "rt", "lf"];
    const skybox_image_type = ".jpg";
    let skybox_materials = [];
    for (let i = 0; i < 6; i++) {
        skybox_materials.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(skybox_image_path + skybox_directions[i] + skybox_image_type),
            side: THREE.BackSide
        }));
    }
    let sky_geometry = new THREE.CubeGeometry(1000, 1000, 1000);
    let sky_material = new THREE.MeshFaceMaterial(skybox_materials);
    skybox = new THREE.Mesh(sky_geometry, sky_material);
    skybox.position.y = 50;
    scene.add(skybox);

    //Declaring the spotlight
    var spot_light = new THREE.SpotLight(0xffffff);
    spot_light.position.set(0, 1, 0);
    spot_light.castShadow = true;
    spot_light.shadow.mapSize.width = 1024;
    spot_light.shadow.mapSize.height = 1024;
    spot_light.shadow.camera.near = 500;
    spot_light.shadow.camera.far = 4000;
    spot_light.shadow.camera.fov = 30;
    scene.add(spot_light);

    //Declaring controls, controls is declaring as a global object
    controls = new THREE.PointerLockControls(camera);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
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

    //Declaring hit box of the player, it's a global object
    let hit_box_player_geometry = new THREE.CubeGeometry(10, 10, 10, 1, 1, 1);
    let hit_box_player_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
    hit_box_player = new THREE.Mesh(hit_box_player_geometry, hit_box_player_material);
    controls.getObject().add(hit_box_player);
    scene.add(controls.getObject());

    //Declaring movement trigger functions and the raycaster, raycaster is a global variable
    controls_raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);
    let on_key_down = (event) => {
        switch (event.keyCode) {
            case 38: // up
            case 90: // z
                move_forward = true;
                break;
            case 37: // left
            case 81: // q
                move_left = true;
                break;
            case 40: // down
            case 83: // s
                move_backward = true;
                break;
            case 39: // right
            case 68: // d
                move_right = true;
                break;
            case 32: // space
                if (can_jump === true) velocity.y += 350;
                can_jump = false;
                break;
        }
    };

    let on_key_up = (event) => {
        switch (event.keyCode) {
            case 38: // up
            case 90: // z
                move_forward = false;
                break;
            case 37: // left
            case 81: // q
                move_left = false;
                break;
            case 40: // down
            case 83: // s
                move_backward = false;
                break;
            case 39: // right
            case 68: // d
                move_right = false;
                break;
        }
    };

    document.addEventListener('keydown', on_key_down, false);
    document.addEventListener('keyup', on_key_up, false);

    //Declaring the sword object its a global object
    let sword_geometry = new THREE.BoxGeometry(0.1, 30, 1);
    const sword_texture = new THREE.TextureLoader().load("static/textures/metal.jpg");
    let material_sword = new THREE.MeshBasicMaterial({ map: sword_texture, dithering: true });
    sword = new THREE.Mesh(sword_geometry, material_sword);

    let guard_geometry = new THREE.BoxGeometry(0.3, 1, 5);
    const sword_guard_Texture = new THREE.TextureLoader().load("static/textures/rock.jpg");
    let material_guard = new THREE.MeshBasicMaterial({ map: sword_guard_Texture, dithering: true });
    guard = new THREE.Mesh(guard_geometry, material_guard);

    sword_group = new THREE.Group();
    sword_group.add(sword, guard);
    sword_group.position.z = controls.getObject().position.z - 7;
    sword_group.position.y = controls.getObject().position.y - 13;
    sword_group.position.x = controls.getObject().position.x + 7;

    let sound_sword_swing = new THREE.PositionalAudio(listener);
    let audioLoader_sword_swing = new THREE.AudioLoader();
    audioLoader_sword_swing.load('static/sounds/sword_swing.ogg', function (buffer) {
        sound_sword_swing.setBuffer(buffer);
        sound_sword_swing.setRefDistance(20);
    });
    sword_group.add(sound_sword_swing);

    player_health_group = new THREE.Group();

    for (let i = 0; i < 4; i++) {
        let player_health_geometry = new THREE.SphereGeometry(0.5, 32, 32);
        let player_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        player_health = new THREE.Mesh(player_health_geometry, player_health_material);

        player_health.position.x = i + i;
        player_health.position.z = i / 30;
        player_health_group.add(player_health);
    }

    player_health_group.position.z = controls.getObject().position.z - 10;
    player_health_group.position.y = controls.getObject().position.y - 15;
    player_health_group.position.x = controls.getObject().position.x - 15;

    controls.getObject().add(player_health_group, sword_group);

    //Declaring the sword animation
    let start_pos = sword_group.rotation.x;
    let animate_sword = false;
    let sword_end_first_pos = false;
    document.addEventListener('click', () => {
        if (!animate_sword) {
            sound_sword_swing.play();
            animate_sword = true;

            let start_sword_anim = setInterval(() => {
                if (sword_group.rotation.x > -2 && !sword_end_first_pos) {
                    sword_group.rotation.x -= 0.06;
                } else {
                    sword_end_first_pos = true;
                    sword_group.rotation.x += 0.06;
                    if (sword_group.rotation.x >= 0.1) {
                        sword_end_first_pos = false;
                        animate_sword = false;
                        sword_group.rotation.x = start_pos;
                        clearInterval(start_sword_anim);
                    }
                }
            }, 0);
        }
    });

    //Declaring the floor
    let floor_geometry = new THREE.PlaneBufferGeometry(500, 500, 20, 20);
    floor_geometry.rotateX(- Math.PI / 2);
    let vertex_position = floor_geometry.attributes.position;
    for (var i = 0, l = vertex_position.count; i < l; i++) {
        vertex.fromBufferAttribute(vertex_position, i);
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 4;
        vertex.z += Math.random() * 20 - 10;
        vertex.receiveShadow = true;
        vertex.castShadow = false;
        vertex_position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    floor_geometry = floor_geometry.toNonIndexed();
    vertex_position = floor_geometry.attributes.position;
    const floor_texture = new THREE.TextureLoader().load("static/textures/grass.jpg");
    const floor_material = new THREE.MeshBasicMaterial({ map: floor_texture, dithering: true });
    let floor = new THREE.Mesh(floor_geometry, floor_material);
    floor.castShadow = false;
    floor.receiveShadow = true;
    scene.add(floor);

    //Declaring functions for monsters
    function rotate(monster) {
        if (!monster.initrotate) {
            monster.initrotate = true;
            if (monster.rotation.z > 3.125) {
                monster.rotaMin = Math.random() * 3.125;
                monster.rotatePlus = setInterval(() => {
                    monster.rotation.z -= 0.025;
                    if (monster.rotation.z <= monster.rotaMin) {
                        clearInterval(monster.rotatePlus);
                        monster.rotatePlus = setInterval(() => { }, 100000);
                        monster.initrotate = false;
                        monster.walking_distance = 0;
                    }
                }, 0);
            } else if (monster.rotation.z < 3.125) {
                monster.rotaMax = Math.random() * 6.15;
                monster.rotateMoin = setInterval(() => {
                    monster.rotation.z += 0.025;
                    if (monster.rotation.z >= monster.rotaMax) {
                        clearInterval(monster.rotateMoin);
                        monster.rotateMin = setInterval(() => { }, 100000);
                        monster.initrotate = false;
                        monster.walking_distance = 0;
                    }
                }, 0);
            }
        }
    }

    //Declaring wolves hit box
    const hit_box_wolf_geometry = new THREE.CubeGeometry(0.3, 1, 3, 1, 1, 1);
    const hit_box_wolf_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });

    //Declaring all the wolves
    for (let i = 0; i < 15; i++) {
        //Loading the model
        let wolf_loader = new THREE.ColladaLoader();
        wolf_loader.load('static/models/monster/Wolf_dae.dae', function (collada) {
            var monster = collada.scene;
            //setting up the model texture
            collada.scene.traverse(function (node) {
                if (node.isMesh && node.name == "Wolf_obj_body") {
                    node.material = new THREE.MeshBasicMaterial({ map: new THREE.ImageUtils.loadTexture('static/models/monster/Wolf_Body.jpg') });
                }
                if (node.isMesh && node.name == "Wolf_obj_fur") {
                    node.material = new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture('static/models/monster/Wolf_Fur.jpg') });
                }
            });
            //setting up the model random position
            monster.position.x = Math.floor(Math.random() * (250 - (-250)) + (-250));
            monster.position.y = 2;
            monster.position.z = Math.floor(Math.random() * (250 - (-250)) + (-250));

            //setting up the wolf hit box
            monster.name = `${i}_wolf`;
            monster.hit_box_wolf = new THREE.Mesh(hit_box_wolf_geometry, hit_box_wolf_material);
            monster.hit_box_wolf.name = `${i}_wolf_hit_box`;
            monster_list.push(monster.hit_box_wolf);
            monster.add(monster.hit_box_wolf);

            //setting up the random wolf size
            let size = (Math.floor(Math.random() * 5) + 7);
            monster.scale.set(size, size, size);
            monster.rotation.x -= 0.04;
            monster.rotation.z -= Math.random() * -6.25;

            //setting up all the process for the wolf movement pattern
            monster.initrotate = false;
            monster.rotating_loop = 0;
            monster.walking_distance = 0;
            setInterval(() => {
                monster.rotating_loop++;
                if (monster.rotating_loop < 100) {
                    monster.rotation.x += 0.002;
                } else {
                    if (monster.rotating_loop == 200) {
                        monster.rotating_loop = 0;
                    }
                    monster.rotation.x -= 0.002;
                }
                monster.walking_distance = monster.walking_distance + 1;
                if (monster.walking_distance < 1000 && !monster.initrotate) {
                    if (monster.rotation.z >= 5.43875 || monster.rotation.z <= 0.78125) {
                        if (monster.position.z >= 250) {
                            rotate(monster);
                        }
                        monster.position.z += 0.08;
                    } else if (monster.rotation.z >= 0.78125 && monster.rotation.z <= 2.34375) {
                        if (monster.position.x >= 250 || monster.position.z <= -250) {
                            rotate(monster);
                        }
                        monster.position.x += 0.04;
                        monster.position.z -= 0.04;
                    } else if (monster.rotation.z >= 2.34375 && monster.rotation.z <= 3.90625) {
                        if (monster.position.z <= -250) {
                            rotate(monster);
                        }
                        monster.position.z -= 0.05;
                    } else if (monster.rotation.z >= 3.90625 && monster.rotation.z <= 5.43875) {
                        if (monster.position.x <= -250) {
                            rotate(monster);
                        }
                        monster.position.x -= 0.08;
                    }
                } else {
                    rotate(monster);
                }
            }, 0);
            scene.add(monster);
        });
    }

    //Declaring the power objects

    //Health
    //Declaring health hit box
    const hit_box_health_geometry = new THREE.CubeGeometry(2, 10, 2, 1, 1, 1);
    const hit_box_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
    let power_health_geometry = new THREE.SphereGeometry(1, 32, 32);
    let power_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    for (var i = 0; i < 10; i++) {
        var health_power = new THREE.Mesh(power_health_geometry, power_health_material);
        health_power.position.z = Math.floor(Math.random() * 20 - 10) * 20;
        health_power.position.y = 4;
        health_power.position.x = Math.floor(Math.random() * 20 - 10) * 20;

        //setting up the health hit box
        health_power.hit_box_health = new THREE.Mesh(hit_box_health_geometry, hit_box_health_material);
        health_power_list.push(health_power.hit_box_health);
        health_power.add(health_power.hit_box_health);

        health_power_list.push(health_power.hit_box_health);
        scene.add(health_power);
    }

    //Finnaly setting up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canva').appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
}

//Declaring the windows on resize function
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//Declaring the whole global animation for the scene
function animate() {
    requestAnimationFrame(animate);

    //Setting up the collision detection process
    let origin_point = controls.getObject().position.clone();

    //Setting up monster collision
    for (let vertex_index = 0; vertex_index < hit_box_player.geometry.vertices.length; vertex_index++) {
        let local_vertex = hit_box_player.geometry.vertices[vertex_index].clone();
        let global_vertex = local_vertex.applyMatrix4(hit_box_player.matrix);
        let direction_vector = global_vertex.sub(hit_box_player.position);
        let collision_raycaster = new THREE.Raycaster(origin_point, direction_vector.clone().normalize());
        let collision_results = collision_raycaster.intersectObjects(monster_list);
        if (collision_results.length > 0 && collision_results[0].distance < direction_vector.length()) {
            if (!damage_timer) {
                if (player_health_group.children.length == 1) {
                    setInterval(() => {
                        blocker.style.backgroundColor = "black";
                        blocker.style.display = 'block';
                        instructions.style.display = '';
                        instructions.innerHTML = 'YOUR DEAD<br>Press F5 to replay';
                        controls.unlock();
                    }, 0);
                }
                player_health_group.remove(player_health_group.children[player_health_group.children.length - 1]);
                damage_timer = true;
                setTimeout(() => { damage_timer = false; }, 1000);
            }
        }
    }

    document.addEventListener('click', () => {
        if (!attack_timer) {
            attack_timer = true;
            let hit_box_sword_geometry = new THREE.CubeGeometry(5, 20, 30, 1, 1, 1);
            let hit_box_sword_material = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0, transparent: true });
            hit_box_sword = new THREE.Mesh(hit_box_sword_geometry, hit_box_sword_material);
            hit_box_sword.position.x = controls.getObject().position.x;
            hit_box_sword.position.y = controls.getObject().position.y;
            hit_box_sword.position.z = controls.getObject().position.z;
            hit_box_sword.rotation.x = controls.getObject().rotation.x;
            hit_box_sword.rotation.y = controls.getObject().rotation.y;
            hit_box_sword.rotation.z = controls.getObject().rotation.z;
            scene.add(hit_box_sword);
            setTimeout(() => {
                attack_timer = false;
                hit_box_sword.position.set(0, -100, 0);
                scene.remove(hit_box_sword);
            }, 400)
        }

    })
    //Setting up sword attack collision
    if (hit_box_sword != null && hit_box_sword.position.y != -100) {
        let sword_point = hit_box_sword.position.clone();
        for (let vertex_index = 0; vertex_index < hit_box_sword.geometry.vertices.length; vertex_index++) {
            let local_vertex = hit_box_sword.geometry.vertices[vertex_index].clone();
            let global_vertex = local_vertex.applyMatrix4(hit_box_sword.matrix);
            let direction_vector = global_vertex.sub(hit_box_sword.position);
            let collision_raycaster = new THREE.Raycaster(sword_point, direction_vector.clone().normalize());
            let collision_results = collision_raycaster.intersectObjects(monster_list);
            if (collision_results.length > 0 && collision_results[0].distance < direction_vector.length()) {
                if (!dead_wolf_timer) {
                    dead_wolf_timer = true;
                    if (collision_results[0].object != null && collision_results[0].object.name.indexOf('wolf') != -1) {
                        let wolf_obj = collision_results[0].object.parent;
                        wolf_obj.remove(wolf_obj.children[3]);
                        scene.remove(wolf_obj);
                    }
                    setTimeout(() => {
                        dead_wolf_timer = false;
                    }, 1000);
                }
            }
        }
    }

    //setting up power collision
    for (let vertex_index = 0; vertex_index < hit_box_player.geometry.vertices.length; vertex_index++) {
        let local_vertex = hit_box_player.geometry.vertices[vertex_index].clone();
        let global_vertex = local_vertex.applyMatrix4(hit_box_player.matrix);
        let direction_vector = global_vertex.sub(hit_box_player.position);
        let collision_raycaster = new THREE.Raycaster(origin_point, direction_vector.clone().normalize());
        let collision_results = collision_raycaster.intersectObjects(health_power_list);
        if (collision_results.length > 0 && collision_results[0].distance < direction_vector.length()) {
            if (!health_timer) {
                health_timer = true;
                if (collision_results[0].object.parent != null && collision_results.length == 2) {
                    let health_obj = collision_results[0].object.parent;

                    health_obj.remove(health_obj.children[0]);
                    scene.remove(health_obj);

                    let player_health_geometry = new THREE.SphereGeometry(0.5, 32, 32);
                    let player_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    player_health = new THREE.Mesh(player_health_geometry, player_health_material);
                    player_health.position.x = (player_health_group.children.length - 1) + (player_health_group.children.length - 1);
                    player_health.position.z = (player_health_group.children.length - 1) / 30;
                    player_health_group.add(player_health);
                }
                health_timer = false;
            }
        }
    }

    //Setting up the controls process
    if (controls.isLocked === true) {
        controls_raycaster.ray.origin.copy(controls.getObject().position);
        controls_raycaster.ray.origin.y -= 10;

        let intersections = controls_raycaster.intersectObjects(objects);
        let on_object = intersections.length > 0;
        let time = performance.now();
        let delta = (time - prev_time) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 12 * 100.0 * delta;
        direction.z = Number(move_forward) - Number(move_backward);
        direction.x = Number(move_left) - Number(move_right);
        direction.normalize();

        if (move_forward || move_backward) {
            velocity.z -= direction.z * 400.0 * delta;
        }
        if (move_left || move_right) {
            velocity.x -= direction.x * 400.0 * delta;
        }
        if (on_object === true) {
            velocity.y = Math.max(0, velocity.y - 10);
            can_jump = true;
        }

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            can_jump = true;
        }
        prev_time = time;
    }
    renderer.render(scene, camera);
}