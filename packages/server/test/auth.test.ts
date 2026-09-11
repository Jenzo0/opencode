import { describe, expect, test } from "bun:test"
import { Option, Redacted } from "effect"
import { ServerAuth } from "../src/auth"

const withPassword = (password: string): ServerAuth.Info => ({ username: "opencode", password: Option.some(password) })
const noPassword: ServerAuth.Info = { username: "opencode", password: Option.none() }
const creds = (username: string, password: string): ServerAuth.DecodedCredentials => ({
  username,
  password: Redacted.make(password),
})

describe("ServerAuth.required", () => {
  test("false without a password", () => {
    expect(ServerAuth.required(noPassword)).toBe(false)
  })
  test("false with an empty password", () => {
    expect(ServerAuth.required(withPassword(""))).toBe(false)
  })
  test("true with a password", () => {
    expect(ServerAuth.required(withPassword("s3cret"))).toBe(true)
  })
})

describe("ServerAuth.authorized", () => {
  test("accepts exact username+password", () => {
    expect(ServerAuth.authorized(creds("opencode", "s3cret"), withPassword("s3cret"))).toBe(true)
  })
  test("rejects wrong password", () => {
    expect(ServerAuth.authorized(creds("opencode", "nope"), withPassword("s3cret"))).toBe(false)
  })
  test("rejects wrong username", () => {
    expect(ServerAuth.authorized(creds("admin", "s3cret"), withPassword("s3cret"))).toBe(false)
  })
  test("rejects everything when no password is configured", () => {
    expect(ServerAuth.authorized(creds("opencode", "s3cret"), noPassword)).toBe(false)
    expect(ServerAuth.authorized(creds("opencode", ""), noPassword)).toBe(false)
  })
})

describe("ServerAuth.header", () => {
  const OLD_ENV = { ...process.env }

  test("builds a Basic header from explicit credentials", () => {
    const expected = `Basic ${Buffer.from("opencode:s3cret").toString("base64")}`
    expect(ServerAuth.header({ username: "opencode", password: "s3cret" })).toBe(expected)
  })
  test("returns undefined without any password source", () => {
    delete process.env.OPENCODE_SERVER_PASSWORD
    try {
      expect(ServerAuth.header()).toBeUndefined()
      expect(ServerAuth.headers()).toBeUndefined()
    } finally {
      process.env = { ...OLD_ENV }
    }
  })
  test("headers() wraps header() in an Authorization object", () => {
    const expected = `Basic ${Buffer.from("opencode:s3cret").toString("base64")}`
    expect(ServerAuth.headers({ username: "opencode", password: "s3cret" })).toEqual({
      Authorization: expected,
    })
  })
})
