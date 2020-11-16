export class ArrayTools {
	static doubleByteArrayCapacity(array: Uint8Array): Uint8Array {
		const newArray = new Uint8Array(array.length * 2);
		newArray.set(array);

		return newArray;
	}

	static concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
		let totalLength = 0;

		for (const array of arrays)
			totalLength += array.length;

		const result = new Uint8Array(totalLength);
		let offset = 0;

		for (const array of arrays) {
			result.set(array, offset);
			offset += array.length;
		}

		return result;
	}

	static splitByteArray(byteArray: Uint8Array, maxPartLength: number): Uint8Array[] {
		const result: Uint8Array[] = [];

		for (let offset = 0; offset < byteArray.length;) {
			let blockLength = Math.min(maxPartLength, byteArray.length - offset);
			result.push(byteArray.subarray(offset, offset + blockLength));

			offset += blockLength;
		}

		return result;
	}
}
