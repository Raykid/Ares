@echo off
call ./node_modules/.bin/tsc ../src/ares/Ares.ts --outFile ../dist/ares.js --sourceMap --target es5
call ./node_modules/.bin/uglifyjs ../dist/ares.js -o ../dist/ares.min.js