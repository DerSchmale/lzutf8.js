export class ObjectTools {
	static override<T extends V, V>(obj: T, newPropertyValues: V): T {
		return ObjectTools.extend(obj, newPropertyValues);
	}

	static extend<T, V>(obj: T, newProperties: V): T & V {
		if (obj == null)
			throw new TypeError("obj is null or undefined");

		if (typeof obj !== "object")
			throw new TypeError("obj is not an object");

		if (newProperties == null)
			newProperties = <any>{};

		if (typeof newProperties !== "object")
			throw new TypeError("newProperties is not an object");

		if (newProperties != null) {
			for (const property in newProperties)
				obj[<string>property] = newProperties[property];
		}

		return <T & V>obj;
	}
}
