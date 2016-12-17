import * as logic from '../logic';
import {OutboundRulesPlugin} from '../webextension-wrapper';

describe('plugin wrapper', () => {

  it('initializes the backend', () => {
    const backend = {
      initRequest: jest.fn(),
      shouldAccept: jest.fn(),
    };

    const backendConstructor = jest.fn<logic.IPluginBackend>(() => backend);

    const plugin = new OutboundRulesPlugin(0, backendConstructor);

    // test mocking
    expect((<any>plugin).backend).toBe(backend);

    plugin.onBeforeSendHeaders({
      url: "http://foo.com/bar",
      requestId: "0",
      tabId: 1,
      frameId: 0,
      parentFrameId: -1,
      originUrl: "http://foo.com/bar",
      method: "GET",
      type: "main_frame",
      timeStamp: 0,
    });

    plugin.onHeadersReceived({
      url: "http://foo.com/bar",
      requestId: "0",
      tabId: 1,
      frameId: 0,
      parentFrameId: -1,
      statusLine: "HTTP/1.1 200 OK",
      statusCode: 200,
      type: "main_frame",
      timeStamp: 0,
      responseHeaders: [
        {
          name: "outbound-rules",
          value: "Deny: ALL",
        },
      ],
    });

    expect(backend.initRequest).toHaveBeenCalledTimes(1);
    expect(backend.initRequest).toHaveBeenCalledWith(1, "http://foo.com/bar", "Deny: ALL");
    expect(backend.shouldAccept).toHaveBeenCalledTimes(0);
  });

  it('clears the rules if a reload has no rules', () => {
    const backend = {
      initRequest: jest.fn(),
      shouldAccept: jest.fn(),
    };

    const backendConstructor = jest.fn<logic.IPluginBackend>(() => backend);

    const plugin = new OutboundRulesPlugin(0, backendConstructor);

    // Initial request. Has outbound-rules.

    plugin.onBeforeSendHeaders({
      url: "http://foo.com/bar",
      requestId: "0",
      tabId: 1,
      frameId: 0,
      parentFrameId: -1,
      originUrl: "http://foo.com/bar",
      method: "GET",
      type: "main_frame",
      timeStamp: 0,
    });

    plugin.onHeadersReceived({
      url: "http://foo.com/bar",
      requestId: "0",
      tabId: 1,
      frameId: 0,
      parentFrameId: -1,
      statusLine: "HTTP/1.1 200 OK",
      statusCode: 200,
      type: "main_frame",
      timeStamp: 0,
      responseHeaders: [
        {
          name: "outbound-rules",
          value: "Deny: ALL",
        },
      ],
    });

    expect(backend.initRequest).toHaveBeenCalledTimes(1);
    expect(backend.initRequest).toHaveBeenCalledWith(1, "http://foo.com/bar", "Deny: ALL");
    expect(backend.shouldAccept).toHaveBeenCalledTimes(0);

    // A reload. This one has no outbound-rules header anymore

    plugin.onBeforeSendHeaders({
      url: "http://foo.com/bar",
      requestId: "1",
      tabId: 1,
      frameId: 0,
      parentFrameId: -1,
      originUrl: "http://foo.com/bar",
      method: "GET",
      type: "main_frame",
      timeStamp: 0,
    });

    plugin.onHeadersReceived({
      url: "http://foo.com/bar",
      requestId: "1",
      tabId: 1,
      frameId: 0,
      parentFrameId: -1,
      statusLine: "HTTP/1.1 200 OK",
      statusCode: 200,
      type: "main_frame",
      timeStamp: 0,
      responseHeaders: [],
    });

    expect(backend.initRequest).toHaveBeenCalledTimes(2);
    expect(backend.initRequest).toHaveBeenCalledWith(1, "http://foo.com/bar", undefined);
    expect(backend.shouldAccept).toHaveBeenCalledTimes(0);
  });

});