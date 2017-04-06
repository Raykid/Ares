./node_modules/.bin/tsc ../src/ares/Ares.ts --outFile ../dist/ares.js --sourceMap --target es5
./node_modules/.bin/uglifyjs ../dist/ares.js -o ../dist/ares.min.js

./node_modules/.bin/tsc ../src/ares/html/HTMLCompiler.ts --outFile ../dist/ares_html.js --sourceMap --target es5
./node_modules/.bin/uglifyjs ../dist/ares_html.js -o ../dist/ares_html.min.js

./node_modules/.bin/tsc ../src/ares/pixijs/PIXICompiler.ts --outFile ../dist/ares_pixi.js --sourceMap --target es5
./node_modules/.bin/uglifyjs ../dist/ares_pixi.js -o ../dist/ares_pixi.min.js

./node_modules/.bin/tsc ../src/ares/template/TemplateCompiler.ts --outFile ../dist/ares_template.js --sourceMap --target es5
./node_modules/.bin/uglifyjs ../dist/ares_template.js -o ../dist/ares_template.min.js
