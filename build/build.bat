@echo off
call tsc ../src/ares/Ares.ts --outFile ../dist/ares.js --sourceMap --target es5
call uglifyjs ../dist/ares.js -o ../dist/ares.min.js