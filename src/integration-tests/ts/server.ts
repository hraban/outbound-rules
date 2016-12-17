import * as http from 'http';
import * as fs from 'fs';
import * as url from 'url';

const contentTypes = {
  json: "application/json",
  html: "text/html; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  js: "application/javascript",
};

function getExtension(path: string): string {
  const i = path.lastIndexOf('.');
  if (i === -1) {
    return;
  } 
  return path.slice(i+1);
}

function contentType(ustr: string): string {
  const path = url.parse(ustr).pathname;
  return contentTypes[getExtension(path)] || "application/octet-stream";
}

/**
 * simple HTTP server with Outbound-Rules: DENY: ALL.
 */
export function server(outboundRules?: string) {
  return http.createServer((request, response) => {
    // wow, __dirname. Please take note, EVERY OTHER LANGUAGE EVER.
    // request.url is normalised.
    fs.readFile(__dirname + request.url, (err, content) => {
      if (err) {
        console.error(err);
        response.writeHead(500);
        response.end("Something went wrong: " + err);
        return;
      }

      const headers = {
        "content-type": contentType(request.url),
      }
      if (outboundRules !== undefined) {
        headers["outbound-rules"] = outboundRules;
      }
      response.writeHead(200, headers);
      response.end(content);
    });
  });
}