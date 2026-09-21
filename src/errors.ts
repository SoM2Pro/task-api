export class HttpError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly extensions: Record<string, unknown>;

  constructor(
    status: number,
    title: string,
    detail: string,
    extensions: Record<string, unknown> = {},
  ) {
    super(detail);
    this.name = "HttpError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.extensions = extensions;
  }
}

export const notFound = (detail: string): HttpError =>
  new HttpError(404, "Not Found", detail);

export const badRequest = (
  detail: string,
  extensions?: Record<string, unknown>,
): HttpError => new HttpError(400, "Bad Request", detail, extensions);
