import { readFileSync } from "node:fs";
import vm from "node:vm";

import { ZADOSTI_SCRIPT_PATH } from "../fixtures.ts";
import type {
  FileReadCall,
  FileReadStub,
  HarnessResult,
  HttpPostStub,
  JsonValue,
  MailObject,
  TransformationCall,
} from "./types.ts";

type LegacySendMail = (data: unknown) => MailObject;

function endpointFromUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname.replace("/transformation-service", "");
}

export function executeZadosti(data: unknown): HarnessResult {
  const source = readFileSync(ZADOSTI_SCRIPT_PATH, "utf8");
  const transformationCalls: TransformationCall[] = [];
  const fileReads: FileReadCall[] = [];

  // Inferred: the hidden runtime likely returns richer helper objects from HTTP.post/File.read.
  // This adapter intentionally freezes only the arguments requested by zadosti.js, not the hidden runtime object shape.
  const context = {
    HTTP: {
      post(
        url: string,
        request: { headers: Record<string, string>; data: string },
        attachment: { filename: string; type: string },
      ): HttpPostStub {
        const payload = JSON.parse(request.data) as JsonValue;
        transformationCalls.push({
          url,
          endpoint: endpointFromUrl(url),
          headers: { ...request.headers },
          rawData: request.data,
          payload,
          attachment: { ...attachment },
        });

        return {
          kind: "http-post",
          url,
          request: {
            headers: { ...request.headers },
            data: request.data,
          },
          attachment: { ...attachment },
        };
      },
    },
    File: {
      read(path: string, contentType: string): FileReadStub {
        const stub = {
          kind: "file-read" as const,
          path,
          contentType,
        };

        fileReads.push({
          path,
          contentType,
        });

        return stub;
      },
    },
    JSON,
    Array,
  };

  const sendMail = vm.runInNewContext(`${source}\n;sendMail`, context, {
    filename: ZADOSTI_SCRIPT_PATH,
  }) as LegacySendMail;

  const mail = sendMail(structuredClone(data));

  return {
    mail,
    transformationCalls,
    fileReads,
  };
}
