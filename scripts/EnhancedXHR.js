"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class EnhancedXMLHttpRequest {
    constructor(url, method, data) {
        this.url = url;
        this.method = method;
        this.data = data;
        this.xhr = new XMLHttpRequest();
    }
    send() {
        this.xhr.open(this.method, this.url, true);
        this.xhr.setRequestHeader("Content-Type", "application/json");
        this.xhr.send(JSON.stringify(this.data));
    }
    getResponse(abortSignal) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var interval = setInterval(() => {
                    if (this.xhr.readyState === 4) {
                        switch (this.xhr.status) {
                            case 200:
                                resolve(this.xhr.responseText);
                                clearInterval(interval);
                            case 404:
                                reject(new XMLRequestFailError(`Resource "${this.url}" not found.`, 404));
                                clearInterval(interval);
                            case 500:
                                reject(new XMLRequestFailError("Internal server error.", 500));
                                clearInterval(interval);
                            default:
                                reject(new XMLRequestFailError("Unknown error.", this.xhr.status));
                                clearInterval(interval);
                        }
                    }
                }, 10);
                if (abortSignal) {
                    abortSignal.addEventListener("abort", () => {
                        clearInterval(interval);
                        reject(new XMLRequestError("Abort signal received."));
                    });
                }
            });
        });
    }
}
class XMLRequestError extends DOMException {
    constructor(message) {
        super(message);
    }
}
class XMLRequestFailError extends XMLRequestError {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
