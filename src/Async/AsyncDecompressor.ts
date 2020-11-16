import { Decompressor } from "../Decompression/Decompressor";
import { CompressionCommon } from "../Common/CompressionCommon";
import { ArrayTools } from "../Common/ArrayTools";
import { Timer } from "../Common/Timer";
import { EventLoop } from "../Common/EventLoop";
import { DecompressionOptions } from "../Exports/Exports";

export class AsyncDecompressor {
	static decompressAsync(input: any, options: DecompressionOptions, callback: (result: any, error?: Error) => void) {
		if (!callback)
			throw new TypeError("decompressAsync: No callback argument given");

		const timer = new Timer();
		try {
			input = CompressionCommon.decodeCompressedBytes(input);
		}
		catch (e) {
			callback(undefined, e);
			return;
		}

		const decompressor = new Decompressor();
		const sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize!);

		const decompressedBlocks: Uint8Array[] = [];

		const decompressBlocksStartingAt = (index: number) => {
			if (index < sourceBlocks.length) {
				let decompressedBlock: Uint8Array;

				try {
					decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
				}
				catch (e) {
					callback(undefined, e);
					return;
				}

				decompressedBlocks.push(decompressedBlock);

				if (timer.getElapsedTime() <= 20) {
					decompressBlocksStartingAt(index + 1);
				}
				else {
					EventLoop.enqueueImmediate(() => decompressBlocksStartingAt(index + 1));
					timer.restart();
				}
			}
			else {
				let joinedDecompressedBlocks = ArrayTools.concatUint8Arrays(decompressedBlocks);

				EventLoop.enqueueImmediate(() => {
					let result: any;

					try {
						result = CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks);
					}
					catch (e) {
						callback(undefined, e);
						return;
					}

					EventLoop.enqueueImmediate(() => callback(result));
				});
			}
		}

		EventLoop.enqueueImmediate(() => decompressBlocksStartingAt(0));
	}
}
