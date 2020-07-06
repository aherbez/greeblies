import * as THREE from 'three';

export class SelectionQuad {

    constructor() {
        this.geo = new THREE.Geometry();
        this.mat = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            opacity: 0.5,
            transparent: true,
        });
        
        this.pts = [
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,0)
        ];

        this.defaultPts = [
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0,0,0)
        ];
        
        this.geo.vertices = this.geo.vertices.concat(this.pts);
        this.geo.faces.push(new THREE.Face3(1,0,3));
        this.geo.faces.push(new THREE.Face3(1,3,2));

        this.mesh = new THREE.Mesh(this.geo, this.mat);

        this.updateGeometry();
    }

    setVisible(show) {
        this.mesh.visible = show;

        if (!show) {
            this.setPoints(this.defaultPts);
        }
    }

    setPoints(pts) {
        this.geo.setFromPoints(pts);        
        this.updateGeometry();
    }

    updateGeometry() {
        this.geo.verticesNeedUpdate = true;
        this.geo.elementsNeedUpdate = true;
        this.geo.computeFaceNormals();        
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }
}