export const runningInNullOrigin = function (): boolean {
	if (typeof window !== "object" || typeof window.location !== "object")
		return false;

	return document.location.protocol !== 'http:' && document.location.protocol !== 'https:';
}

export const webWorkersAvailable = function (): boolean {
	if (typeof Worker !== "function" || runningInNullOrigin())
		return false;

	if (navigator && navigator.userAgent && navigator.userAgent.indexOf("Android 4.3") >= 0)
		return false;

	return true;
}

export const createErrorMessage = function (exception: any, title = "Unhandled exception"): string {
	if (exception == null)
		return title;

	title += ": ";

	if (typeof exception.content === "object") {
		const exceptionJSON = JSON.stringify(exception.content);

		if (exceptionJSON !== "{}")
			return title + exceptionJSON;
		else
			return title + exception.content;
	}
	else if (typeof exception.content === "string") {
		return title + exception.content;
	}
	else {
		return title + exception;
	}
}

export const printExceptionAndStackTraceToConsole = (exception: any, title = "Unhandled exception") => {
	console.log(createErrorMessage(exception, title));
}
