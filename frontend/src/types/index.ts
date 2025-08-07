export interface RequestHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}

export type FetchHeaders = Record<string, string>;
