import assert from "node:assert/strict";
import test from "node:test";
import {
  AVATAR_MAX_BYTES,
  avatarUrlFor,
  sniffAvatarType,
  validateAvatarBytes,
} from "../src/lib/avatar-validation.ts";

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50,
]);
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const html = new TextEncoder().encode("<html><body>hi</body></html>");

test("sniffAvatarType recognises JPEG, PNG and WebP by their bytes", () => {
  assert.equal(sniffAvatarType(jpeg), "image/jpeg");
  assert.equal(sniffAvatarType(png), "image/png");
  assert.equal(sniffAvatarType(webp), "image/webp");
});

test("sniffAvatarType rejects SVG, HTML, GIF and empty input", () => {
  assert.equal(sniffAvatarType(svg), null);
  assert.equal(sniffAvatarType(html), null);
  assert.equal(sniffAvatarType(new TextEncoder().encode("GIF89a....")), null);
  assert.equal(sniffAvatarType(new Uint8Array()), null);
});

test("validateAvatarBytes accepts a matching declared type", () => {
  assert.equal(validateAvatarBytes(jpeg, "image/jpeg"), "image/jpeg");
  assert.equal(validateAvatarBytes(png, "image/png"), "image/png");
});

test("validateAvatarBytes rejects a declared type that lies about the bytes", () => {
  assert.throws(() => validateAvatarBytes(svg, "image/png"), /Upload a JPEG, PNG, or WebP/);
  assert.throws(() => validateAvatarBytes(png, "image/jpeg"), /do not match/);
});

test("validateAvatarBytes rejects empty and oversized files", () => {
  assert.throws(() => validateAvatarBytes(new Uint8Array(), "image/png"), /empty/);
  const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
  big.set(jpeg);
  assert.throws(() => validateAvatarBytes(big, "image/jpeg"), /2 MB or smaller/);
  const exact = new Uint8Array(AVATAR_MAX_BYTES);
  exact.set(jpeg);
  assert.equal(validateAvatarBytes(exact, "image/jpeg"), "image/jpeg");
});

test("avatarUrlFor builds a same-origin versioned path", () => {
  assert.equal(avatarUrlFor("abc123", 42), "/api/profile/avatar/abc123?v=42");
  assert.ok(avatarUrlFor("a/b", 1).startsWith("/api/profile/avatar/a%2Fb"));
});
