# clash-verge-rev Customization Checklist

> Fork: `https://github.com/<your-username>/clash-verge-rev`  
> Local: `/Users/2infinity/Downloads/workspace/clash-verge-rev`

---

## 1. ✅ Product Identity (3 files)

| # | File | Change | Status |
|---|---|---|---|
| 1.1 | `src-tauri/tauri.conf.json` | `productName`: `"BestVPN"` | ✅ |
| 1.2 | `src-tauri/tauri.conf.json` | `identifier`: `"com.getmybestvpn.desktop"` | ✅ |
| 1.3 | `src-tauri/tauri.conf.json` | `bundle.publisher`, `shortDescription`, `longDescription`, `copyright` | ✅ |
| 1.4 | `package.json` | `"name"`: `"bestvpn-desktop"` | ✅ |

---

## 2. ❌ Icons (1 directory)

Replace all files in `src-tauri/icons/` with BestVPN-branded versions:

| File | Size | Usage |
|---|---|---|
| `32x32.png` | 32×32 | Windows tray |
| `128x128.png` | 128×128 | Windows installer |
| `128x128@2x.png` | 256×256 | macOS Retina |
| `icon.icns` | multi-size | macOS app icon |
| `icon.ico` | multi-size | Windows app icon |
| `liquid-glass.icon` | AI-generated | macOS Liquid Glass style |

Generate from a 1024×1024 PNG using:
```bash
cd src-tauri/icons
# macOS icns
pnpm tauri icon bestvpn-logo.png
```

---

## 3. ❌ App Assets (1 directory)

| # | File | Change | Status |
|---|---|---|---|
| 3.1 | `src/assets/` | Replace any clash-verge branded images | ❌ |

---

## 4. ✅ Updater (1 file)

| # | File | Change | Status |
|---|---|---|---|
| 4.1 | `src-tauri/tauri.conf.json` | Removed `plugins.updater` (points to clash-verge-rev's servers) | ✅ |

When ready to set up auto-update:
- Generate a new keypair: `pnpm tauri signer generate -- -w ~/.bestvpn-updater-key`
- Add the pubkey back to `plugins.updater.pubkey`
- Host your own update JSON at `https://getmybestvpn.com/updates.json`

---

## 5. ✅ Deep Link (1 file)

| # | File | Change | Status |
|---|---|---|---|
| 5.1 | `src-tauri/tauri.conf.json` | Added `"bestvpn"` scheme alongside `"clash"`, `"clash-verge"` | ✅ |

Your portal generates:  
`clash://install-config?url=https://<user_key>:x@getmybestvpn.com/api/v1/sub/clash&name=BestVPN`

---

## 6. ❌ Locale / UI Text (12 locale directories)

Search and replace user-facing brand references. The app name in the UI comes from `tauri.conf.json`'s `productName`, so most references are already handled.

| # | Location | What to check | Status |
|---|---|---|---|
| 6.1 | `src/locales/en/` | Verify no "Clash Verge" strings remain | ❌ |
| 6.2 | `src/locales/zh/` | Same for Chinese | ❌ |
| 6.3 | `src/locales/{ar,de,es,fa,id,jp,ko,ru,tr,tt,zhtw}/` | Same for other locales | ❌ |
| 6.4 | `src-tauri/` Rust source | Any hardcoded "Clash Verge" in Rust strings (unlikely — uses tauri.conf.json) | ❌ |

---

## 7. ❌ Sidecar Binary (mihomo)

clash-verge-rev ships `verge-mihomo` as an external binary. You may want to:

| # | Change | Notes |
|---|---|---|
| 7.1 | Use stock mihomo instead of verge-mihomo | Or keep verge-mihomo (it's mihomo with some patches) |
| 7.2 | Bundle mihomo-alpha too | `src-tauri/tauri.conf.json` → `bundle.externalBin` |

Status: no change needed for now — verge-mihomo is compatible.

---

## 8. ❌ Updater Signing Keys

When ready to distribute:

| # | Action |
|---|---|
| 8.1 | Generate new signing keys for the Tauri updater |
| 8.2 | Set up update JSON endpoint on your server |
| 8.3 | macOS notarization (Apple Developer account required) |
| 8.4 | Windows code signing certificate |

---

## 9. ❌ CI/CD (GitHub Actions)

clash-verge-rev has existing `.github/workflows/`. Adapt for your fork:

| # | Action |
|---|---|
| 9.1 | Update bundle identifiers in CI scripts |
| 9.2 | Add your code signing secrets to GitHub Secrets |
| 9.3 | Update release upload to your own repo/releases |
| 9.4 | Point updater endpoints to your server (after #4) |

---

## 10. 🔧 Build System

| # | Action | Status |
|---|---|---|
| 10.1 | `pnpm install` | ✅ |
| 10.2 | `pnpm web:build` (frontend) | ✅ |
| 10.3 | `cargo build --release` (Rust backend) | 🔧 In progress |
| 10.4 | `pnpm tauri build` (full bundle) | 🔧 Pending #10.3 |
| 10.5 | macOS: notarize + staple | ❌ Needs Apple Developer account |
| 10.6 | Windows: cross-compile or Windows VM | ❌ |
| 10.7 | Linux: Docker or native | ❌ |

---

## Summary

| Category | Items | Done |
|---|---|---|
| Product identity | 4 changes | 4 ✅ |
| Icons | 7 files to replace | 0 ❌ |
| Assets | 1 directory | 0 ❌ |
| Updater | Remove + later re-add | 1 ✅ (removed) |
| Deep link | Add scheme | 1 ✅ |
| Locale text | 12 directories to audit | 0 ❌ |
| Sidecar binary | Review mihomo | N/A |
| Signing keys | Generate new | 0 ❌ |
| CI/CD | Adapt workflows | 0 ❌ |
| Build | Compile + bundle | 🔧 In progress |

**Total: 6 done, ~15 remaining (mostly cosmetic/icons/build infra)**
