import * as THREE from 'three';

/**
 * Class for storing a quad-based piece of geometry
 * 
 * @param app an instance of GreebleModeler
 * @param pts a 4-element array of points defining a quad in clocwise order starting at top left
 */
export class QuadBase {
    
    constructor(app, pts, name = 'face', autoUpdate = true) {
        this.app = app;

        this.name = name;

        this.children = [];

        this.geo = new THREE.Geometry();
        this.geo.vertices = this.geo.vertices.concat(pts);

        this.basePoints = pts.slice(0);
        this.setupCoords();

        let col = new THREE.Color(
            Math.max(0.4, Math.random()),
            Math.max(0.4, Math.random()),
            Math.max(0.4, Math.random())
        );

        col = new THREE.Color(0.6, 0.6, 0.6);

        this.mat = new THREE.MeshLambertMaterial({
            color: col,
            // side: THREE.DoubleSide,
        });
        /*
        this.mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            side: THREE.DoubleSide,
        });
        */
        

        this.obj = new THREE.Mesh(this.geo, this.mat);
        this.app.addToScene(this, this.obj);
    
        this.params = {};
        this.paramList = [];

        this.init();

        if (autoUpdate) {
            this.updateGeometry();
        }
    }

    // no-op in base class
    init() {}

    static listParams() {
        return [];
    }

    updateParams() {
        this.paramList.forEach(p => {
            this.params[p.name] = p.value;
        });
    }

    clearChildren() {
        this.children.forEach((c) => {
            c.clearChildren();
            this.app.removeFromScene(c, c.obj);
        })
    }

    addNewFeature(pt1, pt2) {}

    addToScene(app) {
        app.addToScene(this, this.obj);
    }

    normalizePoint(pt) {
        const diff = pt.clone().sub(this.basePoints[3]);

        const x = diff.clone().projectOnVector(this.coordSys[0]).length();
        const y = diff.clone().projectOnVector(this.coordSys[1]).length();
        
        return new THREE.Vector2(x,y);
    }

    getCornersFromPoints(pt1, pt2) {
        let p1 = this.normalizePoint(pt1);
        let p2 = this.normalizePoint(pt2);

        let minX = Math.min(p1.x, p2.x);
        let maxX = Math.max(p1.x, p2.x);
        let minY = Math.min(p1.y, p2.y);
        let maxY = Math.max(p1.y, p2.y);
        
        let pts = [];
        pts[0] = this.movePoint(this.basePoints[3], [minX, maxY, 0]);
        pts[1] = this.movePoint(this.basePoints[3], [maxX, maxY, 0]);
        pts[2] = this.movePoint(this.basePoints[3], [maxX, minY, 0]);
        pts[3] = this.movePoint(this.basePoints[3], [minX, minY, 0]);

        return pts;
    }

    // TODO: this is currently unused
    getCornerPointsFromDiagonal(origin, direction) {
        let pts = [];
        pts.push(origin);

        let horiz = direction.clone().projectOnVector(this.coordSys[0]);
        let vert = direction.clone().projectOnVector(this.coordSys[1]);

        pts.push(origin.clone().add(horiz));
        pts.push(origin.clone().add(direction));
        pts.push(origin.clone().add(vert));

        return pts;
    }

    setupCoords() {
        this.coordSys = [];
        this.bounds = [];

        // X-axis: vect from top-left to top-right
        this.coordSys[0] = this.basePoints[1].clone().sub(this.basePoints[0]);

        // Y-axis: vect from bottom-right to top-right
        this.coordSys[1] = this.basePoints[1].clone().sub(this.basePoints[2]);

        // Z-axis: cross product of X and Y
        this.coordSys[2] = this.coordSys[0].clone().cross(this.coordSys[1]);

        // grab the X and Y extents (Z is ignored b/c faces are required to be flat)
        this.bounds[0] = this.coordSys[0].length();
        this.bounds[1] = this.coordSys[1].length();

        this.coordSys.map((v) => {
            return v.normalize();
        });
    }

    movePoint(pt, amount) {
        let p = pt.clone();

        for (let i=0; i < 3; i++) {
            p.add(this.coordSys[i].clone().multiplyScalar(amount[i]));
        }

        return p;
    }

    movePointPercent(pt, amount) {
        let dist = [
            amount[0] * this.bounds[0],
            amount[1] * this.bounds[1],
            0
        ];

        return this.movePoint(pt, dist);
    }

    getVertsFromIndices(indices) {
        let points = [];
        indices.forEach(v => {
            points.push(this.geo.vertices[v].clone());
        });
        return points;
    }

    addCircleVerts(center, radius, segments, rotation = 0) {
        
        const sliceAmt = (Math.PI * 2) / segments;
        const xAxis = new THREE.Vector3(1, 0, 0);

        let baseVerts = [];
        for (let i=0; i < segments; i++) {
            let v = new THREE.Vector3(
                Math.cos(i * sliceAmt) * radius,
                Math.sin(i * sliceAmt) * radius,
                0
            );
            v.applyAxisAngle(xAxis, rotation);

            baseVerts.push(v);
        }

        const flipX = true; // (rotation < 0);

        const addedVerts = [];

        for (let i=0; i < segments; i++) {
            let v = this.movePoint(center, [
                baseVerts[i].x,
                baseVerts[i].y,
                baseVerts[i].z
            ]);
            /*
            let v = this.movePoint(center, [
                Math.cos(i * sliceAmt) * radius,
                Math.sin(i * sliceAmt) * radius,
                0
            ]);
            */
            addedVerts.push(v);
            this.geo.vertices.push(v);
        }
        return addedVerts;
    }

    addVerts(vertArray) {
        this.geo.vertices = this.geo.vertices.concat(vertArray);
    }

    addFace(indices, log = false) {
        if (log) console.log(`New Face: ${JSON.stringify(indices)}`);
        // console.log(`NEW FACE: ${JSON.stringify(indices)}, numVerts: ${this.geo.vertices.length}`);
        this.geo.faces.push(new THREE.Face3(...indices));
    }

    addQuad(indices, offset = 0) {
        this.addFace([
            indices[0] + offset, indices[3] + offset, indices[1] + offset
        ]);
        this.addFace([
            indices[1] + offset, indices[3] + offset, indices[2] + offset
        ]);
    }

    clearGeo() {
        this.geo.vertice = [];
        this.geo.faces = [];

        this.geo.vertices = this.basePoints.slice(0);
        this.finalizeGeo();
    }

    addBaseFaces() {
        this.addFace([1,0,3]);
        this.addFace([1,3,2]);        
    }

    updateGeometry() {
        this.clearGeo();

        // this.addBaseFaces();

        this.finalizeGeo();
    }

    finalizeGeo() {
        this.geo.verticesNeedUpdate = true;
        this.geo.elementsNeedUpdate = true;
        this.geo.computeFaceNormals();
    }

}