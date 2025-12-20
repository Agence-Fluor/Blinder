all:
	cd third-party/tfhe-rs/tfhe && \
	wasm-pack build --release --target=web --features=boolean-client-js-wasm-api,shortint-client-js-wasm-api	&& \
	rm -rf  client/src/tfhe/ &&  \
	cp -r third-party/tfhe-rs/tfhe/pkg client/src/tfhe
	cp -r third-party/tfhe-rs/tfhe/pkg/tfhe_bg.wasm client/public/tfhe_bg.wasm