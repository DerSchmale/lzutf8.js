const reverseCharCodeMap: Uint8Array = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 255, 255, 255, 255]);

const paddingCharacter = "=";
const paddingCharCode = 61;

export class Base64 {
	static decode(base64String: string): Uint8Array {
		if (!base64String)
			return new Uint8Array(0);

		return Base64.decodeWithJS(base64String);
	}

	static decodeWithJS(base64String: string, outputBuffer?: Uint8Array): Uint8Array {
		if (!base64String || base64String.length == 0)
			return new Uint8Array(0);

		// Add padding if omitted
		const lengthModulo4 = base64String.length % 4;

		if (lengthModulo4 === 1)
			throw new Error(`Invalid Base64 string: length % 4 == 1`);
		else if (lengthModulo4 === 2)
			base64String += paddingCharacter + paddingCharacter;
		else if (lengthModulo4 === 3)
			base64String += paddingCharacter;

		if (!outputBuffer)
			outputBuffer = new Uint8Array(base64String.length);

		let outputPosition = 0;
		const length = base64String.length;

		for (let i = 0; i < length; i += 4) {
			const uint24 = (reverseCharCodeMap[base64String.charCodeAt(i)] << 18) |
				(reverseCharCodeMap[base64String.charCodeAt(i + 1)] << 12) |
				(reverseCharCodeMap[base64String.charCodeAt(i + 2)] << 6) |
				(reverseCharCodeMap[base64String.charCodeAt(i + 3)]);

			outputBuffer[outputPosition++] = (uint24 >>> 16) & 255;
			outputBuffer[outputPosition++] = (uint24 >>> 8) & 255;
			outputBuffer[outputPosition++] = (uint24) & 255;
		}

		// Remove 1 or 2 last bytes if padding characters were added to the string
		if (base64String.charCodeAt(length - 1) == paddingCharCode)
			outputPosition--;

		if (base64String.charCodeAt(length - 2) == paddingCharCode)
			outputPosition--;

		return outputBuffer.subarray(0, outputPosition);
	}
}
