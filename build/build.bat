@echo off
call ./node_modules/.bin/webpack
call ./node_modules/.bin/uglifyjs ../dist/ares.js -o ../dist/ares.min.js
call ./node_modules/.bin/uglifyjs ../dist/ares_html.js -o ../dist/ares_html.min.js
call ./node_modules/.bin/uglifyjs ../dist/ares_pixijs.js -o ../dist/ares_pixijs.min.js
call ./node_modules/.bin/uglifyjs ../dist/ares_template.js -o ../dist/ares_template.min.js