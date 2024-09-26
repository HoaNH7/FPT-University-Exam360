export class NetworkError extends Error {
    constructor(messsage) {
        super(messsage);
        this.name = this.constructor.name;
    }
}

export class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
