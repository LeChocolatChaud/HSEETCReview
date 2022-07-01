class EnhancedXMLHttpRequest {
    url: string;
    method: string;
    data: any;
    xhr: XMLHttpRequest;

    constructor(url: string, method: string, data: any) {
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
    async getResponse(abortSignal?: AbortSignal) {
        return new Promise<string>((resolve, reject) => {
            var interval = setInterval(() => {
                if (this.xhr.readyState === 4) {
                    switch (this.xhr.status) {
                        case 200:
                            resolve(this.xhr.responseText);
                            clearInterval(interval);
                        case 404:
                            reject(
                                new XMLRequestFailError(
                                    `Resource "${this.url}" not found.`,
                                    404
                                )
                            );
                            clearInterval(interval);
                        case 500:
                            reject(
                                new XMLRequestFailError(
                                    "Internal server error.",
                                    500
                                )
                            );
                            clearInterval(interval);
                        default:
                            reject(
                                new XMLRequestFailError(
                                    "Unknown error.",
                                    this.xhr.status
                                )
                            );
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
    }
}

class XMLRequestError extends DOMException {
    constructor(message: string) {
        super(message);
    }
}

class XMLRequestFailError extends XMLRequestError {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}
