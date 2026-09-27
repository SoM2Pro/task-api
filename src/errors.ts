export class HttpError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly extensions: Record<string, unknown>;
  readonly headers: Record<string, string>;

  constructor(
    status: number,
    title: string,
    detail: string,
    extensions: Record<string, unknown> = {},
    headers: Record<string, string> = {}
  ) {
    super(detail);
    this.name = "HttpError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.extensions = extensions;
    this.headers = headers;
  }
}

export const notFound = (detail: string): HttpError =>
  new HttpError(404, "Not Found", detail);

export const badRequest = (
  detail: string,
  extensions?: Record<string, unknown>,
): HttpError => new HttpError(400, "Bad Request", detail, extensions);

export const unauthorized = (
  detail: string,
  wwwAuthenticate: string = "Bearer",
): HttpError =>
  new HttpError(401, "Unauthorized", detail, {}, { "WWW-Authenticate": wwwAuthenticate });

export const conflict = (
  detail: string,
  extensions?: Record<string, unknown>,
): HttpError => new HttpError(409, "Conflict", detail, extensions);
