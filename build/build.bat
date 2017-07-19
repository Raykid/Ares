call ./node_modules/.bin/tsc ../src/ares/Ares.ts -d --outFile ../dist/ares.js --target es5 --module amd
call ./node_modules/.bin/tsc ../src/ares/html/HTMLCompiler.ts -d --outFile ../dist/ares_html.js --target es5 --module amd
call ./node_modules/.bin/tsc ../src/ares/pixijs/PIXICompiler.ts -d --outFile ../dist/ares_pixijs.js --target es5 --module amd
call ./node_modules/.bin/tsc ../src/ares/template/TemplateCompiler.ts -d --outFile ../dist/ares_template.js --target es5 --module amd

call ./node_modules/.bin/webpack

call ./node_modules/.bin/uglifyjs ../dist/ares.js -o ../dist/ares.min.js
call ./node_modules/.bin/uglifyjs ../dist/ares_html.js -o ../dist/ares_html.min.js
call ./node_modules/.bin/uglifyjs ../dist/ares_pixijs.js -o ../dist/ares_pixijs.min.js
call ./node_modules/.bin/uglifyjs ../dist/ares_template.js -o ../dist/ares_template.min.js