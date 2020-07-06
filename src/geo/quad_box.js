import * as THREE from 'three';
import { QuadBase } from './quad_base';
import { HoleQuad } from './hole_quad';

export class QuadBox {

    constructor(app, params) {
        this.app = app;
        this.width = params.width || 10;
        this.height = params.height || 10;
        this.depth = params.depth || 10;

        this.parts = [];

        this.setupPoints();
        this.makeFaces();
    }

    setupPoints() {
        this.points = [];

        let w = this.width;
        let h = this.height;
        let d = this.depth;

        // top verts
        this.points.push(new THREE.Vector3(-w/2, h/2, -d/2));
        this.points.push(new THREE.Vector3( w/2, h/2, -d/2));
        this.points.push(new THREE.Vector3( w/2, h/2,  d/2));
        this.points.push(new THREE.Vector3(-w/2, h/2,  d/2));

        // bottom verts
        this.points.push(new THREE.Vector3(-w/2, -h/2,  d/2));
        this.points.push(new THREE.Vector3( w/2, -h/2,  d/2));
        this.points.push(new THREE.Vector3( w/2, -h/2, -d/2));
        this.points.push(new THREE.Vector3(-w/2, -h/2, -d/2));
    }

    makeFaces() {
        // front
        this.makeHoleFace([3,2,5,4], 'front');
        // return;

        // top
        this.makeHoleFace([0,1,2,3], 'top');
        
        // bottom
        this.makeHoleFace([4,5,6,7], 'bottom');

        // back
        this.makeHoleFace([1,0,7,6], 'back');

        // left
        this.makeHoleFace([0,3,4,7], 'left');

        // right
        this.makeHoleFace([2,1,6,5], 'right');

    }

    makeHoleFace(indices, name = 'hole') {
        let verts = indices.map((i) => {
            return this.points[i];
        })

        // let f = new QuadBase(this.scene, this.points.slice(4,8));
        let f = new HoleQuad(this.app, verts, name);
        this.parts.push(f);
    }

    makeFace(indices, name = 'tri') {
        let verts = indices.map((i) => {
            return this.points[i];
        })

        // let f = new QuadBase(this.scene, this.points.slice(4,8));
        let f = new QuadBase(this.app, verts, name);
        this.parts.push(f);
    }
}