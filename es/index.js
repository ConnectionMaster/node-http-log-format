import http from 'http';
import httpHeaders from 'http-headers';
import { pick, omit } from 'lodash';

/**
 * Filters the given headers object picking the given whitelisted headers (if any) and removing
 * all blacklisted ones
 * @param  {Object.<string, string>} headers
 * @param  {string[]} [options.whitelistHeaders]
 * @param  {string[]} [options.blacklistHeaders]
 * @return {Object.<string, string>}
 */
function filterHeaders(headers, { whitelistHeaders, blacklistHeaders } = {}) {
  const whitelistedHeaders = whitelistHeaders ? pick(headers, whitelistHeaders) : headers;
  const blacklistedHeaders = omit(whitelistedHeaders, blacklistHeaders);
  return blacklistedHeaders;
}

/**
 * Formats a request with the Softonic HTTP log format
 * @param  {http.IncomingMessage|http.ClientRequest} request
 * @param  {Object} [options]
 * @param  {string[]} [options.whitelistHeaders] List of headers to include in the log
 * @param  {string[]} [options.blacklistHeaders] List of headers to remove from the log
 * @return {Object}
 */
export function formatRequest(request, { whitelistHeaders, blacklistHeaders } = {}) {
  // `httpVersion` is only available in incoming requests
  const { httpVersion, method } = request;

  // `timestamp` does not belong to the classes that the core Node.js http[s] module returns,
  // but we use it if it is defined
  const timestamp = request.timestamp;

  // `url` in IncomingMessage, `path` in ClientRequest
  const url = request.url || request.path;

  // `headers` in IncomingMessage, `_headers` in ClientRequest
  // eslint-disable-next-line no-underscore-dangle
  const receivedHeaders = request.headers || request._headers || {};
  const headers = filterHeaders(receivedHeaders, { whitelistHeaders, blacklistHeaders });

  const socket = request.socket || {};
  const { remoteAddress, remotePort, localAddress, localPort } = socket;

  return {
    timestamp,
    httpVersion,
    method,
    url,
    headers,
    remoteAddress,
    remotePort,
    localAddress,
    localPort,
  };
}

/**
 * Returns a string representation of a request
 *
 * @example
 * stringifyRequest(request);
 * //> 'GET example.com/path?foo=bar'
 *
 * @param  {http.IncomingMessage|http.ClientRequest} request
 * @param  {Object} [options]
 * @param  {string[]} [options.whitelistHeaders] List of headers to include in the log
 * @param  {string[]} [options.blacklistHeaders] List of headers to remove from the log
 * @return {Object}
 */
export function stringifyRequest(request) {
  const { method, url, headers = {} } = request;
  return `${method} ${headers.host}${url}`;
}

/**
 * Formats a response with the Softonic HTTP log format
 * @param  {http.IncomingMessage|http.ServerResponse} response
 * @param  {Object} [options]
 * @param  {string[]} [options.whitelistHeaders] List of headers to include in the log
 * @param  {string[]} [options.blacklistHeaders] List of headers to remove from the log
 * @return {Object}
 */
export function formatResponse(response, { whitelistHeaders, blacklistHeaders } = {}) {
  const statusCode = response.statusCode;

  // `headers` in IncomingMessage, parsed headers in ServerResponse
  const receivedHeaders = response.headers || httpHeaders(response, true) || {};
  const headers = filterHeaders(receivedHeaders, { whitelistHeaders, blacklistHeaders });

  // `timestamp` and `responseTime` do not belong to the classes that the core Node.js http[s]
  // module returns, but we use them if they are defined
  const { timestamp, responseTime } = response;

  return {
    timestamp,
    statusCode,
    headers,
    responseTime,
  };
}

/**
 * Returns a string representation of a response
 *
 * @example
 * stringifyResponse(response);
 * //> '201 (Created)'
 *
 * @param  {http.IncomingMessage|http.ServerResponse} response
 * @param  {Object} [options]
 * @param  {string[]} [options.whitelistHeaders] List of headers to include in the log
 * @param  {string[]} [options.blacklistHeaders] List of headers to remove from the log
 * @return {Object}
 */
export function stringifyResponse(response) {
  const statusCode = response.statusCode;
  const statusMsg = http.STATUS_CODES[statusCode];
  return `${statusCode} (${statusMsg})`;
}
