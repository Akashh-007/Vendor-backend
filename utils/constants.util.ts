export class Constants {
    // ************ LABELS *****************
    static readonly ACTIVE: string = 'ACTIVE';

    // ************ COMMON CODES *****************
    static readonly ZERO: number = 0;
    static readonly SUCCESS: number = 1;
    static readonly DEFAULT: number = -2;
    static readonly ERROR: number = -3;
    static readonly ERR_UNDEFINED: number = -4;
    static readonly BLANK: number = -5;
    static readonly NULL: number = -8;
    static readonly EMPTY: number = -37;

    // ************ AUTHENTICATION CODES *****************
    static readonly AUTH_ERROR: number = -41;
    static readonly AUTH_KEY_EXPIRED: number = -43;
    static readonly AUTH_KEY_INVALID: number = -44;
    static readonly AUTH_KEY_NOT_PASSED: number = -49;

    // ************ DATABASE CODES *****************
    static readonly DB_CONNECTION_ERROR: number = -80;
    static readonly DB_QUERY_INVALID: number = -82;
    static readonly DB_QUERY_ERROR: number = -83;
    static readonly DB_QUERY_NO_RECORD_FOUND: number = -88;

    // ******** HTTP STATUS CODES  *************
    // #### 1xx Informational
    static readonly HTTP_CONTINUE: number = 100;
    static readonly HTTP_SWITCHING_PROTOCOLS: number = 101;
    static readonly HTTP_PROCESSING_WEBDAV: number = 102;

    // #### 2xx SUCCESS
    static readonly HTTP_OK: number = 200;
    static readonly HTTP_CREATED: number = 201;
    static readonly HTTP_ACCEPTED: number = 202;
    static readonly HTTP_NON_AUTHORITATIVE_INFORMATION: number = 203;
    static readonly HTTP_NO_CONTENT: number = 204;
    static readonly HTTP_RESET_CONTENT: number = 205;
    static readonly HTTP_PARTIAL_CONTENT: number = 206;
    static readonly HTTP_MULTI_STATUS_WEBDAV: number = 207;
    static readonly HTTP_ALREADY_REPORTED_WEBDAV: number = 208;
    static readonly HTTP_IM_USED: number = 226;

    // #### 3xx Redirection
    static readonly HTTP_MULTIPLE_CHOICES: number = 300;
    static readonly HTTP_MOVED_PERMANENTLY: number = 301;
    static readonly HTTP_FOUND: number = 302;
    static readonly HTTP_SEE_OTHER: number = 303;
    static readonly HTTP_NOT_MODIFIED: number = 304;
    static readonly HTTP_USE_PROXY: number = 305;
    static readonly HTTP_UNUSED: number = 306;
    static readonly HTTP_TEMPORARY_REDIRECT: number = 307;
    static readonly HTTP_PERMANENT_REDIRECT: number = 308;

    // #### 4xx Client Error
    static readonly HTTP_BAD_REQUEST: number = 400;
    static readonly HTTP_UNAUTHORIZED: number = 401;
    static readonly HTTP_PAYMENT_REQUIRED: number = 402;
    static readonly HTTP_FORBIDDEN: number = 403;
    static readonly HTTP_NOT_FOUND: number = 404;
    static readonly HTTP_METHOD_NOT_ALLOWED: number = 405;
    static readonly HTTP_NOT_ACCEPTABLE: number = 406;
    static readonly HTTP_PROXY_AUTHENTICATION_REQUIRED: number = 407;
    static readonly HTTP_REQUEST_TIMEOUT: number = 408;
    static readonly HTTP_CONFLICT: number = 409;
    static readonly HTTP_GONE: number = 410;

    // #### 5xx Server Error
    static readonly HTTP_INTERNAL_SERVER_ERROR: number = 500;
    static readonly HTTP_NOT_IMPLEMENTED: number = 501;
    static readonly HTTP_BAD_GATEWAY: number = 502;
}