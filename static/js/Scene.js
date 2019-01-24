//Declaring global objects
let camera, scene, renderer, controls, skybox, raycaster, sword, hit_box_player, player_health, merchant, hit_box_sword;

let gravity = 150;
let speed = 400;
let money = 0;

let objects = [];
let monster_list = [];
let power_list = [];
let test_array = [];
let market_list = [];

let move_forward = false;
let move_backward = false;
let move_left = false;
let move_right = false;
let can_jump = false;
let damage_timer = false;
let power_timer = false;
let attack_timer = false;
let create_wolf_timer = false;
let dead_wolf_timer = false;
let buying_action = false;

let prev_time = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let color = new THREE.Color();


//Declaring the power objects
//Money
const hit_box_money_geometry = new THREE.CubeGeometry(2, 10, 2, 1, 1, 1);
const hit_box_money_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
const power_money_geometry = new THREE.SphereGeometry(1, 32, 32);
const power_money_material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

function spawn_money(posz, posx, posy) {
    let money_power = new THREE.Mesh(power_money_geometry, power_money_material);
    money_power.position.z = posz;
    money_power.position.y = posy;
    money_power.position.x = posx;

    //setting up the money hit box
    money_power.hit_box_money = new THREE.Mesh(hit_box_money_geometry, hit_box_money_material);
    money_power.hit_box_money.name = "power_money";
    money_power.add(money_power.hit_box_money);

    power_list.push(money_power.hit_box_money);
    scene.add(money_power);
}

//Health
const hit_box_health_geometry = new THREE.CubeGeometry(2, 10, 2, 1, 1, 1);
const hit_box_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
const power_health_geometry = new THREE.SphereGeometry(1, 32, 32);
const power_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

function spawn_health(posz, posx, posy) {
    let health_rng = Math.floor(Math.random() * (20 - 1) + 1);
    if (health_rng >= 5) {
        let health_power = new THREE.Mesh(power_health_geometry, power_health_material);
        health_power.position.z = posz;
        health_power.position.y = posy;
        health_power.position.x = posx;

        //setting up the health hit box
        health_power.hit_box_health = new THREE.Mesh(hit_box_health_geometry, hit_box_health_material);
        health_power.hit_box_health.name = "power_health";
        health_power.add(health_power.hit_box_health);

        power_list.push(health_power.hit_box_health);
        scene.add(health_power);
    }
}

//Speed
const hit_box_speed_geometry = new THREE.CubeGeometry(2, 10, 2, 1, 1, 1);
const hit_box_speed_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
const power_speed_geometry = new THREE.SphereGeometry(1, 32, 32);
const power_speed_material = new THREE.MeshBasicMaterial({ color: 0x0000ff });

function spawn_speed(posz, posx, posy) {
    let speed_power = new THREE.Mesh(power_speed_geometry, power_speed_material);
    speed_power.position.z = posz;
    speed_power.position.y = posy;
    speed_power.position.x = posx;

    //setting up the speed hit box
    speed_power.hit_box_speed = new THREE.Mesh(hit_box_speed_geometry, hit_box_speed_material);
    speed_power.hit_box_speed.name = "power_speed";
    speed_power.add(speed_power.hit_box_speed);
    power_list.push(speed_power.hit_box_speed);
    scene.add(speed_power);
}

//Jump
const hit_box_jump_geometry = new THREE.CubeGeometry(2, 10, 2, 1, 1, 1);
const hit_box_jump_material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
const power_jump_geometry = new THREE.SphereGeometry(1, 32, 32);
const power_jump_material = new THREE.MeshBasicMaterial({ color: 0x00ffff });

function spawn_jump(posz, posx, posy) {
    let jump_power = new THREE.Mesh(power_jump_geometry, power_jump_material);
    jump_power.position.z = posz;
    jump_power.position.y = posy;
    jump_power.position.x = posx;

    //setting up the jump hit box
    jump_power.hit_box_jump = new THREE.Mesh(hit_box_jump_geometry, hit_box_jump_material);
    jump_power.hit_box_jump.name = "power_jump";
    jump_power.add(jump_power.hit_box_jump);
    power_list.push(jump_power.hit_box_jump);
    scene.add(jump_power);
}

//Declaring functions for monsters
function rotate(monster) {
    if (!monster.initrotate) {
        monster.initrotate = true;
        if (monster.rotation.y > 3.125) {
            monster.rotaMin = Math.random() * 3.125;
            monster.rotatePlus = setInterval(() => {
                monster.rotation.y -= 0.025;
                if (monster.rotation.y <= monster.rotaMin) {
                    clearInterval(monster.rotatePlus);
                    monster.rotatePlus = setInterval(() => { }, 100000);
                    monster.initrotate = false;
                    monster.walking_distance = 0;
                }
            }, 0);
        } else if (monster.rotation.y < 3.125) {
            monster.rotaMax = Math.random() * 6.15;
            monster.rotateMoin = setInterval(() => {
                monster.rotation.y += 0.025;
                if (monster.rotation.y >= monster.rotaMax) {
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
const hit_box_wolf_geometry = new THREE.CubeGeometry(50, 50, 50, 1, 1, 1);
const hit_box_wolf_material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
//Function to create wolves
function create_wolves() {
    for (let i = 0; i < 2; i++) {
        //Loading the model
        let wolf_loader = new THREE.GLTFLoader();
        wolf_loader.load('static/models/monster/scene.gltf', function (collada) {
            var monster = collada.scene;
            monster.position.x = Math.floor(Math.random() * (250 - (-250)) + (-250));
            monster.position.y = 7;
            monster.position.z = Math.floor(Math.random() * (250 - (-250)) + (-250));

            //setting up the wolf hit box
            monster.name = `${i}_wolf`;
            monster.hit_box_wolf = new THREE.Mesh(hit_box_wolf_geometry, hit_box_wolf_material);
            monster.hit_box_wolf.name = `${i}_wolf_hit_box`;
            monster_list.push(monster.hit_box_wolf);
            monster.castShadow = true;
            monster.add(monster.hit_box_wolf);

            //setting up the random wolf size
            let size = (Math.floor(Math.random() * 0.05) + 0.2);
            monster.scale.set(size, size, size);
            monster.rotation.x -= 0.04;
            monster.rotation.y -= Math.random() * -6.25;

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
                    if (monster.rotation.y >= 5.43875 || monster.rotation.y <= 0.78125) {
                        if (monster.position.z >= 250) {
                            rotate(monster);
                        }
                        monster.position.z += 0.08;
                    } else if (monster.rotation.y >= 0.78125 && monster.rotation.y <= 2.34375) {
                        if (monster.position.x >= 250 || monster.position.z <= -250) {
                            rotate(monster);
                        }
                        monster.position.x += 0.04;
                        monster.position.z -= 0.04;
                    } else if (monster.rotation.y >= 2.34375 && monster.rotation.y <= 3.90625) {
                        if (monster.position.z <= -250) {
                            rotate(monster);
                        }
                        monster.position.z -= 0.05;
                    } else if (monster.rotation.y >= 3.90625 && monster.rotation.y <= 5.43875) {
                        if (monster.position.x <= -250) {
                            rotate(monster);
                        }
                        monster.position.x -= 0.08;
                    }
                } else {
                    rotate(monster);
                }
            }, 0);
            console.log(monster)
            scene.add(monster);
        });
    }
}

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
    spot_light.position.set(0, 200, 0);
    spot_light.castShadow = true;
    spot_light.shadow.mapSize.width = 1024;
    spot_light.shadow.mapSize.height = 1024;
    spot_light.shadow.camera.near = 500;
    spot_light.shadow.camera.far = 4000;
    spot_light.shadow.camera.fov = 30;

    scene.add(spot_light);

    var light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 0);
    light.castShadow = true;            // default false
    scene.add(light);

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

    // //Declaring merchant place
    // let pass_geometry = new THREE.CubeGeometry(1, 10, 20, 1, 1, 1);
    let pass_material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    // pass = new THREE.Mesh(pass_geometry, pass_material);
    // pass2 = new THREE.Mesh(pass_geometry, pass_material);
    // pass2.position.y = 0;
    // pass2.position.x = 20;
    // pass2.position.z = 0;
    // pass3 = new THREE.Mesh(pass_geometry, pass_material);
    // pass3.rotation.y = 1.5;
    // pass3.position.x = 10;
    // pass3.position.z = -10;

    // market_list.push(pass, pass2, pass3);

    let pass_geometry2 = new THREE.CubeGeometry(10, 10, 10, 1, 1, 1);
    merchant = new THREE.Mesh(pass_geometry2, pass_material);
    merchant.position.x = 10;
    merchant.position.z = 2.5;

    // const wall_texture = new THREE.TextureLoader().load("static/textures/grass.jpg");
    // let wall_material = new THREE.MeshBasicMaterial({ map: wall_texture, dithering: true });
    // wall = new THREE.Mesh(pass_geometry, wall_material);
    // wall2 = new THREE.Mesh(pass_geometry, wall_material);
    // wall3 = new THREE.Mesh(pass_geometry, wall_material);
    // wall2.position.y = 0;
    // wall2.position.x = 20;
    // wall2.position.z = 0;
    // wall3.rotation.y = 1.5;
    // wall3.position.x = 10;
    // wall3.position.z = -10;

    let merchant_place = new THREE.Group();
    merchant_place.add(merchant);

    merchant_place.position.y = 5;
    merchant_place.position.x = 30;
    merchant_place.position.z = -30;
    merchant_place.rotation.y = 5.5;

    scene.add(merchant_place);

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

    //Declaring the sword object, it's a global object
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

    //Declaring health bar
    player_health_group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
        var heartShape = new THREE.Shape();
        heartShape.moveTo(25, 25);
        heartShape.bezierCurveTo(25, 25, 20, 0, 0, 0);
        heartShape.bezierCurveTo(30, 0, 30, 35, 30, 35);
        heartShape.bezierCurveTo(30, 55, 10, 77, 25, 95);
        heartShape.bezierCurveTo(60, 77, 80, 55, 80, 35);
        heartShape.bezierCurveTo(80, 35, 80, 0, 50, 0);
        heartShape.bezierCurveTo(35, 0, 25, 25, 25, 25);
        var extrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
        let player_health_geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        let player_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        player_health = new THREE.Mesh(player_health_geometry, player_health_material);

        player_health.scale.set(0.02, 0.02, 0.02);
        player_health.rotation.z = 3.154;
        player_health.position.x = i;
        player_health_group.add(player_health);
    }
    player_health_group.position.z = controls.getObject().position.z - 10;
    player_health_group.position.y = controls.getObject().position.y - 15;
    player_health_group.position.x = controls.getObject().position.x - 13;

    sword_group.castShadow = true;
    sword_group.receiveShadow = false;
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
    const floor_material = new THREE.MeshPhongMaterial({ map: floor_texture });
    let floor = new THREE.Mesh(floor_geometry, floor_material);
    floor.castShadow = false;
    floor.receiveShadow = true;
    scene.add(floor);

    //Declaring test hit box
    const hit_box_test_geometry = new THREE.CubeGeometry(10, 10, 10, 1, 1, 1);
    const hit_box_test_material = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0, transparent: 0 });
    let hit_box_test = new THREE.Mesh(hit_box_test_geometry, hit_box_test_material);

    const test_texture = new THREE.TextureLoader().load("static/textures/rock.jpg");
    const test_material = new THREE.MeshBasicMaterial({ map: test_texture, dithering: true });
    let test = new THREE.Mesh(hit_box_test_geometry, test_material);

    hit_box_test.position.y = 5;
    hit_box_test.position.x = 0;
    hit_box_test.position.z = -30;

    test.position.y = 5;
    test.position.x = 0;
    test.position.z = -30;
    test_array.push(hit_box_test);
    test.castShadow = true;
    test.receiveShadow = false;
    scene.add(hit_box_test, test);

    //Finnaly setting up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
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

    //Declaration attack sword
    document.addEventListener('click', () => {
        if (!attack_timer) {
            attack_timer = true;
            let hit_box_sword_geometry = new THREE.CubeGeometry(2, 10, 25, 1, 1, 1);
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
                        instructions.innerHTML = 'YOU ARE DEAD<br>Press F5 to replay';
                        controls.unlock();
                    }, 0);
                }
                player_health_group.remove(player_health_group.children[player_health_group.children.length - 1]);
                damage_timer = true;
                setTimeout(() => { damage_timer = false; }, 1000);
            }
        }
    }


    if (hit_box_sword != null && hit_box_sword.position.y != -100) {
        let sword_point = hit_box_sword.position.clone();

        //Setting up merchant seller event
        for (let vertex_index = 0; vertex_index < hit_box_sword.geometry.vertices.length; vertex_index++) {
            let local_vertex = hit_box_sword.geometry.vertices[vertex_index].clone();
            let global_vertex = local_vertex.applyMatrix4(hit_box_sword.matrix);
            let direction_vector = global_vertex.sub(hit_box_sword.position);
            let collision_raycaster = new THREE.Raycaster(sword_point, direction_vector.clone().normalize());
            let collision_results = collision_raycaster.intersectObject(merchant);
            if (collision_results.length > 0 && direction_vector.length() < 16 && collision_results[0].distance < direction_vector.length()) {
                if (!buying_action) {
                    buying_action = true;
                    if (money >= 20) {
                        money -= 20;
                        document.getElementById('money').innerHTML = money + " Money";
                        spawn_speed(collision_results[0].object.parent.position.z + Math.random() * 30, collision_results[0].object.parent.position.x + Math.random() * (20 + 5), collision_results[0].object.parent.position.y + 0.5);
                        spawn_jump(collision_results[0].object.parent.position.z + Math.random() * 30, collision_results[0].object.parent.position.x + Math.random() * (20 + 5), collision_results[0].object.parent.position.y + 0.5);
                    }
                    setTimeout(() => { buying_action = false; }, 500);
                }
            }
        }

        //Setting up monster creation collision event
        for (let vertex_index = 0; vertex_index < hit_box_sword.geometry.vertices.length; vertex_index++) {
            let local_vertex = hit_box_sword.geometry.vertices[vertex_index].clone();
            let global_vertex = local_vertex.applyMatrix4(hit_box_sword.matrix);
            let direction_vector = global_vertex.sub(hit_box_sword.position);
            let collision_raycaster = new THREE.Raycaster(sword_point, direction_vector.clone().normalize());
            let collision_results = collision_raycaster.intersectObjects(test_array);
            if (collision_results.length > 0 && direction_vector.length() < 16 && collision_results[0].distance < direction_vector.length()) {
                if (!create_wolf_timer) {
                    create_wolves();
                    create_wolf_timer = true;
                    setTimeout(() => { create_wolf_timer = false; }, 1000);
                }
            }
        }

        //Setting up sword attack collision
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
                        spawn_health(collision_results[0].object.parent.position.z, collision_results[0].object.parent.position.x, collision_results[0].object.parent.position.y + 2);
                        spawn_money(collision_results[0].object.parent.position.z + 3, collision_results[0].object.parent.position.x, collision_results[0].object.parent.position.y + 2);

                        let wolf_obj = collision_results[0].object.parent;
                        for (let h = 0; h < monster_list.length; h++) {
                            if (monster_list[h] != null) {
                                if (monster_list[h] == wolf_obj.children[1]) {
                                    monster_list.splice(h, 1);
                                }
                            }
                        }
                        for (let d = 0; d < wolf_obj.children; d++) {
                            if (wolf_obj.children[d] != null) {
                                wolf_obj.remove(wolf_obj.children[d]);
                            }
                        }
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
        let collision_results = collision_raycaster.intersectObjects(power_list);
        if (collision_results.length > 0 && collision_results[0].distance < direction_vector.length()) {
            if (!power_timer) {
                power_timer = true;
                if (collision_results[0].object.parent != null && collision_results[0].object.name.indexOf('power_health') != -1) {
                    let health_obj = collision_results[0].object.parent;
                    health_obj.remove(health_obj.children[0]);
                    scene.remove(health_obj);
                    if (player_health_group.children.length <= 10) {
                        let heartShape = new THREE.Shape();
                        heartShape.moveTo(25, 25);
                        heartShape.bezierCurveTo(25, 25, 20, 0, 0, 0);
                        heartShape.bezierCurveTo(30, 0, 30, 35, 30, 35);
                        heartShape.bezierCurveTo(30, 55, 10, 77, 25, 95);
                        heartShape.bezierCurveTo(60, 77, 80, 55, 80, 35);
                        heartShape.bezierCurveTo(80, 35, 80, 0, 50, 0);
                        heartShape.bezierCurveTo(35, 0, 25, 25, 25, 25);
                        let extrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
                        let player_health_geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
                        let player_health_material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                        player_health = new THREE.Mesh(player_health_geometry, player_health_material);
                        player_health.scale.set(0.02, 0.02, 0.02);
                        player_health.rotation.z = 3.154;
                        player_health.position.x = player_health_group.children.length;
                        player_health_group.add(player_health);
                    }
                }
                else if (collision_results[0].object.parent != null && collision_results[0].object.name.indexOf('power_speed') != -1) {
                    let speed_obj = collision_results[0].object.parent;
                    speed_obj.remove(speed_obj.children[0]);
                    scene.remove(speed_obj);
                    if (speed <= 1200) {
                        speed += 10;
                    }
                }
                else if (collision_results[0].object.parent != null && collision_results[0].object.name.indexOf('power_jump') != -1) {
                    let jump_obj = collision_results[0].object.parent;
                    jump_obj.remove(jump_obj.children[0]);
                    scene.remove(jump_obj);
                    if (gravity >= 10) {
                        gravity -= 10;
                    }
                }
                else if (collision_results[0].object.parent != null && collision_results[0].object.name.indexOf('power_money') != -1) {
                    let jump_obj = collision_results[0].object.parent;
                    jump_obj.remove(jump_obj.children[0]);
                    scene.remove(jump_obj);
                    money += 10;
                    document.getElementById("money").innerHTML = `${money} Money`;
                }
                power_timer = false;
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
        velocity.y -= 12 * gravity * delta;
        direction.z = Number(move_forward) - Number(move_backward);
        direction.x = Number(move_left) - Number(move_right);
        direction.normalize();

        if (move_forward || move_backward) {
            velocity.z -= direction.z * speed * delta;
        }
        if (move_left || move_right) {
            velocity.x -= direction.x * speed * delta;
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