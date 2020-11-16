export class Timer {
	startTime: number;

	constructor() {
		this.restart();
	}

	restart() {
		this.startTime = Timer.getTimestamp();
	}

	getElapsedTime(): number {
		return Timer.getTimestamp() - this.startTime;
	}

	static getTimestamp(): number {
		if (!this.timestampFunc)
			this.createGlobalTimestampFunction();

		return this.timestampFunc();
	}

	private static createGlobalTimestampFunction() {
		if (typeof performance === "object" && performance.now) {
			const baseTimestamp = Date.now() - performance.now();

			this.timestampFunc = () => baseTimestamp + performance.now();
		}
		else if (Date.now) {
			this.timestampFunc = () => Date.now();
		}
		else {
			this.timestampFunc = () => (new Date()).getTime();
		}
	}

	private static timestampFunc: () => number;
}
