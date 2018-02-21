//Speedometer visualisation

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
        let geom = new THREE.BoxBufferGeometry(30, 1, 30, 8, 8);
        let mat = new THREE.MeshLambertMaterial( {color: 0x0000ff} );
        let speedMesh = new THREE.Mesh(geom, mat);
        this.addToScene(speedMesh);
        this.speedMesh = speedMesh;
    }

    update() {
        super.update();

        if(this.dataAvailable) {
            this.speedMesh.scale.y = this.currentSpeed * 2;
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
