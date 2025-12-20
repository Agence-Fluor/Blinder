all: third-party/tfhe-rs/tfhe/pkg dist

third-party/tfhe-rs/tfhe/pkg:
	cd third-party/tfhe-rs/tfhe && wasm-pack build --release --target=nodejs --features=boolean-client-js-wasm-api,shortint-client-js-wasm-api