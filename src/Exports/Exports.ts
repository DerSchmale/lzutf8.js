import { CompressionCommon } from "../Common/CompressionCommon";
import { ObjectTools } from "../Common/ObjectTools";
import { Decompressor } from "../Decompression/Decompressor";
import { EventLoop } from "../Common/EventLoop";
import { WebWorker } from "../Async/WebWorker";
import { AsyncDecompressor } from "../Async/AsyncDecompressor";

export type DecompressionOptions = {
	useWebWorker?: boolean;
	blockSize?: number;
}

export function decompress(input: string): string {
	if (input == null)
		throw new TypeError("decompress: undefined or null input received");

	const inputBytes = CompressionCommon.decodeCompressedBytes(input);

	const decompressor = new Decompressor();
	const decompressedBytes = decompressor.decompressBlock(inputBytes);

	return CompressionCommon.encodeDecompressedBytes(decompressedBytes);
}

export function decompressAsync(input: string, options: DecompressionOptions, callback: (result?: string, error?: Error) => void) {
	if (callback == null)
		callback = () => { };

	if (input == null) {
		callback(undefined, new TypeError("decompressAsync: undefined or null input received"));
		return;
	}

	options = ObjectTools.override({
		useWebWorker: true,
		blockSize: 65536
	}, options);

	EventLoop.enqueueImmediate(() => {
		if (options.useWebWorker && WebWorker.createGlobalWorkerIfNeeded()) {
			WebWorker.decompressAsync(input, options, callback);
		}
		else {
			AsyncDecompressor.decompressAsync(input, options, callback);
		}
	});
}
