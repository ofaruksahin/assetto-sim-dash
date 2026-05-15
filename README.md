# Assetto Sim Dash

Assetto Corsa için gerçek zamanlı telemetri panosu. Oyunun paylaşımlı belleğinden (shared memory) veri okuyarak SignalR üzerinden tarayıcıya canlı göstergeler sunar.

![.NET](https://img.shields.io/badge/.NET-9.0-purple)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Özellikler

- **Canlı göstergeler** — Hız, vites ve devir sayısı (SVG iğneli gösterge)
- **Vites ışıkları** — Optimum vites değiştirme noktası göstergesi
- **Lastik telemetrisi** — Her tekerlek için sıcaklık, basınç, kayma ve aşınma
- **Pedal pozisyonları** — Gaz, fren, debriyaj ve turbo baskısı
- **Drift paneli** — Kayma açısı, sapma hızı, G-kuvvetleri, direksiyon açısı, oversteer indeksi
- **Seans bilgisi** — Tur süreleri, sıralama, pit durumu, bayrak durumu
- **Araç & pist** — Araç modeli, pist adı, sürücü adı, yakıt ve hava durumu

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | ASP.NET Core 9.0, C# |
| Gerçek zamanlı iletişim | SignalR |
| Veri kaynağı | Assetto Corsa Shared Memory (Windows MMF) |
| Frontend | HTML5, CSS3, Vanilla JS, SVG |
| UI bileşenleri | Bootstrap 5, jQuery |

## Gereksinimler

- Windows 10/11
- [.NET 9.0 SDK veya Runtime](https://dotnet.microsoft.com/download/dotnet/9.0)
- Assetto Corsa (Steam)

## Kurulum & Çalıştırma

```bash
git clone https://github.com/ofaruksahin/assetto-sim-dash.git
cd assetto-sim-dash/AssettoCorsaWeb
dotnet run
```

Tarayıcıda `http://localhost:5000` adresini açın.

> Assetto Corsa açık ve aktif bir oturumdayken bağlantı otomatik kurulur. Oyun kapalıyken uygulama 2 saniyelik aralıklarla yeniden bağlanmayı dener.

## Mimari

```
Assetto Corsa (shared memory)
        │  50ms polling
        ▼
AcBroadcastService (arka plan servisi)
        │  SignalR push
        ▼
TelemetryHub  ──►  Tarayıcı (dashboard.js)
```

- `AcBroadcastService` — Her 50ms'de physics/graphics/static bloklarını okur, türetilmiş metrikleri hesaplar ve bağlı tüm istemcilere yayar.
- `TelemetryHub` — SignalR hub, `/telemetry` rotasında dinler.
- `dashboard.js` — SVG gauge'leri, lastik ısı haritasını ve drift grafiğini gerçek zamanlı günceller.

## Ekran Görüntüsü

> _Ekran görüntüsü eklemek için `docs/screenshot.png` yoluna görsel ekleyin._

## Lisans

MIT
