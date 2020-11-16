import { createErrorMessage, webWorkersAvailable } from "../Globals/Globals";
import {
	decompress,
	DecompressionOptions
} from "../Exports/Exports";


type WorkerMessageDecompress = {
	token: string;
	type: "decompress";
	data: string;
}

type WorkerMessageDecompressionResult = {
	token: string;
	type: "decompressionResult";
	data: string;
}

type WorkerMessageError = {
	token: string;
	type: "error";
	error: string;
}

type WorkerMessage = WorkerMessageDecompress;

export class WebWorker {
	static globalWorker: Worker;
	static scriptURI: string | undefined;

	static decompressAsync(input: string, options: DecompressionOptions, callback: (result?: string | Uint8Array, error?: Error) => void) {
		const request: WorkerMessageDecompress = {
			token: Math.random().toString(),
			type: "decompress",
			data: input
		};

		const responseListener = (e: any) => {
			const response: WorkerMessageDecompress | WorkerMessageError = e.data;

			if (!response || response.token != request.token)
				return;

			WebWorker.globalWorker.removeEventListener("message", responseListener);

			if (response.type == "error")
				callback(undefined, new Error(response.error));
			else
				callback(response.data);
		};

		WebWorker.globalWorker.addEventListener("message", responseListener);
		WebWorker.globalWorker.postMessage(request, []);
	}

	// Worker internal handler
	static installWebWorkerIfNeeded() {
		if (typeof self == "object" && self.document === undefined && self.addEventListener != undefined) {
			self.addEventListener("message", (e: MessageEvent) => {
				const request: WorkerMessage = e.data;

				if (request.type == "decompress") {
					let decompressedData: string;

					try {
						decompressedData = decompress(request.data);
					} catch (e) {
						self.postMessage(<WorkerMessageError>{ token: request.token, type: "error", error: createErrorMessage(e) }, <any>[]);
						return;
					}

					const response: WorkerMessageDecompressionResult =
						{
							token: request.token,
							type: "decompressionResult",
							data: decompressedData,
						};


					self.postMessage(response, <any>[]);
				}
			});

			self.addEventListener("error", (e: ErrorEvent) => {
				console.log(createErrorMessage(e.error, "Unexpected LZUTF8 WebWorker exception"));
			});
		}
	}

	static createGlobalWorkerIfNeeded(): boolean {
		if (WebWorker.globalWorker)
			return true;

		if (!webWorkersAvailable())
			return false;

		if (!WebWorker.scriptURI && typeof document === "object") {
			const scriptElement = document.getElementById("lzutf8");
			if (scriptElement != null)
				WebWorker.scriptURI = scriptElement.getAttribute("src") || undefined;
		}

		if (WebWorker.scriptURI) {
			WebWorker.globalWorker = new Worker(WebWorker.scriptURI);
			return true;
		} else {
			return false;
		}
	}

	static terminate() {
		if (WebWorker.globalWorker) {
			WebWorker.globalWorker.terminate();
			WebWorker.globalWorker = <any>undefined;
		}
	}
}

// Install listener during script load if inside a worker
WebWorker.installWebWorkerIfNeeded();

