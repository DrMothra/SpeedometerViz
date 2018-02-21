//Speedometer visualisation

const NEEDLE_WIDTH = 120;
const NEEDLE_HEIGHT = 5;
const NEEDLE_DEPTH = 30;
const NEEDLE_SEGMENTS = 8;
const MAX_SPEED = 80;
const NEEDLE_SCALE = 50;

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
        this.currentSpeed = 1;

        ws.onmessage = event => {
            //console.log("Speed = ", event.data);
            this.currentSpeed = event.data;
            if(this.currentSpeed < 1) {
                this.currentSpeed = 1;
            }
            this.dataAvailable = true;
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

        //Add block
        /*
        let geom = new THREE.BoxBufferGeometry(NEEDLE_WIDTH, NEEDLE_HEIGHT, NEEDLE_DEPTH, NEEDLE_SEGMENTS, NEEDLE_SEGMENTS);
        let mat = new THREE.MeshLambertMaterial( {color: 0x0000ff} );
        let speedMesh = new THREE.Mesh(geom, mat);
        this.addToScene(speedMesh);
        this.speedMesh = speedMesh;
        */

        //Load model
        let mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath("./models/");
        mtlLoader.load("speedometerNeedle.mtl", materials => {
            materials.preload();

            let objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath("./models/");
            objLoader.load("speedometerNeedle.obj", object => {
                object.scale.set(NEEDLE_SCALE, NEEDLE_SCALE, NEEDLE_SCALE);
                object.position.y = 50;
                this.speedMesh = object;
                this.addToScene(object);
            })
        });
    }

    update() {
        super.update();

        if(this.dataAvailable) {
            this.speedMesh.rotation.z = (this.currentSpeed / MAX_SPEED) * Math.PI;
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
