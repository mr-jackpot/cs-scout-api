/**
 * Returns true if requestOrigin matches any entry in allowedOrigins.
 * Entries starting with "*." are treated as wildcard suffix patterns,
 * e.g. "*.web.app" matches "project--channel.web.app".
 */
export const isOriginAllowed = (
  requestOrigin: string,
  allowedOrigins: string[]
): boolean =>
  allowedOrigins.some((pattern) => {
    if (pattern.startsWith("*.")) {
      return requestOrigin.endsWith(pattern.slice(1));
    }
    return requestOrigin === pattern;
  });
