/* Güvenli formül çözücü — Araç Marketi'nin hesap motoru.
   eval/Function ASLA kullanılmaz: formül burada elle yazılmış bir
   çözümleyiciyle (recursive descent) işlenir. Yalnızca sayılar, tanımlı
   değişkenler, aritmetik/karşılaştırma/mantık işleçleri ve beyaz listedeki
   matematik fonksiyonları çalışır. Başka hiçbir şey yorumlanmaz. */

const MAX_FORMUL_UZUNLUK = 500;
const MAX_DERINLIK = 40;

const SABITLER: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const FONKSIYONLAR: Record<string, { enAz: number; enCok: number; uygula: (args: number[]) => number }> = {
  sqrt: { enAz: 1, enCok: 1, uygula: ([x]) => Math.sqrt(x) },
  abs: { enAz: 1, enCok: 1, uygula: ([x]) => Math.abs(x) },
  round: { enAz: 1, enCok: 2, uygula: ([x, n]) => yuvarla(x, n ?? 0) },
  floor: { enAz: 1, enCok: 1, uygula: ([x]) => Math.floor(x) },
  ceil: { enAz: 1, enCok: 1, uygula: ([x]) => Math.ceil(x) },
  min: { enAz: 1, enCok: 8, uygula: (a) => Math.min(...a) },
  max: { enAz: 1, enCok: 8, uygula: (a) => Math.max(...a) },
  pow: { enAz: 2, enCok: 2, uygula: ([x, y]) => Math.pow(x, y) },
  exp: { enAz: 1, enCok: 1, uygula: ([x]) => Math.exp(x) },
  log: { enAz: 1, enCok: 1, uygula: ([x]) => Math.log(x) },
  log10: { enAz: 1, enCok: 1, uygula: ([x]) => Math.log10(x) },
  sin: { enAz: 1, enCok: 1, uygula: ([x]) => Math.sin(x) },
  cos: { enAz: 1, enCok: 1, uygula: ([x]) => Math.cos(x) },
  tan: { enAz: 1, enCok: 1, uygula: ([x]) => Math.tan(x) },
  asin: { enAz: 1, enCok: 1, uygula: ([x]) => Math.asin(x) },
  acos: { enAz: 1, enCok: 1, uygula: ([x]) => Math.acos(x) },
  atan: { enAz: 1, enCok: 1, uygula: ([x]) => Math.atan(x) },
  atan2: { enAz: 2, enCok: 2, uygula: ([y, x]) => Math.atan2(y, x) },
};

function yuvarla(x: number, n: number): number {
  const k = Math.pow(10, Math.max(0, Math.min(10, Math.trunc(n))));
  return Math.round(x * k) / k;
}

export class FormulHatasi extends Error {}

/* ---------- Sözcükleyici ---------- */

type Simge =
  | { tur: "sayi"; deger: number }
  | { tur: "ad"; deger: string }
  | { tur: "islec"; deger: string }
  | { tur: "parantez"; deger: "(" | ")" }
  | { tur: "virgul" };

const ISLECLER = ["<=", ">=", "==", "!=", "&&", "||", "+", "-", "*", "/", "%", "^", "<", ">", "!", "?", ":"];

function sozcukle(formul: string): Simge[] {
  const simgeler: Simge[] = [];
  let i = 0;
  while (i < formul.length) {
    const c = formul[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (c >= "0" && c <= "9") {
      let j = i;
      while (j < formul.length && /[0-9.]/.test(formul[j])) j++;
      const ham = formul.slice(i, j);
      const sayi = Number(ham);
      if (!Number.isFinite(sayi)) throw new FormulHatasi(`Geçersiz sayı: ${ham}`);
      simgeler.push({ tur: "sayi", deger: sayi });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < formul.length && /[a-zA-Z0-9_]/.test(formul[j])) j++;
      simgeler.push({ tur: "ad", deger: formul.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "(" || c === ")") {
      simgeler.push({ tur: "parantez", deger: c });
      i++;
      continue;
    }
    if (c === ",") {
      simgeler.push({ tur: "virgul" });
      i++;
      continue;
    }
    const iki = formul.slice(i, i + 2);
    if (ISLECLER.includes(iki)) {
      simgeler.push({ tur: "islec", deger: iki });
      i += 2;
      continue;
    }
    if (ISLECLER.includes(c)) {
      simgeler.push({ tur: "islec", deger: c });
      i++;
      continue;
    }
    throw new FormulHatasi(`Tanınmayan karakter: "${c}"`);
  }
  return simgeler;
}

/* ---------- Çözümleyici + hesaplayıcı (tek geçiş) ---------- */

class Cozumleyici {
  private k = 0;
  constructor(
    private simgeler: Simge[],
    private degiskenler: Record<string, number>
  ) {}

  coz(): number {
    const sonuc = this.ternary(0);
    if (this.k < this.simgeler.length) throw new FormulHatasi("Formülün sonunda fazlalık var.");
    return sonuc;
  }

  private bak(): Simge | undefined {
    return this.simgeler[this.k];
  }
  private al(): Simge {
    const s = this.simgeler[this.k++];
    if (!s) throw new FormulHatasi("Formül beklenmedik şekilde bitti.");
    return s;
  }
  private islecMi(deger: string): boolean {
    const s = this.bak();
    return !!s && s.tur === "islec" && s.deger === deger;
  }

  private ternary(derinlik: number): number {
    this.derinlikKontrol(derinlik);
    const kosul = this.veya(derinlik + 1);
    if (this.islecMi("?")) {
      this.al();
      const evet = this.ternary(derinlik + 1);
      if (!this.islecMi(":")) throw new FormulHatasi("Üçlü işleçte ':' eksik.");
      this.al();
      const hayir = this.ternary(derinlik + 1);
      return kosul !== 0 ? evet : hayir;
    }
    return kosul;
  }

  private veya(d: number): number {
    let sol = this.ve(d + 1);
    while (this.islecMi("||")) {
      this.al();
      const sag = this.ve(d + 1);
      sol = sol !== 0 || sag !== 0 ? 1 : 0;
    }
    return sol;
  }

  private ve(d: number): number {
    let sol = this.esitlik(d + 1);
    while (this.islecMi("&&")) {
      this.al();
      const sag = this.esitlik(d + 1);
      sol = sol !== 0 && sag !== 0 ? 1 : 0;
    }
    return sol;
  }

  private esitlik(d: number): number {
    let sol = this.kiyas(d + 1);
    for (;;) {
      if (this.islecMi("==")) {
        this.al();
        sol = sol === this.kiyas(d + 1) ? 1 : 0;
      } else if (this.islecMi("!=")) {
        this.al();
        sol = sol !== this.kiyas(d + 1) ? 1 : 0;
      } else return sol;
    }
  }

  private kiyas(d: number): number {
    let sol = this.toplama(d + 1);
    for (;;) {
      if (this.islecMi("<=")) {
        this.al();
        sol = sol <= this.toplama(d + 1) ? 1 : 0;
      } else if (this.islecMi(">=")) {
        this.al();
        sol = sol >= this.toplama(d + 1) ? 1 : 0;
      } else if (this.islecMi("<")) {
        this.al();
        sol = sol < this.toplama(d + 1) ? 1 : 0;
      } else if (this.islecMi(">")) {
        this.al();
        sol = sol > this.toplama(d + 1) ? 1 : 0;
      } else return sol;
    }
  }

  private toplama(d: number): number {
    this.derinlikKontrol(d);
    let sol = this.carpma(d + 1);
    for (;;) {
      if (this.islecMi("+")) {
        this.al();
        sol = sol + this.carpma(d + 1);
      } else if (this.islecMi("-")) {
        this.al();
        sol = sol - this.carpma(d + 1);
      } else return sol;
    }
  }

  private carpma(d: number): number {
    let sol = this.us(d + 1);
    for (;;) {
      if (this.islecMi("*")) {
        this.al();
        sol = sol * this.us(d + 1);
      } else if (this.islecMi("/")) {
        this.al();
        sol = sol / this.us(d + 1);
      } else if (this.islecMi("%")) {
        this.al();
        sol = sol % this.us(d + 1);
      } else return sol;
    }
  }

  private us(d: number): number {
    const taban = this.birincil(d + 1);
    if (this.islecMi("^")) {
      this.al();
      /* Sağdan bağlaşımlı: 2^3^2 = 2^(3^2) */
      return Math.pow(taban, this.us(d + 1));
    }
    return taban;
  }

  private birincil(d: number): number {
    this.derinlikKontrol(d);
    const s = this.al();

    if (s.tur === "sayi") return s.deger;

    if (s.tur === "islec" && s.deger === "-") return -this.birincil(d + 1);
    if (s.tur === "islec" && s.deger === "!") return this.birincil(d + 1) === 0 ? 1 : 0;

    if (s.tur === "parantez" && s.deger === "(") {
      const ic = this.ternary(d + 1);
      const kapa = this.al();
      if (kapa.tur !== "parantez" || kapa.deger !== ")") throw new FormulHatasi("Parantez kapanmadı.");
      return ic;
    }

    if (s.tur === "ad") {
      /* Fonksiyon çağrısı mı? (Object.hasOwn: prototip zinciri — constructor,
         toString vb. — asla fonksiyon/değişken sayılmaz) */
      const bakilan = this.bak();
      if (bakilan && bakilan.tur === "parantez" && bakilan.deger === "(") {
        if (!Object.hasOwn(FONKSIYONLAR, s.deger))
          throw new FormulHatasi(`Bilinmeyen fonksiyon: ${s.deger}`);
        const fn = FONKSIYONLAR[s.deger];
        this.al(); // (
        const args: number[] = [];
        if (!(this.bak()?.tur === "parantez" && (this.bak() as { deger: string }).deger === ")")) {
          args.push(this.ternary(d + 1));
          while (this.bak()?.tur === "virgul") {
            this.al();
            args.push(this.ternary(d + 1));
          }
        }
        const kapa = this.al();
        if (kapa.tur !== "parantez" || kapa.deger !== ")") throw new FormulHatasi("Fonksiyon parantezi kapanmadı.");
        if (args.length < fn.enAz || args.length > fn.enCok)
          throw new FormulHatasi(`${s.deger} fonksiyonu ${fn.enAz}-${fn.enCok} argüman alır.`);
        return fn.uygula(args);
      }
      /* Sabit ya da değişken */
      if (Object.hasOwn(SABITLER, s.deger)) return SABITLER[s.deger];
      if (Object.hasOwn(this.degiskenler, s.deger)) {
        const v = this.degiskenler[s.deger];
        if (typeof v !== "number") throw new FormulHatasi(`Tanımsız değişken: ${s.deger}`);
        return v;
      }
      throw new FormulHatasi(`Tanımsız değişken: ${s.deger}`);
    }

    throw new FormulHatasi("Beklenmeyen ifade.");
  }

  private derinlikKontrol(d: number) {
    if (d > MAX_DERINLIK) throw new FormulHatasi("Formül fazla iç içe.");
  }
}

/* Formülü verilen değişkenlerle hesaplar. Hata durumunda FormulHatasi fırlatır. */
export function formulHesapla(formul: string, degiskenler: Record<string, number>): number {
  if (typeof formul !== "string" || formul.trim().length === 0)
    throw new FormulHatasi("Formül boş.");
  if (formul.length > MAX_FORMUL_UZUNLUK)
    throw new FormulHatasi("Formül çok uzun.");
  const sonuc = new Cozumleyici(sozcukle(formul), degiskenler).coz();
  if (!Number.isFinite(sonuc)) throw new FormulHatasi("Sonuç tanımsız (sıfıra bölme olabilir).");
  return sonuc;
}

/* Yalnızca sözdizimi denetimi — değişkenlere 0 atayıp dener.
   Geçerliyse null, değilse hata mesajı döner. */
export function formulDenetle(formul: string, degiskenAdlari: string[]): string | null {
  const sifirlar: Record<string, number> = {};
  for (const ad of degiskenAdlari) sifirlar[ad] = 1; // 1: bölme/log gibi işlemler patlamasın
  try {
    const sonuc = new Cozumleyici(sozcukle(formul), sifirlar).coz();
    if (!Number.isFinite(sonuc)) return "Formül geçerli bir sayı üretmiyor.";
    return null;
  } catch (e) {
    return e instanceof FormulHatasi ? e.message : "Formül çözümlenemedi.";
  }
}
