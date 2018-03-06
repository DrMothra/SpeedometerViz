//Speedometer visualisation

const MAX_SPEED = 90;
const MAX_REVS = 6500;
const DASHBOARD_SCALE = 50;
const MIN_REVS = 700;
const GAUGE_HEIGHT = 50;
const REV_POS_X = 90;
const SPEEDO_POS_X = 0;

class SpeedoApp extends BaseApp {
    constructor() {
        super();

        this.baseName = "SpeedoVizConfig";
    }

    init(container) {
        super.init(container);

        //Networking
        let host = window.document.location.host.replace(/:.*/, '');
        let ws = new WebSocket('ws://' + host + ':3000');
        this.dataAvailable = false;
        this.currentSpeed = 0;
        this.currentRevs = 0;
        this.modelLoaded = false;
        this.maxSpeed = MAX_SPEED;
        this.maxRevs = MAX_REVS;

        ws.onmessage = event => {
            //console.log("Data = ", event.data);
            if(event.data > MIN_REVS) {
                this.currentRevs = event.data;
            } else {
                this.currentSpeed = event.data;
            }

            if(this.modelLoaded) {
                this.dataAvailable = true;
            }
        };
    }

    createScene(sceneConfig) {
        //Init base createsScene
        super.createScene();

        //Root group
        this.root = new THREE.Object3D();
        this.addToScene(this.root);

        //Add ground plane
        this.addGround();

        //Config stuff
        this.maxSpeed = sceneConfig.MAX_SPEED;
        this.maxRevs = sceneConfig.MAX_REVS;

        //Load model
        let revGroup = new THREE.Object3D();
        revGroup.scale.set(DASHBOARD_SCALE, DASHBOARD_SCALE, DASHBOARD_SCALE);
        revGroup.position.y = GAUGE_HEIGHT;
        revGroup.position.x = sceneConfig.REV_POS_X;
        this.root.add(revGroup);

        let speedoGroup = new THREE.Object3D();
        speedoGroup.scale.set(DASHBOARD_SCALE, DASHBOARD_SCALE, DASHBOARD_SCALE);
        speedoGroup.position.y = GAUGE_HEIGHT;
        speedoGroup.position.x = sceneConfig.SPEEDO_POS_X;
        this.root.add(speedoGroup);

        let otherGroup = new THREE.Object3D();
        otherGroup.scale.set(DASHBOARD_SCALE, DASHBOARD_SCALE, DASHBOARD_SCALE);
        otherGroup.position.y = GAUGE_HEIGHT;
        this.root.add(otherGroup);

        let mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath("./models/");
        let baseFilename = sceneConfig.fileName;
        let materialFile = baseFilename + ".mtl";
        let objectFile = baseFilename + ".obj";
        mtlLoader.load(materialFile, materials => {
            materials.preload();

            let objLoader = new THREE.OBJLoader();
            let currentObjectName;
            let revGroupObjects = [], speedoObjects = [], otherObjects = [];
            objLoader.setMaterials(materials);
            objLoader.setPath("./models/");
            objLoader.load(objectFile, object => {
                for(let i=0, numChildren=object.children.length; i<numChildren; ++i) {
                    currentObjectName = object.children[i].name;
                    if(currentObjectName.indexOf("RevCounter") !== -1) {
                        console.log("Found rev counter child");
                        revGroupObjects.push(object.children[i]);
                        if(currentObjectName.indexOf("RevCounterHand") !== -1) {
                            console.log("Found rev counter needle");
                            this.revCounter = object.children[i];
                            if(sceneConfig.revCounterOffset) {
                                this.revCounter.position.set(sceneConfig.revCounterOffset[0], sceneConfig.revCounterOffset[1], 0);
                            }

                        }
                    } else if(currentObjectName.indexOf("Speedometer") !== -1) {
                        console.log("Found speedometer child");
                        speedoObjects.push(object.children[i]);
                        if(currentObjectName.indexOf("SpeedometerHand") !== -1) {
                            console.log("Found speedo needle");
                            this.speedometer = object.children[i];
                            if(sceneConfig.speedoOffset) {
                                this.speedometer.position.set(sceneConfig.speedoOffset[0], sceneConfig.speedoOffset[1], 0);
                            }

                        }
                    } else {
                        otherObjects.push(object.children[i]);
                    }
                }

                if(this.revCounter === undefined && !sceneConfig.digital) {
                    console.log("Rev counter not in model");
                    return;
                }
                if(this.speedometer === undefined && !sceneConfig.digital) {
                    console.log("Speedometer needle not in model");
                    return;
                }
                for(let i=0, numChildren=revGroupObjects.length; i<numChildren; ++i) {
                    revGroup.add(revGroupObjects[i]);
                }
                for(let i=0, numChildren=speedoObjects.length; i<numChildren; ++i) {
                    speedoGroup.add(speedoObjects[i]);
                }
                for(let i=0, numChildren=otherObjects.length; i<numChildren; ++i) {
                    otherGroup.add(otherObjects[i]);
                }
                this.digital = sceneConfig.digital;
                this.modelLoaded = true;
            })
        });
    }

    update() {
        super.update();

        if(this.dataAvailable) {
            if(!this.digital) {
                this.speedometer.rotation.z = -(this.currentSpeed / this.maxSpeed) * Math.PI;
                this.revCounter.rotation.z = -(this.currentRevs / this.maxRevs) * Math.PI;
            } else {
                $('#speedOut').html(Math.round(this.currentSpeed));
                $('#revs').html(this.currentRevs);
            }
            this.dataAvailable = false;
        }

    }

    addGround() {
        //Ground plane
        const GROUND_WIDTH = 1000, GROUND_HEIGHT = 640, SEGMENTS = 16;
        let groundGeom = new THREE.PlaneBufferGeometry(GROUND_WIDTH, GROUND_HEIGHT, SEGMENTS, SEGMENTS);
        let groundMat = new THREE.MeshLambertMaterial( {color: 0x000000} );
        let ground = new THREE.Mesh(groundGeom, groundMat);
        ground.name = "Ground";
        //ground.rotation.x = -Math.PI/2;
        ground.position.z = -15.0;
        this.root.add(ground);
    }
}

$(document).ready( () => {
    if(!Detector.webgl) {
        //$('#notSupported').show();
        console.log("WebGL not supported");
        return;
    }

    //app.createGUI();

    //GUI callbacks
    $('#option1').on("click", () => {
        $('#configuration').addClass("d-none");
        $('#WebGL-output').removeClass("d-none");

        //Jaguar configuration
        let sceneConfig = {
            fileName: "jaguarDash",
            REV_POS_X: 90,
            SPEEDO_POS_X: 0,
            MAX_SPEED: 140,
            MAX_REVS: 4100,
            digital: false,
            speedoOffset: undefined,
            revCounterOffset: undefined
        };

        runApp(sceneConfig);
    });

    $("#option2").on("click", () => {
        $('#configuration').addClass("d-none");
        $('#WebGL-output').removeClass("d-none");

        //Blue neon configuration
        let sceneConfig = {
            fileName: "dashBoard",
            REV_POS_X: -80,
            SPEEDO_POS_X: 80,
            MAX_SPEED: 85,
            MAX_REVS: 6500,
            digitial: false,
            speedoOffset: undefined,
            revCounterOffset: undefined
        };

        runApp(sceneConfig);
    });

    $("#option3").on("click", () => {
        $('#configuration').addClass("d-none");
        $('#WebGL-output').removeClass("d-none");

        //land Rover configuration
        let sceneConfig = {
            fileName: "landRoverDash",
            REV_POS_X: -60,
            SPEEDO_POS_X: 60,
            MAX_SPEED: 100,
            MAX_REVS: 4000,
            digital: false,
            speedoOffset: [0.15, 0.025],
            revCounterOffset: [-0.15, -0.075]
        };

        runApp(sceneConfig);
    });

    $("#option4").on("click", () => {
        $('#configuration').addClass("d-none");
        $('#WebGL-output').removeClass("d-none");

        //Digital configuration
        let sceneConfig = {
            fileName: "digitalDash",
            REV_POS_X: -60,
            SPEEDO_POS_X: 60,
            MAX_SPEED: 90,
            MAX_REVS: 5000,
            digital: true,
            speedoOffset: undefined,
            revCounterOffset: undefined
        };

        runApp(sceneConfig);
    });

    $("#option5").on("click", () => {
        $('#configuration').addClass("d-none");
        $('#WebGL-output').removeClass("d-none");

        //Audi configuration
        let sceneConfig = {
            fileName: "audiDash",
            REV_POS_X: -60,
            SPEEDO_POS_X: 60,
            MAX_SPEED: 105,
            MAX_REVS: 5000,
            digital: false,
            speedoOffset: undefined,
            revCounterOffset: undefined
        };

        runApp(sceneConfig);
    });
});

function runApp(config) {
    let container = document.getElementById("WebGL-output");
    let app = new SpeedoApp();
    app.init(container);
    app.createScene(config);
    app.run();
}