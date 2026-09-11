import { describe, expect, test } from "bun:test"
import { isAllowedCorsOrigin, isAllowedRequestOrigin } from "../src/cors"

describe("isAllowedCorsOrigin", () => {
  test("allows missing origin (same-origin / curl)", () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true)
  })
  test("allows local dev servers", () => {
    expect(isAllowedCorsOrigin("http://localhost:3000")).toBe(true)
    expect(isAllowedCorsOrigin("http://127.0.0.1:8080")).toBe(true)
  })
  test("allows desktop shells", () => {
    expect(isAllowedCorsOrigin("oc://renderer")).toBe(true)
    expect(isAllowedCorsOrigin("tauri://localhost")).toBe(true)
    expect(isAllowedCorsOrigin("http://tauri.localhost")).toBe(true)
    expect(isAllowedCorsOrigin("https://tauri.localhost")).toBe(true)
  })
  test("allows opencode.ai and subdomains", () => {
    expect(isAllowedCorsOrigin("https://opencode.ai")).toBe(true)
    expect(isAllowedCorsOrigin("https://app.opencode.ai")).toBe(true)
  })
  test("rejects lookalike domains", () => {
    expect(isAllowedCorsOrigin("https://opencode.ai.evil.com")).toBe(false)
    expect(isAllowedCorsOrigin("https://evil-opencode.ai")).toBe(false)
    expect(isAllowedCorsOrigin("https://opencode.ai:evil.com")).toBe(false)
    expect(isAllowedCorsOrigin("http://opencode.ai")).toBe(false)
  })
  test("rejects random origins without an allowlist", () => {
    expect(isAllowedCorsOrigin("https://example.com")).toBe(false)
  })
  test("honors the custom allowlist", () => {
    const opts = { cors: ["https://my-ide.example.com"] }
    expect(isAllowedCorsOrigin("https://my-ide.example.com", opts)).toBe(true)
    expect(isAllowedCorsOrigin("https://other.example.com", opts)).toBe(false)
  })
})

describe("isAllowedRequestOrigin", () => {
  test("allows missing origin", () => {
    expect(isAllowedRequestOrigin(undefined, "example.com")).toBe(true)
  })
  test("allows same host", () => {
    expect(isAllowedRequestOrigin("http://example.com:3000", "example.com:3000")).toBe(true)
  })
  test("rejects cross host without allowlist", () => {
    expect(isAllowedRequestOrigin("https://evil.com", "example.com")).toBe(false)
  })
})
