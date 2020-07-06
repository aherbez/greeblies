import * as THREE from 'three';
import oc from 'three-orbit-controls';

import { QuadBox } from './geo/quad_box';
import { QuadBase } from './geo/quad_base';
import { SelectionQuad } from './geo/selection_quad';

const OrbitControls = oc(THREE);

const MODE_NONE = 0;
const MODE_ORBIT = 1;

const OBJ_EXTRUDE = 0;
const OBJ_BUTTONS = 1;

const CONTROLS_WIDTH = 300;

export class GreebleModeler {

    constructor() {
        console.log('NEW MODELER');
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;

        this.lastClick = {
            obj: '',
            pos: null
        };

        this.objLookup = new Map();

        this.raycast = new THREE.Raycaster();
        
        this.mode = MODE_ORBIT;

        this.lights = [];

        this.init();

        // this.addSkybox();

        this.addLights();
        
        this.addTempGeo();

        this.dragging = false;

        document.onkeydown = this.keydown.bind(this);
        document.onkeyup = this.keyup.bind(this);
        document.onmousedown = this.mouseDown.bind(this);
        document.onmouseup = this.mouseUp.bind(this);
        document.onmousemove = this.mouseMove.bind(this);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        document.body.appendChild(this.renderer.domElement);
        this.render();

        /*
        var axesHelper = new THREE.AxesHelper( 10 );
        this.scene.add( axesHelper );
        */

        this.selection = new SelectionQuad();
        this.scene.add(this.selection.mesh);
        this.selection.setVisible(false);
    }

    onWindowResize() {
        this.camera.aspect = (window.innerWidth - CONTROLS_WIDTH) / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize((window.innerWidth - CONTROLS_WIDTH), window.innerHeight);
    }

    addSkybox() {
       const loader = new THREE.CubeTextureLoader();
       const skyboxTexture = loader.load([
           './resources/px.png',
           './resources/nx.png',
           './resources/py.png',
           './resources/ny.png',
           './resources/pz.png',
           './resources/nz.png'
       ]);
       this.scene.background = skyboxTexture;
    }

    addToScene(quadBasedObj, obj) {
        this.objLookup.set(obj.uuid, quadBasedObj);
        this.scene.add(obj);
    }

    removeFromScene(quadBasedObj) {
        this.objLookup.set(quadBasedObj.obj.uuid, null);

        this.scene.remove(quadBasedObj.obj);
    }

    keydown(evt) {
        if (evt.keyCode === 32) {
            this.mode = MODE_NONE;
            this.controls.enabled = false;
        }
    }

    keyup(evt) {
        if (evt.keyCode === 32) {
            this.mode = MODE_ORBIT;
            this.controls.enabled = true;
        }
    }

    raycastToFirst(evt, addArrow = false) {
        let mousePos = new THREE.Vector2();
        mousePos.x = (evt.clientX / (window.innerWidth - CONTROLS_WIDTH)) * 2 - 1;
        mousePos.y = -(evt.clientY / window.innerHeight) * 2 + 1;

        this.raycast.setFromCamera(mousePos, this.camera);
        let intersects = this.raycast.intersectObjects(this.scene.children);

        if (addArrow) {
            this.scene.add(new THREE.ArrowHelper(this.raycast.ray.direction,
                this.raycast.ray.origin, 300, 0xff0000) );
        }

        if (intersects.length > 0) return intersects[0];
        return null;
    }

    log(text) {
        // this.output.innerHTML = text;
    }

    mouseDown(evt) {
        if (this.mode === MODE_ORBIT) return;

        this.dragging = true;
        this.selection.setVisible(true);

        let pt = this.raycastToFirst(evt);        
        if (pt) {
            let objID = pt.object.uuid;

            let name = '';
            if (this.objLookup.has(objID)) name = this.objLookup.get(objID).name;
            
            this.lastClick.obj = pt.object.uuid;
            this.lastClick.pos = pt.point;

            this.log(`${name}`);
        } else {
            this.log('none');
        }
    }

    mouseMove(evt) {
        if (this.dragging === false) return;
        
        let pt = this.raycastToFirst(evt);
        if (pt) {
            
            if (pt.object.uuid === this.lastClick.obj) {

                if (this.objLookup.has(pt.object.uuid)) {
                    let currObj = this.objLookup.get(pt.object.uuid);

                    let pts = currObj.getCornersFromPoints(this.lastClick.pos, pt.point);
                    // prevent z-fighting
                    pts = pts.map(pt => currObj.movePoint(pt, [0,0,0.1]));
                    
                    this.selection.setPoints(pts);
                }
            } else {
                // different objects- no-op
            }
        }
    }

    mouseUp(evt) {
        if (this.mode === MODE_ORBIT) return;

        this.dragging = false;
        this.selection.setVisible(false);

        let pt = this.raycastToFirst(evt);
        if (pt) {
            if (pt.object.uuid === this.lastClick.obj) {
                this.handleClickDrag(pt.object.uuid, this.lastClick.pos, pt.point);
            } else {
                // console.log('Different objects');
            }
        }
    }

    handleClickDrag(objId, pt1, pt2) {
        
        if (this.objLookup.has(objId)) {
            let obj = this.objLookup.get(objId);

            obj.addNewFeature(pt1, pt2);
        }
    }

    addTempGeo() {
        let box = new QuadBox(this, {
            width: 20,
            height: 20,
            depth: 10
        });
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75,
            (window.innerWidth-CONTROLS_WIDTH) / window.innerHeight,
            0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth - CONTROLS_WIDTH, window.innerHeight);
        this.renderer.setClearColor(new THREE.Color(1,1,1), 1);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);            
        this.camera.position.set(0, 10, 30);
        this.controls.update();
    }

    addLights() {
        const topColor = 0xa8d8e6;
        const botColor = 0x81969c;
        
        let light = new THREE.HemisphereLight(topColor, botColor, 0.7);
        this.scene.add(light);
        
        {
            let directionalLight = new THREE.DirectionalLight( topColor, 0.5 );
            directionalLight.position.set(0, 20, 12);
            this.scene.add( directionalLight );
            this.lights.push(directionalLight);
        }

        {
            let ambientLight = new THREE.AmbientLight(botColor, 0.05);
            this.scene.add(ambientLight);
            this.lights.push(ambientLight);
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        this.controls.update();

        requestAnimationFrame(this.render.bind(this));
    }
}