const path = require('path');

module.exports = {
    entry: './src/index.js',
    resolve: {
        alias: {
            'three/OrbitControls': path.resolve(__dirname, 'node_modules/three/examples/js/controls/OrbitControls.js'),
            // 'three/STLExporter': path.resolve(__dirname, 'node_modules/three/examples/js/exporters/STLExporter.js')
        }
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
};