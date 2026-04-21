export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface FileReadCall {
  path: string;
  contentType: string;
}

export interface FileReadStub extends FileReadCall {
  kind: "file-read";
}

export interface TransformationAttachment {
  filename: string;
  type: string;
}

export interface TransformationCall {
  url: string;
  endpoint: string;
  headers: Record<string, string>;
  rawData: string;
  payload: JsonValue;
  attachment: TransformationAttachment;
}

export interface HttpPostStub {
  kind: "http-post";
  url: string;
  request: {
    headers: Record<string, string>;
    data: string;
  };
  attachment: TransformationAttachment;
}

export interface MailObject {
  from: {
    name: string;
    email: string;
  };
  to: {
    email: string;
    name: string;
  };
  subject: string;
  content: FileReadStub[];
  attachments: HttpPostStub[];
}

export interface HarnessResult {
  mail: MailObject;
  transformationCalls: TransformationCall[];
  fileReads: FileReadCall[];
}
