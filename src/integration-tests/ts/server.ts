import * as http from 'http';
import * as fs from 'fs';

/**
 * simple HTTP server with Outbound-Rules: DENY: ALL.
 */
export function server() {
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
        "content-type": "text/html",
        "outbound-rules": "DENY: ALL",
      }
      response.writeHead(200, headers);
      response.end(content);
    });
  });
}