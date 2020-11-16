import { Base64 } from "../Encoding/Base64";
import { UTF8 } from "../Encoding/UTF8";

export class CompressionCommon
{
	static getCroppedBuffer(buffer: Uint8Array, cropStartOffset: number, cropLength: number, additionalCapacity: number = 0): Uint8Array
	{
		let croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
		croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));

		return croppedBuffer;
	}

	static decodeCompressedBytes(compressedData: string): Uint8Array
	{
		return Base64.decode(compressedData);
	}

	static encodeDecompressedBytes(decompressedBytes: Uint8Array): string
	{
		return UTF8.decode(decompressedBytes);
	}
}
