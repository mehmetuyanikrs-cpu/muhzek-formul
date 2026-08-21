# muhzek-formul

[![CI](https://github.com/mehmetuyanikrs-cpu/muhzek-formul/actions/workflows/ci.yml/badge.svg)](https://github.com/mehmetuyanikrs-cpu/muhzek-formul/actions/workflows/ci.yml)
[![Lisans: MIT](https://img.shields.io/badge/lisans-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](package.json)
[![Bağımlılık](https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-yok-brightgreen.svg)](package.json)

**eval'siz güvenli formül çözücü.** Kullanıcıdan gelen matematiksel ifadeleri
`eval`/`new Function` kullanmadan, elle yazılmış bir çözümleyiciyle (recursive
descent) hesaplar. [MuhzekAI](https://muhzekai.com) Araç Marketi'nin üretimde
çalışan hesap motorudur — kullanıcıların "tarif et, aracın hazır" diyerek
oluşturduğu mühendislik araçlarındaki her formül bu motorla çözülür.

> **EN:** A safe formula evaluator for user-supplied expressions. No `eval`,
> no `new Function` — a hand-written recursive descent parser with a strict
> function whitelist, prototype-pollution-safe variable lookup
> (`Object.hasOwn`), and length/depth limits. Battle-tested in production at
> [muhzekai.com](https://muhzekai.com).

## Neden?

Kullanıcı girdisi olan formülleri `eval` ile çalıştırmak XSS/RCE davetiyesidir;
`Function` sandbox'ları da güvenilmez. Bu motor yalnızca şunları tanır:

- Sayılar, tanımlı değişkenler, `pi` ve `e` sabitleri
- Aritmetik: `+ - * / % ^` (üs sağdan bağlaşımlı)
- Karşılaştırma/mantık: `< <= > >= == != && || !` ve üçlü işleç `a ? b : c`
- Beyaz listedeki fonksiyonlar: `sqrt abs round floor ceil min max pow exp
  log log10 sin cos tan asin acos atan atan2`

Başka **hiçbir şey** yorumlanmaz. `constructor`, `toString` gibi prototip
zinciri adları değişken sayılmaz (`Object.hasOwn`). Formül uzunluğu (500) ve
iç içe geçme derinliği (40) sınırlıdır — DoS yüzeyi kapalıdır.

## Kullanım

```ts
import { formulHesapla, formulDenetle, FormulHatasi } from "muhzek-formul";

// Hesaplama — hata durumunda FormulHatasi fırlatır
formulHesapla("q * L^2 / 8", { q: 12, L: 6 });          // 54
formulHesapla("guc / (1.732 * V * cosfi)", { guc: 15000, V: 400, cosfi: 0.85 });
formulHesapla("x > 100 ? x * 0.9 : x", { x: 250 });      // 225

// Yalnız sözdizimi denetimi (kaydetmeden önce) — geçerliyse null
formulDenetle("sqrt(a^2 + b^2)", ["a", "b"]);            // null
formulDenetle("alert(1)", []);                           // "Bilinmeyen fonksiyon: alert"
```

Sonuç sonlu değilse (sıfıra bölme vb.) `FormulHatasi` fırlatılır — `NaN`
asla sessizce dönmez.

## Test

```bash
npm install && npm test
```

## Lisans

MIT — [muhzekai.com](https://muhzekai.com)'da canlı olarak çalışıyor.
