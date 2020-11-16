var reverseCharCodeMap = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 255, 255, 255, 255]);
var paddingCharacter = "=";
var paddingCharCode = 61;
var Base64 = (function () {
    function Base64() {
    }
    Base64.decode = function (base64String) {
        if (!base64String)
            return new Uint8Array(0);
        return Base64.decodeWithJS(base64String);
    };
    Base64.decodeWithJS = function (base64String, outputBuffer) {
        if (!base64String || base64String.length == 0)
            return new Uint8Array(0);
        var lengthModulo4 = base64String.length % 4;
        if (lengthModulo4 === 1)
            throw new Error("Invalid Base64 string: length % 4 == 1");
        else if (lengthModulo4 === 2)
            base64String += paddingCharacter + paddingCharacter;
        else if (lengthModulo4 === 3)
            base64String += paddingCharacter;
        if (!outputBuffer)
            outputBuffer = new Uint8Array(base64String.length);
        var outputPosition = 0;
        var length = base64String.length;
        for (var i = 0; i < length; i += 4) {
            var uint24 = (reverseCharCodeMap[base64String.charCodeAt(i)] << 18) |
                (reverseCharCodeMap[base64String.charCodeAt(i + 1)] << 12) |
                (reverseCharCodeMap[base64String.charCodeAt(i + 2)] << 6) |
                (reverseCharCodeMap[base64String.charCodeAt(i + 3)]);
            outputBuffer[outputPosition++] = (uint24 >>> 16) & 255;
            outputBuffer[outputPosition++] = (uint24 >>> 8) & 255;
            outputBuffer[outputPosition++] = (uint24) & 255;
        }
        if (base64String.charCodeAt(length - 1) == paddingCharCode)
            outputPosition--;
        if (base64String.charCodeAt(length - 2) == paddingCharCode)
            outputPosition--;
        return outputBuffer.subarray(0, outputPosition);
    };
    return Base64;
}());

var StringBuilder = (function () {
    function StringBuilder(outputBufferCapacity) {
        if (outputBufferCapacity === void 0) { outputBufferCapacity = 1024; }
        this.outputBufferCapacity = outputBufferCapacity;
        this.outputPosition = 0;
        this.outputString = "";
        this.outputBuffer = new Uint16Array(this.outputBufferCapacity);
    }
    StringBuilder.prototype.appendCharCode = function (charCode) {
        this.outputBuffer[this.outputPosition++] = charCode;
        if (this.outputPosition === this.outputBufferCapacity)
            this.flushBufferToOutputString();
    };
    StringBuilder.prototype.appendCodePoint = function (codePoint) {
        if (codePoint <= 0xFFFF) {
            this.appendCharCode(codePoint);
        }
        else if (codePoint <= 0x10FFFF) {
            this.appendCharCode(0xD800 + ((codePoint - 0x10000) >>> 10));
            this.appendCharCode(0xDC00 + ((codePoint - 0x10000) & 1023));
        }
        else
            throw new Error("appendCodePoint: A code point of " + codePoint + " cannot be encoded in UTF-16");
    };
    StringBuilder.prototype.getOutputString = function () {
        this.flushBufferToOutputString();
        return this.outputString;
    };
    StringBuilder.prototype.flushBufferToOutputString = function () {
        if (this.outputPosition === this.outputBufferCapacity)
            this.outputString += String.fromCharCode.apply(null, this.outputBuffer);
        else
            this.outputString += String.fromCharCode.apply(null, this.outputBuffer.subarray(0, this.outputPosition));
        this.outputPosition = 0;
    };
    return StringBuilder;
}());

var nativeTextEncoder;
var nativeTextDecoder;
var UTF8 = (function () {
    function UTF8() {
    }
    UTF8.decode = function (utf8Bytes) {
        if (!utf8Bytes || utf8Bytes.length == 0)
            return "";
        if (UTF8.createNativeTextEncoderAndDecoderIfAvailable()) {
            return nativeTextDecoder.decode(utf8Bytes);
        }
        else {
            return UTF8.decodeWithJS(utf8Bytes);
        }
    };
    UTF8.decodeWithJS = function (utf8Bytes, startOffset, endOffset) {
        if (startOffset === void 0) { startOffset = 0; }
        if (!utf8Bytes || utf8Bytes.length == 0)
            return "";
        if (endOffset === undefined)
            endOffset = utf8Bytes.length;
        var output = new StringBuilder();
        var outputCodePoint;
        var leadByte;
        for (var readIndex = startOffset, length_1 = endOffset; readIndex < length_1;) {
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
    };
    UTF8.createNativeTextEncoderAndDecoderIfAvailable = function () {
        if (nativeTextEncoder)
            return true;
        if (typeof TextEncoder == "function") {
            nativeTextEncoder = new TextEncoder("utf-8");
            nativeTextDecoder = new TextDecoder("utf-8");
            return true;
        }
        else
            return false;
    };
    return UTF8;
}());

var CompressionCommon = (function () {
    function CompressionCommon() {
    }
    CompressionCommon.getCroppedBuffer = function (buffer, cropStartOffset, cropLength, additionalCapacity) {
        if (additionalCapacity === void 0) { additionalCapacity = 0; }
        var croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
        croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));
        return croppedBuffer;
    };
    CompressionCommon.decodeCompressedBytes = function (compressedData) {
        return Base64.decode(compressedData);
    };
    CompressionCommon.encodeDecompressedBytes = function (decompressedBytes) {
        return UTF8.decode(decompressedBytes);
    };
    return CompressionCommon;
}());

var ObjectTools = (function () {
    function ObjectTools() {
    }
    ObjectTools.override = function (obj, newPropertyValues) {
        return ObjectTools.extend(obj, newPropertyValues);
    };
    ObjectTools.extend = function (obj, newProperties) {
        if (obj == null)
            throw new TypeError("obj is null or undefined");
        if (typeof obj !== "object")
            throw new TypeError("obj is not an object");
        if (newProperties == null)
            newProperties = {};
        if (typeof newProperties !== "object")
            throw new TypeError("newProperties is not an object");
        if (newProperties != null) {
            for (var property in newProperties)
                obj[property] = newProperties[property];
        }
        return obj;
    };
    return ObjectTools;
}());

var ArrayTools = (function () {
    function ArrayTools() {
    }
    ArrayTools.doubleByteArrayCapacity = function (array) {
        var newArray = new Uint8Array(array.length * 2);
        newArray.set(array);
        return newArray;
    };
    ArrayTools.concatUint8Arrays = function (arrays) {
        var totalLength = 0;
        for (var _i = 0, arrays_1 = arrays; _i < arrays_1.length; _i++) {
            var array = arrays_1[_i];
            totalLength += array.length;
        }
        var result = new Uint8Array(totalLength);
        var offset = 0;
        for (var _a = 0, arrays_2 = arrays; _a < arrays_2.length; _a++) {
            var array = arrays_2[_a];
            result.set(array, offset);
            offset += array.length;
        }
        return result;
    };
    ArrayTools.splitByteArray = function (byteArray, maxPartLength) {
        var result = [];
        for (var offset = 0; offset < byteArray.length;) {
            var blockLength = Math.min(maxPartLength, byteArray.length - offset);
            result.push(byteArray.subarray(offset, offset + blockLength));
            offset += blockLength;
        }
        return result;
    };
    return ArrayTools;
}());

var Decompressor = (function () {
    function Decompressor() {
        this.MaximumMatchDistance = 32767;
        this.outputPosition = 0;
    }
    Decompressor.prototype.decompressBlock = function (input) {
        if (this.inputBufferRemainder) {
            input = ArrayTools.concatUint8Arrays([this.inputBufferRemainder, input]);
            this.inputBufferRemainder = undefined;
        }
        var outputStartPosition = this.cropOutputBufferToWindowAndInitialize(Math.max(input.length * 4, 1024));
        for (var readPosition = 0, inputLength = input.length; readPosition < inputLength; readPosition++) {
            var inputValue = input[readPosition];
            if (inputValue >>> 6 != 3) {
                this.outputByte(inputValue);
                continue;
            }
            var sequenceLengthIdentifier = inputValue >>> 5;
            if (readPosition == inputLength - 1 ||
                (readPosition == inputLength - 2 && sequenceLengthIdentifier == 7)) {
                this.inputBufferRemainder = input.subarray(readPosition);
                break;
            }
            if (input[readPosition + 1] >>> 7 === 1) {
                this.outputByte(inputValue);
            }
            else {
                var matchLength = inputValue & 31;
                var matchDistance = void 0;
                if (sequenceLengthIdentifier == 6) {
                    matchDistance = input[readPosition + 1];
                    readPosition += 1;
                }
                else {
                    matchDistance = (input[readPosition + 1] << 8) | (input[readPosition + 2]);
                    readPosition += 2;
                }
                var matchPosition = this.outputPosition - matchDistance;
                for (var offset = 0; offset < matchLength; offset++)
                    this.outputByte(this.outputBuffer[matchPosition + offset]);
            }
        }
        this.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence();
        return CompressionCommon.getCroppedBuffer(this.outputBuffer, outputStartPosition, this.outputPosition - outputStartPosition);
    };
    Decompressor.prototype.outputByte = function (value) {
        if (this.outputPosition === this.outputBuffer.length)
            this.outputBuffer = ArrayTools.doubleByteArrayCapacity(this.outputBuffer);
        this.outputBuffer[this.outputPosition++] = value;
    };
    Decompressor.prototype.cropOutputBufferToWindowAndInitialize = function (initialCapacity) {
        if (!this.outputBuffer) {
            this.outputBuffer = new Uint8Array(initialCapacity);
            return 0;
        }
        var cropLength = Math.min(this.outputPosition, this.MaximumMatchDistance);
        this.outputBuffer = CompressionCommon.getCroppedBuffer(this.outputBuffer, this.outputPosition - cropLength, cropLength, initialCapacity);
        this.outputPosition = cropLength;
        if (this.outputBufferRemainder) {
            for (var i = 0; i < this.outputBufferRemainder.length; i++)
                this.outputByte(this.outputBufferRemainder[i]);
            this.outputBufferRemainder = undefined;
        }
        return cropLength;
    };
    Decompressor.prototype.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence = function () {
        for (var offset = 1; offset <= 4 && this.outputPosition - offset >= 0; offset++) {
            var value = this.outputBuffer[this.outputPosition - offset];
            if ((offset < 4 && (value >>> 3) === 30) ||
                (offset < 3 && (value >>> 4) === 14) ||
                (offset < 2 && (value >>> 5) === 6)) {
                this.outputBufferRemainder = this.outputBuffer.subarray(this.outputPosition - offset, this.outputPosition);
                this.outputPosition -= offset;
                return;
            }
        }
    };
    return Decompressor;
}());

var runningInNullOrigin = function () {
    if (typeof window !== "object" || typeof window.location !== "object")
        return false;
    return document.location.protocol !== 'http:' && document.location.protocol !== 'https:';
};
var webWorkersAvailable = function () {
    if (typeof Worker !== "function" || runningInNullOrigin())
        return false;
    if (navigator && navigator.userAgent && navigator.userAgent.indexOf("Android 4.3") >= 0)
        return false;
    return true;
};
var createErrorMessage = function (exception, title) {
    if (title === void 0) { title = "Unhandled exception"; }
    if (exception == null)
        return title;
    title += ": ";
    if (typeof exception.content === "object") {
        var exceptionJSON = JSON.stringify(exception.content);
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
};
var printExceptionAndStackTraceToConsole = function (exception, title) {
    if (title === void 0) { title = "Unhandled exception"; }
    console.log(createErrorMessage(exception, title));
};

var queuedFunctions = [];
var asyncFlushFunc;
var EventLoop = (function () {
    function EventLoop() {
    }
    EventLoop.enqueueImmediate = function (func) {
        queuedFunctions.push(func);
        if (queuedFunctions.length === 1)
            asyncFlushFunc();
    };
    EventLoop.initializeScheduler = function () {
        var flush = function () {
            for (var _i = 0, queuedFunctions_1 = queuedFunctions; _i < queuedFunctions_1.length; _i++) {
                var func = queuedFunctions_1[_i];
                try {
                    func.call(undefined);
                }
                catch (exception) {
                    printExceptionAndStackTraceToConsole(exception, "enqueueImmediate exception");
                }
            }
            queuedFunctions.length = 0;
        };
        if (typeof window === "object" && typeof window.addEventListener === "function" && typeof window.postMessage === "function") {
            var token_1 = "enqueueImmediate-" + Math.random().toString();
            window.addEventListener("message", function (event) {
                if (event.data === token_1)
                    flush();
            });
            var targetOrigin_1;
            if (runningInNullOrigin())
                targetOrigin_1 = '*';
            else
                targetOrigin_1 = window.location.href;
            asyncFlushFunc = function () { return window.postMessage(token_1, targetOrigin_1); };
        }
        else if (typeof MessageChannel === "function" && typeof MessagePort === "function") {
            var channel_1 = new MessageChannel();
            channel_1.port1.onmessage = function () { return flush(); };
            asyncFlushFunc = function () { return channel_1.port2.postMessage(0); };
        }
        else {
            asyncFlushFunc = function () { return setTimeout(function () { return flush(); }, 0); };
        }
    };
    return EventLoop;
}());
EventLoop.initializeScheduler();

var WebWorker = (function () {
    function WebWorker() {
    }
    WebWorker.decompressAsync = function (input, options, callback) {
        var request = {
            token: Math.random().toString(),
            type: "decompress",
            data: input
        };
        var responseListener = function (e) {
            var response = e.data;
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
    };
    WebWorker.installWebWorkerIfNeeded = function () {
        if (typeof self == "object" && self.document === undefined && self.addEventListener != undefined) {
            self.addEventListener("message", function (e) {
                var request = e.data;
                if (request.type == "decompress") {
                    var decompressedData = void 0;
                    try {
                        decompressedData = decompress(request.data);
                    }
                    catch (e) {
                        self.postMessage({ token: request.token, type: "error", error: createErrorMessage(e) }, []);
                        return;
                    }
                    var response = {
                        token: request.token,
                        type: "decompressionResult",
                        data: decompressedData,
                    };
                    self.postMessage(response, []);
                }
            });
            self.addEventListener("error", function (e) {
                console.log(createErrorMessage(e.error, "Unexpected LZUTF8 WebWorker exception"));
            });
        }
    };
    WebWorker.createGlobalWorkerIfNeeded = function () {
        if (WebWorker.globalWorker)
            return true;
        if (!webWorkersAvailable())
            return false;
        if (!WebWorker.scriptURI && typeof document === "object") {
            var scriptElement = document.getElementById("lzutf8");
            if (scriptElement != null)
                WebWorker.scriptURI = scriptElement.getAttribute("src") || undefined;
        }
        if (WebWorker.scriptURI) {
            WebWorker.globalWorker = new Worker(WebWorker.scriptURI);
            return true;
        }
        else {
            return false;
        }
    };
    WebWorker.terminate = function () {
        if (WebWorker.globalWorker) {
            WebWorker.globalWorker.terminate();
            WebWorker.globalWorker = undefined;
        }
    };
    return WebWorker;
}());
WebWorker.installWebWorkerIfNeeded();

var Timer = (function () {
    function Timer() {
        this.restart();
    }
    Timer.prototype.restart = function () {
        this.startTime = Timer.getTimestamp();
    };
    Timer.prototype.getElapsedTime = function () {
        return Timer.getTimestamp() - this.startTime;
    };
    Timer.getTimestamp = function () {
        if (!this.timestampFunc)
            this.createGlobalTimestampFunction();
        return this.timestampFunc();
    };
    Timer.createGlobalTimestampFunction = function () {
        if (typeof performance === "object" && performance.now) {
            var baseTimestamp_1 = Date.now() - performance.now();
            this.timestampFunc = function () { return baseTimestamp_1 + performance.now(); };
        }
        else if (Date.now) {
            this.timestampFunc = function () { return Date.now(); };
        }
        else {
            this.timestampFunc = function () { return (new Date()).getTime(); };
        }
    };
    return Timer;
}());

var AsyncDecompressor = (function () {
    function AsyncDecompressor() {
    }
    AsyncDecompressor.decompressAsync = function (input, options, callback) {
        if (!callback)
            throw new TypeError("decompressAsync: No callback argument given");
        var timer = new Timer();
        try {
            input = CompressionCommon.decodeCompressedBytes(input);
        }
        catch (e) {
            callback(undefined, e);
            return;
        }
        var decompressor = new Decompressor();
        var sourceBlocks = ArrayTools.splitByteArray(input, options.blockSize);
        var decompressedBlocks = [];
        var decompressBlocksStartingAt = function (index) {
            if (index < sourceBlocks.length) {
                var decompressedBlock = void 0;
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
                    EventLoop.enqueueImmediate(function () { return decompressBlocksStartingAt(index + 1); });
                    timer.restart();
                }
            }
            else {
                var joinedDecompressedBlocks_1 = ArrayTools.concatUint8Arrays(decompressedBlocks);
                EventLoop.enqueueImmediate(function () {
                    var result;
                    try {
                        result = CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks_1);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    EventLoop.enqueueImmediate(function () { return callback(result); });
                });
            }
        };
        EventLoop.enqueueImmediate(function () { return decompressBlocksStartingAt(0); });
    };
    return AsyncDecompressor;
}());

function decompress(input) {
    if (input == null)
        throw new TypeError("decompress: undefined or null input received");
    var inputBytes = CompressionCommon.decodeCompressedBytes(input);
    var decompressor = new Decompressor();
    var decompressedBytes = decompressor.decompressBlock(inputBytes);
    return CompressionCommon.encodeDecompressedBytes(decompressedBytes);
}
function decompressAsync(input, options, callback) {
    if (callback == null)
        callback = function () { };
    if (input == null) {
        callback(undefined, new TypeError("decompressAsync: undefined or null input received"));
        return;
    }
    options = ObjectTools.override({
        useWebWorker: true,
        blockSize: 65536
    }, options);
    EventLoop.enqueueImmediate(function () {
        if (options.useWebWorker && WebWorker.createGlobalWorkerIfNeeded()) {
            WebWorker.decompressAsync(input, options, callback);
        }
        else {
            AsyncDecompressor.decompressAsync(input, options, callback);
        }
    });
}

export { decompress, decompressAsync };
