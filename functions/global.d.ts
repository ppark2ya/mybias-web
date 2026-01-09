
// Override the default Body.json() return type from unknown to any
// to simplify testing and avoid "body is of type unknown" errors.
declare global {
  interface Body {
    json(): Promise<any>;
  }
}

export {};
