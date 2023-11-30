.PHONY: build deploy deploy-s3 clean

JS_SRC_FILES = $(shell find ./js -type f \( -name '*.js' -or -name '*.ts' -or -name '*.tsx' -or -name '*.json' \))

build: js.tar.gz
	cargo build

js.tar.gz: js/node_modules $(JS_SRC_FILES)
	rm -f js.tar.gz
	cd js && npm run build
	cd js/build && tar -acf ../../js.tar.gz *

js/node_modules: js/package.json
	cd js && npm install

deploy: deploy-s3
	cargo shuttle deploy --no-test

deploy-s3: js.tar.gz
	aws s3 cp js.tar.gz s3://jming422-deploy/birdie-js.tar.gz

clean:
	rm -rf target js.tar.gz frontend js/build
