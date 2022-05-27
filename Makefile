.PHONY: build npm-install deploy dev-backend dev-frontend clean

JS_SRC_FILES = $(shell find ./js -type f \( -name '*.js' -or -name '*.ts' -or -name '*.tsx' -or -name '*.json' \))

build: js.tar.gz
	cargo build

js.tar.gz: $(JS_SRC_FILES) npm-install
	rm -f js/build.tar.gz
	cd js && npm run build
	cd js/build && tar -acf ../../js.tar.gz *

npm-install: js/package.json
	cd js && npm install

deploy: build
	cargo shuttle deploy

dev-backend:
	cargo run

dev-frontend: npm-install
	cd js && npm run dev

clean:
	rm -rf target js.tar.gz frontend js/build
