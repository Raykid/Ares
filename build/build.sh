tsc ../src/ares/Ares.ts --outFile ../dist/ares.js --sourceMap --target es5
uglifyjs ../dist/ares.js -o ../dist/ares.min.js
