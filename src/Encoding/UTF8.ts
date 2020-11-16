import { StringBuilder } from "../Common/StringBuilder";

declare const TextEncoder: any;
declare const TextDecoder: any;
let nativeTextEncoder: any;
let nativeTextDecoder: any;

export class UTF8 {
	static decode(utf8Bytes: Uint8Array): string {
		if (!utf8Bytes || utf8Bytes.length == 0)
			return "";

		if (UTF8.createNativeTextEncoderAndDecoderIfAvailable()) {
			return nativeTextDecoder.decode(utf8Bytes);
		}
		else {
			return UTF8.decodeWithJS(utf8Bytes);
		}
	}

	static decodeWithJS(utf8Bytes: Uint8Array, startOffset = 0, endOffset?: number): string {
		if (!utf8Bytes || utf8Bytes.length == 0)
			return "";

		if (endOffset === undefined)
			endOffset = utf8Bytes.length;

		const output = new StringBuilder();

		let outputCodePoint: number;
		let leadByte: number;

		for (let readIndex = startOffset, length = endOffset; readIndex < length;) {
			leadByte = utf8Bytes[readIndex];

			if ((leadByte >>> 7) === 0) {
				outputCodePoint = leadByte;
				readIndex += 1;
			}
			else if ((leadByte >>> 5) === 6) {
				if (readIndex + 1 >= endOffset)
					throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

				outputCodePoint = ((leadByte & 31) << 6) | (utf8Bytes[readIndex + 1] & 63);
				readIndex += 2;
			}
			else if ((leadByte >>> 4) === 14) {
				if (readIndex + 2 >= endOffset)
					throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

				outputCodePoint = ((leadByte & 15) << 12) | ((utf8Bytes[readIndex + 1] & 63) << 6) | (utf8Bytes[readIndex + 2] & 63);
				readIndex += 3;
			}
			else if ((leadByte >>> 3) === 30) {
				if (readIndex + 3 >= endOffset)
					throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);

				outputCodePoint = ((leadByte & 7) << 18) | ((utf8Bytes[readIndex + 1] & 63) << 12) | ((utf8Bytes[readIndex + 2] & 63) << 6) | (utf8Bytes[readIndex + 3] & 63);
				readIndex += 4;
			}
			else
				throw new Error("Invalid UTF-8 stream: An invalid lead byte value encountered at position " + readIndex);

			output.appendCodePoint(outputCodePoint);
		}

		return output.getOutputString();
	}

	static createNativeTextEncoderAndDecoderIfAvailable(): boolean {
		if (nativeTextEncoder)
			return true;

		if (typeof TextEncoder == "function") {
			nativeTextEncoder = new TextEncoder("utf-8");
			nativeTextDecoder = new TextDecoder("utf-8");

			return true;
		}
		else
			return false;
	}
}
