const fs = require('fs-extra');

// Directorio de origen y destino
const srcDir = 'public';
const destDir = 'dist';

// Copiar archivos estáticos
fs.copySync(srcDir, destDir, { overwrite: true });

console.log('¡Construcción completada!');
