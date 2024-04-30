const fs = require('fs-extra');

const srcDir = 'public';
const destDir = 'dist';

fs.copySync(srcDir, destDir, { overwrite: true });

console.log('¡Construcción completada!');
