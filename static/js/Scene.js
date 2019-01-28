//Declaring global objects
let camera, scene, renderer, controls, skybox, raycaster, sword, hit_box_player, player_health, merchant_hit_box,
    hit_box_sword, spot_light_sun, spot_light_moon, night_sound, listener, spawner;

let gravity = 150;
let speed = 400;
let money = 50;
let night_count = 0;

document.getElementById("money").innerHTML = `${money} Money`;
document.getElementById("jump").innerHTML = `${gravity} Jump Lvl`;
document.getElementById("speed").innerHTML = `${speed} Speed Lvl`;

let hearth_rng = 70;
let money_rng = 95;
let speed_rng = 50;
let jump_rng = 10;

let floor_boss_hitbox = [];
let monster_list = [];
let power_list = [];
let market_list = [];

let move_forward = false;
let move_backward = false;
let move_left = false;
let move_right = false;
let can_jump = false;
let damage_timer = false;
let power_timer = false;
let attack_timer = false;
let create_monster_timer = false;
let dead_monster_timer = false;
let buying_action = false;
let night_day = false;
let monster_spawned = false;

let prev_time = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let color = new THREE.Color();

let hit_box_material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.BackSide, opacity: 0.0, transparent: true, depthWrite: false });

//Declaring the power objects function
const hit_box_power_geometry = new THREE.CubeGeometry(2, 10, 2, 1, 1, 1);
const power_geometry = new THREE.SphereGeometry(1, 32, 32);

function spawn_power(posz, posx, posy, type, color) {
    let power_material = new THREE.MeshBasicMaterial({ color: color });
    let power = new THREE.Mesh(power_geometry, power_material);
    power.position.set(posx, posy, posz);

    //setting up the power hit box
    power.hit_box_power = new THREE.Mesh(hit_box_power_geometry, hit_box_material);
    power.hit_box_power.name = type;

    power.add(power.hit_box_power);
    power_list.push(power.hit_box_power);

    scene.add(power);
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

//Declaring monster hit box
const hit_box_monster_geometry = new THREE.CubeGeometry(50, 50, 50, 1, 1, 1);
//Function to create monster
function create_monster() {
    for (let i = 0; i < 2; i++) {
        //Loading the model
        let monster_loader = new THREE.GLTFLoader();
        monster_loader.load('static/models/monster/scene.gltf', function (gltf) {
            let monster = gltf.scene;
            monster.traverse(function (node) {
                if (node instanceof THREE.Mesh) {
                    node.castShadow = true;
                } else {
                    node.traverse(function (node2) {
                        if (node2 instanceof THREE.Mesh) {
                            node2.castShadow = true;
                        }
                    });
                }
            });
            monster.position.set(Math.floor(Math.random() * (250 - (-250)) + (-250)), 1, 1);
            monster.position.x = Math.floor(Math.random() * (250 - (-250)) + (-250));
            monster.position.y = 7;
            monster.position.z = Math.floor(Math.random() * (250 - (-250)) + (-250));

            //setting up the monster hit box
            monster.name = `${i}_monster`;
            monster.hit_box_monster = new THREE.Mesh(hit_box_monster_geometry, hit_box_material);
            monster.hit_box_monster.name = `${i}_monster_hit_box`;
            monster_list.push(monster.hit_box_monster);
            monster.castShadow = true;
            monster.add(monster.hit_box_monster);

            //setting up the random monster size
            let size = (Math.floor(Math.random() * 0.05) + 0.2);
            monster.scale.set(size, size, size);
            monster.rotation.y -= Math.random() * -6.25;

            //setting up all the process for the monster movement pattern
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

            monster.monster_die_sound = new THREE.PositionalAudio(listener);
            let audioLoader_monster_die = new THREE.AudioLoader();
            audioLoader_monster_die.load('static/sounds/gob_die.ogg', function (buffer) {
                monster.monster_die_sound.setBuffer(buffer);
                monster.monster_die_sound.setRefDistance(20);
            });
            monster.add(monster.monster_die_sound);

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
    listener = new THREE.AudioListener();
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
    //Declaring the sun
    spot_light_sun = new THREE.SpotLight(0xffffff);
    spot_light_sun.position.set(250, 100, 0);
    spot_light_sun.angle = 1.5;
    spot_light_sun.penumbra = 1;
    spot_light_sun.decay = 2;
    spot_light_sun.distance = 4000;
    spot_light_sun.intensity = 2;
    spot_light_sun.castShadow = true;
    spot_light_sun.shadow.mapSize.width = 1024;
    spot_light_sun.shadow.mapSize.height = 1024;
    spot_light_sun.shadow.camera.near = 500;
    spot_light_sun.shadow.camera.far = 4000;
    spot_light_sun.shadow.camera.fov = 100;

    //Declaring the moon
    spot_light_moon = new THREE.SpotLight(0xffffff);
    spot_light_moon.position.set(100, 300, 0);
    spot_light_moon.angle = 1.5;
    spot_light_moon.decay = 2;
    spot_light_moon.distance = 4000;
    spot_light_moon.intensity = 0.05;

    spot_light_moon.castShadow = true;

    //Declaring the bonfire light
    let light = new THREE.PointLight(0xff4500, 2, 300);
    light.castShadow = true;
    light.position.set(5, 5, 0);

    scene.add(spot_light_sun, spot_light_moon, light);

    //Declaring the bonfire sound
    let sound_bonfire = new THREE.PositionalAudio(listener);
    let audioLoader_sound_bonfire = new THREE.AudioLoader();
    audioLoader_sound_bonfire.load('static/sounds/bonfire.ogg', function (buffer) {
        sound_bonfire.setBuffer(buffer);
        sound_bonfire.setRefDistance(20);
        sound_bonfire.setLoop(true);
        sound_bonfire.play();
    });

    //Declaring th bonfire model
    let bonfire_loader = new THREE.GLTFLoader();
    bonfire_loader.load('static/models/bonfire/scene.gltf', function (gltf) {
        let bonfire = gltf.scene;

        bonfire.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                node.castShadow = false;
            } else {
                node.traverse(function (node2) {
                    if (node2 instanceof THREE.Mesh) {
                        node2.castShadow = false;
                    }
                });
            }
        });

        bonfire.scale.set(1.5, 1.5, 1.5);
        bonfire.position.set(5, 2, 0);

        bonfire.add(sound_bonfire);
        scene.add(bonfire);
    });

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

    //Declaring merchant place
    let seller_loader = new THREE.GLTFLoader();
    seller_loader.load('static/models/seller/scene.gltf', function (gltf) {
        let seller = gltf.scene;

        seller.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                node.castShadow = false;
            } else {
                node.traverse(function (node2) {
                    if (node2 instanceof THREE.Mesh) {
                        node2.castShadow = false;
                    }
                });
            }
        });

        seller.scale.set(0.15, 0.15, 0.15);

        let hit_box_seller_geometry = new THREE.CubeGeometry(10, 10, 10, 1, 1, 1);
        merchant_hit_box = new THREE.Mesh(hit_box_seller_geometry, hit_box_material);

        merchant_hit_box.position.y = 9;

        let merchant_place = new THREE.Group();
        merchant_place.add(seller, merchant_hit_box);

        merchant_place.position.set(30, 1, -10);
        merchant_place.rotation.y = 5.2;

        scene.add(merchant_place);
    });

    //Declaring hit box of the player, it's a global object
    let hit_box_player_geometry = new THREE.CubeGeometry(10, 10, 10, 1, 1, 1);
    hit_box_player = new THREE.Mesh(hit_box_player_geometry, hit_box_material);
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
    let sword_geometry = new THREE.BoxGeometry(0.1, 15, 1);
    const sword_texture = new THREE.TextureLoader().load("static/textures/metal.jpg");
    let material_sword = new THREE.MeshBasicMaterial({ map: sword_texture, dithering: true });
    sword = new THREE.Mesh(sword_geometry, material_sword);

    let guard_geometry = new THREE.BoxGeometry(0.3, 1, 5);
    const sword_guard_Texture = new THREE.TextureLoader().load("static/textures/rock.jpg");
    let material_guard = new THREE.MeshBasicMaterial({ map: sword_guard_Texture, dithering: true });
    guard = new THREE.Mesh(guard_geometry, material_guard);

    sword.position.y = 5;
    sword_group = new THREE.Group();
    sword_group.add(sword, guard);
    sword_group.position.z = controls.getObject().position.x - 7;
    sword_group.position.y = controls.getObject().position.y - 14;
    sword_group.position.x = controls.getObject().position.x + 7;

    let sound_sword_swing = new THREE.PositionalAudio(listener);
    let audioLoader_sword_swing = new THREE.AudioLoader();
    audioLoader_sword_swing.load('static/sounds/sword_swing.ogg', function (buffer) {
        sound_sword_swing.setBuffer(buffer);
        sound_sword_swing.setRefDistance(20);
    });
    sword_group.add(sound_sword_swing);

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
                    sword_group.rotation.x -= 0.15;
                } else {
                    sword_end_first_pos = true;
                    sword_group.rotation.x += 0.15;
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

    //Declaring health bar
    player_health_group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
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
        player_health.position.x = i;
        player_health_group.add(player_health);
    }
    player_health_group.position.z = controls.getObject().position.z - 10;
    player_health_group.position.y = controls.getObject().position.y - 15;
    player_health_group.position.x = controls.getObject().position.x - 13;

    sword_group.castShadow = true;
    sword_group.receiveShadow = false;
    controls.getObject().add(player_health_group, sword_group);

    //Declaring the floor
    let floor_geometry = new THREE.PlaneBufferGeometry(800, 800, 60, 60);
    floor_geometry.rotateX(- Math.PI / 2);
    let vertex_position = floor_geometry.attributes.position;
    for (let i = 0, l = vertex_position.count; i < l; i++) {
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

    //Declaring boss floor
    const floor_boss_geometry = new THREE.BoxBufferGeometry(500, 15, 200);
    const floor_boss_texture = new THREE.TextureLoader().load("static/textures/rock.jpg");
    floor_boss_texture.wrapS = floor_boss_texture.wrapT = THREE.RepeatWrapping;
    floor_boss_texture.repeat.set(2, 2);
    const floor_boss_material = new THREE.MeshPhongMaterial({ map: floor_boss_texture, dithering: true });
    let floor_boss = new THREE.Mesh(floor_boss_geometry, floor_boss_material);
    floor_boss.position.x = 0;
    floor_boss.position.y = 100;
    floor_boss.position.z = 250;
    floor_boss.castShadow = true;
    floor_boss.receiveShadow = true;

    let boss_light = new THREE.PointLight(0xff0000, 20, 100);
    boss_light.position.x = 0;
    boss_light.position.y = 110;
    boss_light.position.z = 250;
    boss_light.castShadow = true;
    scene.add(boss_light);

    scene.add(floor_boss);
    floor_boss_hitbox.push(floor_boss);

    // //Declaring boss
    // let boss_loader = new THREE.GLTFLoader();
    // boss_loader.load('static/models/boss/scene.gltf', function (gltf) {
    //     let boss = gltf.scene;

    //     boss.traverse(function (node) {
    //         if (node instanceof THREE.Mesh) {
    //             node.castShadow = true;
    //         } else {
    //             node.traverse(function (node2) {
    //                 if (node2 instanceof THREE.Mesh) {
    //                     node2.castShadow = true;
    //                 }
    //             });
    //         }
    //     });

    //     boss.scale.set(2, 2, 2);
    //     boss.position.set(5,5,5);

    //     scene.add(boss);
    // });

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

//Declaring trees spawn
for (let p = 0; p < 20; p++) {
    let tree_loader = new THREE.GLTFLoader();
    tree_loader.load('static/models/tree/scene.gltf', function (gltf) {
        let tree = gltf.scene;

        tree.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                node.castShadow = true;
            } else {
                node.traverse(function (node2) {
                    if (node2 instanceof THREE.Mesh) {
                        node2.castShadow = true;
                    }
                });
            }
        });

        let tree_size = Math.random() * (0.15 - 0.05) + 0.05;
        tree.scale.set(tree_size, tree_size, tree_size);

        tree.position.set(Math.floor(Math.random() * (250 - (-250)) + (-250)),0,Math.floor(Math.random() * (250 - (-250)) + (-250)));

        scene.add(tree);
    });
}

//Declaring night coming sound
night_sound = new THREE.Audio(listener);
let night_sound_loader = new THREE.AudioLoader();
night_sound_loader.load('static/sounds/wolf_howl.ogg', function (buffer) {
    night_sound.setBuffer(buffer);
    night_sound.setVolume(0.5);
});

//Declaring day coming sound
day_sound = new THREE.Audio(listener);
let day_sound_loader = new THREE.AudioLoader();
day_sound_loader.load('static/sounds/day.ogg', function (buffer) {
    day_sound.setBuffer(buffer);
    day_sound.setVolume(0.5);
});

//Declaring the whole global animation for the scene
function animate() {
    requestAnimationFrame(animate);

    if (!night_day) {
        spot_light_sun.position.y -= 0.05;
        spot_light_sun.position.x += 1;
        skybox.material.forEach(material => {
            if (material.opacity >= 0) {
                material.opacity -= 0.0005;
                material.transparent = true;
            }
        });
        if (spot_light_sun.position.y <= 0.5 && spot_light_sun.position.y >= -0.5) {
            if (!monster_spawned) {
                monster_spawned = true;
                create_monster();
                spawner = setInterval(() => {
                    create_monster();
                }, 10000 - night_count);
                night_sound.play();
                night_count += 100;
            }
        }
        if (spot_light_sun.position.y <= -60) {
            night_day = true;
            spot_light_sun.position.x = -250;
            spot_light_sun.position.y = 0;
            clearInterval(spawner);
            spawner = setInterval(() => { }, 100000);
            day_sound.play();
        }
    } else {
        skybox.material.forEach(material => {
            if (material.opacity <= 1) {
                material.opacity += 0.0015;
                material.transparent = true;
            }
        });
        spot_light_sun.position.y += 0.1;
        spot_light_sun.position.x += 1;
        if (spot_light_sun.position.x >= 250) {
            night_day = false;
            monster_spawned = false;
        }
    }

    //Declaration attack sword
    document.addEventListener('click', () => {
        if (!attack_timer) {
            attack_timer = true;
            let hit_box_sword_geometry = new THREE.CubeGeometry(2, 10, 25, 1, 1, 1);
            hit_box_sword = new THREE.Mesh(hit_box_sword_geometry, hit_box_material);
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
            let collision_results = collision_raycaster.intersectObject(merchant_hit_box);
            if (collision_results.length > 0 && direction_vector.length() < 16 && collision_results[0].distance < direction_vector.length()) {
                if (!buying_action) {
                    buying_action = true;
                    if (money >= 20) {
                        money -= 20;
                        document.getElementById('money').innerHTML = money + " Money";
                        rng = Math.random() * 100;
                        if (rng > 90) {
                            for (let lucky = 0; lucky < 5; lucky++) {
                                spawn_power(collision_results[0].object.parent.position.z + Math.random() * 30, collision_results[0].object.parent.position.x + Math.random() * (20 + 5), collision_results[0].object.parent.position.y + 2,
                                    "power_jump", "#0000ff");
                                spawn_power(collision_results[0].object.parent.position.z + Math.random() * 30, collision_results[0].object.parent.position.x + Math.random() * (20 + 5), collision_results[0].object.parent.position.y + 2,
                                    "power_speed", "#ffffff");
                            }
                        } else {
                            spawn_power(collision_results[0].object.parent.position.z + Math.random() * 30, collision_results[0].object.parent.position.x + Math.random() * (20 + 5), collision_results[0].object.parent.position.y + 2,
                                "power_jump", "#0000ff");
                            spawn_power(collision_results[0].object.parent.position.z + Math.random() * 30, collision_results[0].object.parent.position.x + Math.random() * (20 + 5), collision_results[0].object.parent.position.y + 2,
                                "power_speed", "#ffffff");
                        }
                    }
                    setTimeout(() => { buying_action = false; }, 500);
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
                if (!dead_monster_timer) {
                    if (collision_results[0].object != null && collision_results[0].object.name.indexOf('monster') != -1) {
                        dead_monster_timer = true;
                        rng = Math.random() * 100;
                        if (rng <= hearth_rng) {
                            spawn_power(collision_results[0].object.parent.position.z, collision_results[0].object.parent.position.x, collision_results[0].object.parent.position.y + 2,
                                "power_health", "#ff0000")
                        }
                        if (rng <= money_rng) {
                            spawn_power(collision_results[0].object.parent.position.z + 3, collision_results[0].object.parent.position.x, collision_results[0].object.parent.position.y + 2,
                                "power_money", "#ffff00")
                        }
                        if (rng <= speed_rng) {
                            spawn_power(collision_results[0].object.parent.position.z + 3, collision_results[0].object.parent.position.x, collision_results[0].object.parent.position.y + 2,
                                "power_jump", "#0000ff")
                        }
                        if (rng <= jump_rng) {
                            spawn_power(collision_results[0].object.parent.position.z + 3, collision_results[0].object.parent.position.x, collision_results[0].object.parent.position.y + 2,
                                "power_speed", "#ffffff")
                        }

                        let monster_obj = collision_results[0].object.parent;
                        for (let h = 0; h < monster_list.length; h++) {
                            if (monster_list[h] != null) {
                                if (monster_list[h] == monster_obj.children[1]) {
                                    monster_list.splice(h, 1);
                                }
                            }
                        }
                        for (let d = 0; d < monster_obj.children; d++) {
                            if (monster_obj.children[d] != null) {
                                monster_obj.remove(monster_obj.children[d]);
                            }
                        }
                        monster_obj.monster_die_sound.play();
                        scene.remove(monster_obj);
                    }
                    setTimeout(() => {
                        dead_monster_timer = false;
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
                        document.getElementById("speed").innerHTML = `${speed} Speed Lvl`;
                    }
                }
                else if (collision_results[0].object.parent != null && collision_results[0].object.name.indexOf('power_jump') != -1) {
                    let jump_obj = collision_results[0].object.parent;
                    jump_obj.remove(jump_obj.children[0]);
                    scene.remove(jump_obj);
                    if (gravity >= 30) {
                        gravity -= 10;
                        document.getElementById("jump").innerHTML = `${gravity} Jump Lvl`;
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

        let intersections = controls_raycaster.intersectObjects(floor_boss_hitbox);
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

        if (controls.getObject().position.x >= 250) {
            controls.getObject().position.x = 249;
        }
        if (controls.getObject().position.x <= -250) {
            controls.getObject().position.x = -249;
        }
        if (controls.getObject().position.z >= 250) {
            controls.getObject().position.z = 249;
        }
        if (controls.getObject().position.z <= -250) {
            controls.getObject().position.z = -249;
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