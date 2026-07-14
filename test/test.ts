import assert from "node:assert/strict";
import { formulHesapla, formulDenetle, FormulHatasi } from "../src/hesap.ts";

let gecen = 0;
function dogrula(ad: string, fn: () => void) {
  fn();
  gecen++;
  console.log(`  GEÇTİ: ${ad}`);
}

dogrula("işlem önceliği", () => assert.equal(formulHesapla("2 + 2 * 3", {}), 8));
dogrula("parantez", () => assert.equal(formulHesapla("(2 + 2) * 3", {}), 12));
dogrula("üs sağdan bağlaşımlı", () => assert.equal(formulHesapla("2 ^ 3 ^ 2", {}), 512));
dogrula("değişkenler", () => assert.equal(formulHesapla("q * L ^ 2 / 8", { q: 12, L: 6 }), 54));
dogrula("üçlü işleç", () => assert.equal(formulHesapla("x > 100 ? x * 0.9 : x", { x: 250 }), 225));
dogrula("mantık", () => assert.equal(formulHesapla("1 && 0 || 1", {}), 1));
dogrula("karşılaştırma zinciri", () => assert.equal(formulHesapla("5 >= 5", {}), 1));
dogrula("fonksiyonlar", () => {
  assert.equal(formulHesapla("sqrt(16)", {}), 4);
  assert.equal(formulHesapla("min(3, 1, 2)", {}), 1);
  assert.equal(formulHesapla("round(3.14159, 2)", {}), 3.14);
  assert.ok(Math.abs(formulHesapla("atan2(1, 1)", {}) - Math.PI / 4) < 1e-12);
});
dogrula("sabitler", () => assert.ok(Math.abs(formulHesapla("2 * pi", {}) - 2 * Math.PI) < 1e-12));
dogrula("negatif işaret", () => assert.equal(formulHesapla("-x + 10", { x: 3 }), 7));

dogrula("sıfıra bölme fırlatır", () =>
  assert.throws(() => formulHesapla("1 / 0", {}), FormulHatasi));
dogrula("bilinmeyen fonksiyon fırlatır", () =>
  assert.throws(() => formulHesapla("alert(1)", {}), FormulHatasi));
dogrula("prototip zinciri değişken sayılmaz", () => {
  assert.throws(() => formulHesapla("constructor", {}), FormulHatasi);
  assert.throws(() => formulHesapla("toString(1)", {}), FormulHatasi);
});
dogrula("tanımsız değişken fırlatır", () =>
  assert.throws(() => formulHesapla("bilinmeyen + 1", {}), FormulHatasi));
dogrula("tanınmayan karakter fırlatır", () =>
  assert.throws(() => formulHesapla("1 @ 2", {}), FormulHatasi));
dogrula("uzunluk sınırı", () =>
  assert.throws(() => formulHesapla("1+".repeat(300) + "1", {}), FormulHatasi));
dogrula("derinlik sınırı", () =>
  assert.throws(() => formulHesapla("(".repeat(60) + "1" + ")".repeat(60), {}), FormulHatasi));

dogrula("formulDenetle geçerli → null", () =>
  assert.equal(formulDenetle("sqrt(a^2 + b^2)", ["a", "b"]), null));
dogrula("formulDenetle geçersiz → mesaj", () =>
  assert.ok(typeof formulDenetle("alert(1)", []) === "string"));

console.log(`\n${gecen} test GEÇTİ`);
