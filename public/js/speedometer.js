//Speedometer visualisation

const MAX_SPEED = 90;
const MAX_REVS = 6500;
const NEEDLE_SCALE = 50;
const MIN_REVS = 700;
const GAUGE_HEIGHT = 50;
const REV_POS_X = -60;
const SPEEDO_POS_X = 60;

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

    createScene() {
        //Init base createsScene
        super.createScene();

        //Root group
        this.root = new THREE.Object3D();
        this.addToScene(this.root);

        //Add ground plane
        this.addGround();

        //Load model
        let revGroup = new THREE.Object3D();
        revGroup.scale.set(NEEDLE_SCALE, NEEDLE_SCALE, NEEDLE_SCALE);
        revGroup.position.y = GAUGE_HEIGHT;
        revGroup.position.x = REV_POS_X;
        this.root.add(revGroup);

        let speedoGroup = new THREE.Object3D();
        speedoGroup.scale.set(NEEDLE_SCALE, NEEDLE_SCALE, NEEDLE_SCALE);
        speedoGroup.position.y = GAUGE_HEIGHT;
        speedoGroup.position.x = SPEEDO_POS_X;
        this.root.add(speedoGroup);

        let mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath("./models/");
        mtlLoader.load("dashBoard.mtl", materials => {
            materials.preload();

            let objLoader = new THREE.OBJLoader();
            let currentObject;
            let revGroupObjects = [], speedoObjects = [];
            objLoader.setMaterials(materials);
            objLoader.setPath("./models/");
            objLoader.load("dashBoard.obj", object => {
                for(let i=0, numChildren=object.children.length; i<numChildren; ++i) {
                    currentObject = object.children[i];
                    if(currentObject.name.indexOf("RevCounter") !== -1) {
                        console.log("Found rev counter child");
                        revGroupObjects.push(object.children[i]);
                        if(currentObject.name.indexOf("RevCounterHand") !== -1) {
                            console.log("Found rev counter needle");
                            this.revCounter = object.children[i];
                        }
                    }
                    if(currentObject.name.indexOf("Speedometer") !== -1) {
                        console.log("Found speedometer child");
                        speedoObjects.push(object.children[i]);
                        if(currentObject.name.indexOf("SpeedometerHand") !== -1) {
                            console.log("Found speedo needle");
                            this.speedometer = object.children[i];
                        }
                    }
                }
                if(this.revCounter === undefined) {
                    console.log("Rev counter not in model");
                    return;
                }
                if(this.speedometer === undefined) {
                    console.log("Speedometer needle not in model");
                    return;
                }
                for(let i=0, numChildren=revGroupObjects.length; i<numChildren; ++i) {
                    revGroup.add(revGroupObjects[i]);
                }
                for(let i=0, numChildren=speedoObjects.length; i<numChildren; ++i) {
                    speedoGroup.add(speedoObjects[i]);
                }
                this.modelLoaded = true;
            })
        });
    }

    update() {
        super.update();

        if(this.dataAvailable) {
            this.speedometer.rotation.z = -(this.currentSpeed / MAX_SPEED) * Math.PI;
            this.revCounter.rotation.z = -(this.currentRevs / MAX_REVS) * Math.PI;
            this.dataAvailable = false;
        }

    }

    addGround() {
        //Ground plane
        const GROUND_WIDTH = 1000, GROUND_HEIGHT = 640, SEGMENTS = 16;
        let groundGeom = new THREE.PlaneBufferGeometry(GROUND_WIDTH, GROUND_HEIGHT, SEGMENTS, SEGMENTS);
        let groundMat = new THREE.MeshLambertMaterial( {color: 0xcdcdcd} );
        let ground = new THREE.Mesh(groundGeom, groundMat);
        ground.name = "Ground";
        ground.rotation.x = -Math.PI/2;
        this.root.add(ground);
    }
}

$(document).ready( () => {
    if(!Detector.webgl) {
        //$('#notSupported').show();
        console.log("WebGL not supported");
        return;
    }

    let container = document.getElementById("WebGL-output");
    let app = new SpeedoApp();
    app.init(container);
    //app.createGUI();
    app.createScene();

    app.run();
});
