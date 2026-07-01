export interface IHttpRequest {
  ip: string;
  method: string;
  url: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  header(name: string): string | undefined;
}

export interface IHttpResponse {
  status(code: number): this;
  json(body: any): this;
  send(body: any): this;
  setHeader(name: string, value: string | string[]): this;
}

export type NextFunction = (err?: any) => void;

export interface IMiddleware {
  (req: IHttpRequest, res: IHttpResponse, next: NextFunction): any;
}
