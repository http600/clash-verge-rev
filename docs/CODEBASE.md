# BestVPN — Codebase Guide

BestVPN is a fork of **Clash Verge Rev**, a GUI for the [mihomo](https://github.com/MetaCubeX/mihomo)
proxy core. It is a **Tauri v2** desktop application: a **React (Vite/TypeScript)**
frontend plus a **Rust** backend, with several shared Rust workspace crates.

This document walks through every directory and file so you can find your way around.

---

## 1. Architecture at a glance

```
┌──────────────────────────────┐         ┌─────────────────────────────────┐
│  src/  (React + TypeScript)  │ invoke() │  src-tauri/src/  (Rust)        │
│  - pages, components, hooks  │ ───────▶ │  - cmd/*     Tauri IPC commands │
│  - services (cmds.ts)        │  events  │  - config/*  YAML config layer  │
│  - utils, providers          │ ◀─────── │  - core/*     service/core mgmt │
└──────────────────────────────┘         │  - feat/*, enhance/*            │
                                         └───────────────┬─────────────────┘
                                                          │
                                    crates/  (shared Rust workspace crates)
```

- **Frontend** talks to the backend exclusively through typed wrappers in
  `src/services/cmds.ts` (Tauri `invoke`) and `src/services/events.ts` (Tauri events).
- **Backend** exposes commands in `src-tauri/src/cmd/*` (registered in `src-tauri/src/lib.rs`).
- **Configuration** (`verge.yaml`, `profiles.yaml`, `clash.yaml`, `runtime.yaml`) is managed
  by `src-tauri/src/config/*`.
- The **mihomo core** and the privileged `clash-verge-service` daemon are external binaries
  downloaded by `scripts/prebuild.mjs` during build.

---

## 2. Top-level files

| File | Purpose |
| --- | --- |
| `package.json` | pnpm manifest: scripts (`dev`, `build`, `build:fast`, `typecheck`, `lint`, …) and JS dependencies. |
| `pnpm-workspace.yaml` | pnpm workspace definition. |
| `pnpm-lock.yaml` | Locked dependency tree. |
| `Cargo.toml` | Rust workspace manifest; lists the app crate and `crates/*`. |
| `Cargo.lock` | Locked Rust dependency versions. |
| `rust-toolchain.toml` | Pinned Rust toolchain version. |
| `rustfmt.toml` | Rust formatting options. |
| `Makefile.toml` | cargo-make tasks (pre-commit hooks, rustfmt, clippy, frontend format). |
| `tsconfig.json` | TypeScript compiler configuration. |
| `vite.config.mts` | Vite dev/build configuration (aliases `@/` → `src/`). |
| `vitest.config.mts` | Vitest test runner configuration. |
| `eslint.config.ts` | ESLint configuration. |
| `biome.json` | Biome formatter configuration. |
| `knip.json` | `knip` configuration (unused code detection). |
| `deny.toml` | `cargo-deny` configuration (license/advisory checks). |
| `renovate.json` | Renovate dependency update bot config. |
| `Changelog.md` | Human changelog. |
| `template/Changelog.md` | Changelog template used by release tooling. |
| `README.md` / `docs/README_*.md` | Project readme and translations. |
| `CONTRIBUTING.md` | Contribution guidelines. |
| `CUSTOMIZATION.md` | Theming/customization guide. |
| `LICENSE` | License. |

---

## 3. Frontend — `src/`

### Entry & pages (`src/pages/`, `src/main.tsx`)

| File | Purpose |
| --- | --- |
| `src/main.tsx` | React entry point. Boots providers, initializes i18n/theme, renders the router. |
| `_layout.tsx` | Main app shell: sidebar (`the-menu`), logo, traffic widget, titlebar, content `<Outlet/>`. Filters nav items in **simple mode**. |
| `_navigation.tsx` | Builds the sidebar `navItems` (icon + page component per route). |
| `_navigation-meta.ts` | Route → i18n label mapping for nav items. |
| `_routers.tsx` | `react-router` router: one child route per nav item. |
| `_theme.tsx` | Theme provider/creation helpers. |
| `home.tsx` | Home page (profile card, proxy/TUN card, traffic, info cards). |
| `proxies.tsx` | Proxies page (proxy groups + nodes). |
| `profiles.tsx` | Profiles page (import/manage subscriptions, drag reorder, batch mode). |
| `connections.tsx` | Live connections page. |
| `rules.tsx` | Rules page. |
| `logs.tsx` | Runtime logs page. |
| `unlock.tsx` | Media-unlock (streaming region) check page. |
| `settings.tsx` | Settings page wrapper. |

### Components (`src/components/`)

**`base/`** — reusable UI primitives:
| File | Purpose |
| --- | --- |
| `base-dialog.tsx` | Modal dialog wrapper. |
| `base-empty.tsx` | Empty-state placeholder. |
| `base-error-boundary.tsx` | React error boundary. |
| `base-fieldset.tsx` | Settings field group. |
| `base-loading.tsx` / `base-loading-overlay.tsx` | Spinner / full-screen loading overlay. |
| `base-page.tsx` | Standard page layout (title + content). |
| `base-search-box.tsx` | Search input with debounce. |
| `base-split-chip-editor.tsx` | Chip/array editor (e.g. proxy bypass). |
| `base-styled-select.tsx` / `base-styled-text-field.tsx` | Styled MUI inputs. |
| `base-switch.tsx` | Toggle switch with guard callback. |
| `base-tooltip-icon.tsx` | Icon with tooltip. |
| `monaco-editor.tsx` | Monaco code editor wrapper. |
| `sticky-virtual-list.tsx` / `virtual-list.tsx` | Virtualized lists for large tables. |
| `index.ts` | Barrel export. |

**`connection/`** — connections table: column manager, detail rows, row item/view, relative time, and the table itself.

**`home/`** — Home page cards:
| File | Purpose |
| --- | --- |
| `home-profile-card.tsx` | Profile selector card (the "PROFILES" block). |
| `proxy-tun-card.tsx` | System proxy / TUN mode toggles card. |
| `current-proxy-card.tsx` | Current proxy mode/group card. |
| `clash-info-card.tsx` | Core/version info card. |
| `clash-mode-card.tsx` | Clash mode (rule/global/direct) card. |
| `system-info-card.tsx` | System info + service install actions. |
| `ip-info-card.tsx` | Public IP info. |
| `test-card.tsx` | Delay test card. |
| `enhanced-card.tsx` / `enhanced-traffic-stats.tsx` / `enhanced-canvas-traffic-graph.tsx` | Enhanced traffic stats. |

**`layout/`** — app shell pieces:
| File | Purpose |
| --- | --- |
| `layout-item.tsx` | A single sidebar nav item. |
| `layout-traffic.tsx` | Sidebar traffic widget. |
| `traffic-graph.tsx` | Traffic graph drawing. |
| `notice-manager.tsx` | Toast/notice display. |
| `service-migration-dialog.tsx` | Service install/repair decision dialog. |
| `update-button.tsx` | In-app update button. |
| `window-controller.tsx` | Custom window controls (min/max/close, resize handles). |
| `scroll-top-button.tsx` | Scroll-to-top button. |

**`log/`** — `log-item.tsx`: single log line renderer.

**`profile/`** — profile editing/import:
| File | Purpose |
| --- | --- |
| `profile-item.tsx` | A profile row; right-click context menu (hidden in simple mode). |
| `sortable-profile-item.tsx` | Drag-and-drop wrapper around `ProfileItem`. |
| `profile-box.tsx` | Card container for a profile. |
| `profile-viewer.tsx` | Create/edit profile dialog. |
| `profile-more.tsx` | "More" menu for profile actions. |
| `editor-viewer.tsx` | Generic YAML editor dialog. |
| `rules-editor-viewer.tsx` / `proxies-editor-viewer.tsx` / `groups-editor-viewer.tsx` | Editors for profile `rules` / `proxies` / `groups` merge files. |
| `rule-item.tsx` / `proxy-item.tsx` / `group-item.tsx` | Items in the merge editors. |
| `file-input.tsx` | File picker input. |
| `qr-viewer.tsx` | QR code dialog for sharing a subscription. |
| `log-viewer.tsx` | Profile update log viewer. |

**`proxy/`** — proxies page:
| File | Purpose |
| --- | --- |
| `proxy-groups.tsx` / `proxy-groups-chain.tsx` | Proxy group list / chain groups. |
| `proxy-group-navigator.tsx` | Hover-jump navigator for large group lists. |
| `proxy-group-tools.tsx` | Group tools (delay test, sort). |
| `proxy-head.tsx` | Proxy table header. |
| `proxy-item.tsx` / `proxy-item-mini.tsx` | Proxy node row / mini node. |
| `proxy-render.tsx` | Proxy row rendering. |
| `provider-button.tsx` | Provider (subscription) button. |
| `proxy-chain.tsx` / `proxy-chain-model.ts` | Proxy chain UI + model. |
| `use-filter-sort.ts` / `use-render-list.ts` / `use-head-state.ts` / `use-window-width.ts` | Proxies page hooks. |
| `proxy-empty-state.ts` / `proxy-empty-state-model.ts` | Empty-state logic. |

**`rule/`** — `rule-item.tsx`, `provider-button.tsx`: rule list rendering.

**`setting/`** — settings pages and their `mods/` (individual setting panels):
- `setting-system.tsx` — System settings (TUN, system proxy, ports).
- `setting-clash.tsx` — Clash core settings.
- `setting-verge-basic.tsx` / `setting-verge-advanced.tsx` — App settings.
- `mods/` contains one file per settings panel: `tun-viewer.tsx`, `sysproxy-viewer.tsx`,
  `clash-port-viewer.tsx`, `clash-core-viewer.tsx`, `config-viewer.tsx`, `controller-viewer.tsx`,
  `dns-viewer.tsx`, `layout-viewer.tsx`, `theme-viewer.tsx`, `theme-mode-switch.tsx`,
  `misc-viewer.tsx`, `hotkey-viewer.tsx`/`hotkey-input.tsx`, `update-viewer.tsx`,
  `backup-*.tsx` (backup/webdav), `lite-mode-viewer.tsx`, `network-interface-viewer.tsx`,
  `stack-mode-switch.tsx`, `tunnels-viewer.tsx`, `external-controller-cors.tsx`,
  `web-ui-viewer.tsx`/`web-ui-item.tsx`, `setting-comp.tsx`, `auto-backup-settings.tsx`, etc.

**`shared/`**:
| File | Purpose |
| --- | --- |
| `proxy-control-switches.tsx` | Reusable system-proxy / TUN switches (used on Home + Settings). |
| `traffic-error-boundary.tsx` | Error boundary for traffic widgets. |

**`test/`** — latency test UI (`test-box.tsx`, `test-item.tsx`, `test-viewer.tsx`).

### Hooks (`src/hooks/`)

| File | Purpose |
| --- | --- |
| `use-verge.ts` | Read/patch the app config (`getVergeConfig` / `patchVergeConfig`). |
| `use-system-state.ts` | Poll/subscribe to the Rust `RunState` (service health, TUN capability). |
| `use-profiles.ts` | Profile list + mutation. |
| `use-clash.ts` | Clash core info/config. |
| `use-connection-data.ts` / `use-connection-setting.ts` | Connections page data. |
| `use-traffic-data.ts` / `use-traffic-monitor.ts` | Traffic stats. |
| `use-log-data.ts` / `use-clash-log.ts` | Log data. |
| `use-memory-data.ts` | Memory usage data. |
| `use-group-delays.ts` / `use-proxy-delay-state.ts` | Proxy delay tests. |
| `use-proxy-selection.ts` / `use-record-selection.ts` | Proxy group selection + persistence. |
| `use-service-installer.ts` / `use-service-uninstaller.ts` | Wrap `install_service` / `uninstall_service` commands. |
| `use-system-proxy-state.ts` | System proxy toggle state. |
| `use-editor-document.ts` | Load/save/reload logic for the YAML editors. |
| `use-icon-cache.ts` | Icon cache for node icons. |
| `use-i18n.ts` | i18n language switching. |
| `use-listen.ts` | Subscribe to Tauri events. |
| `use-mihomo-ws-subscription.ts` | Mihomo WebSocket subscription. |
| `use-network.ts` | Network interface data. |
| `use-update.ts` | App update checks. |
| `use-visibility.ts` | Page visibility. |
| `use-window.ts` | Window decorations/state. |
| `use-displayed-mixed-port.ts` | Mixed port display helper. |

### Services (`src/services/`)

| File | Purpose |
| --- | --- |
| `cmds.ts` | Typed wrappers for every backend `invoke` command (the IPC seam). |
| `events.ts` | Tauri event subscription wrappers. |
| `api.ts` | HTTP client for mihomo API. |
| `query-client.ts` | SWR/React-Query-style cache + `useQuery`. |
| `states.ts` | Global UI state stores (theme mode, loading cache, update state). |
| `i18n.ts` | i18n init/language resolution. |
| `preload.ts` | Preloads verge config/theme/language before React mounts. |
| `notice-service.ts` | Toast/notice API. |
| `delay.ts` | Delay test scheduling. |
| `update.ts` | Updater helpers. |
| `monaco.ts` | Monaco editor worker setup. |
| `webdav-status.ts` | WebDAV backup status. |
| `traffic-monitor-worker.ts` | Web worker for traffic sampling. |

### Providers (`src/providers/`)

| File | Purpose |
| --- | --- |
| `app-data-provider.tsx` | Loads and provides app data (profiles, clash info) at startup. |
| `app-data-context.ts` | Context type for the above. |
| `window/index.ts`, `window-provider.tsx`, `window-context.ts` | Window state context. |

### Utilities (`src/utils/`)

| File | Purpose |
| --- | --- |
| `get-system.ts` | Detect OS (`macos`/`windows`/`linux`). |
| `parse-traffic.ts` / `traffic-sampler.ts` | Traffic value parsing/sampling. |
| `parse-hotkey.ts` | Hotkey string parsing. |
| `debounce.ts` / `delay.ts` | Debounce/delay helpers. |
| `debug.ts` | Debug logging. |
| `network.ts` | Network helpers. |
| `mixed-port.ts` | Mixed port helpers. |
| `disable-webview-shortcuts.ts` | Disables webview default shortcuts. |
| `is-async-function.ts`, `noop.ts`, `search-matcher.ts` | Small utilities. |
| `uri-parser/*.ts` | Parse subscription share URIs (`vmess`, `vless`, `ss`, `ssr`, `trojan`, `hysteria*`, `tuic`, `wireguard`, `http`, `socks`, `anytls`, …). |
| `yaml.worker.ts` | YAML parsing web worker. |

### Types (`src/types/`)

| File | Purpose |
| --- | --- |
| `global.d.ts` | Global interfaces (`IVergeConfig`, `IProfileItem`, `IClashInfo`, …). |
| `proxy-view.ts` | Proxy view schema types. |
| `monaco.ts`, `i18next.d.ts`, `react-i18next.d.ts` | Library type augmentations. |
| `generated/i18n-keys.ts`, `generated/i18n-resources.ts` | Generated i18n key/resource types. |

### Other frontend directories

| Path | Purpose |
| --- | --- |
| `src/assets/styles/` | Global Sass styles (`index.scss` and friends). |
| `src/assets/image/` | Static images and SVG icons (`itemicon/*`, `logo.svg`, `icon.png`, …). |
| `src/assets/fonts/` | Bundled fonts. |
| `src/locales/<lang>/` | i18n JSON files per language (`en`, `zh`, `ru`, `ja`, …). |
| `src/polyfills/` | Browser API polyfills (`WeakRef.js`, `matchMedia.js`, `RegExp.js`). |
| `tests/proxy-view.test.ts` | Root-level test for the proxy-view model. |

---

## 4. Backend — `src-tauri/`

### Entry

| File | Purpose |
| --- | --- |
| `src/main.rs` | Process entry: initializes logger/working dir, runs the Tauri app. |
| `src/lib.rs` | Tauri builder: registers plugins and all `cmd::*` commands, wires setup hooks. |
| `src/constants.rs` | Shared constants (TUN config, network, timing). |
| `build.rs` | Cargo build script (embed icons/sidecar service binaries). |

### `src/cmd/` — Tauri IPC commands

Each file is a group of `#[tauri::command]` functions reachable from the frontend via `invoke`.

| File | Purpose |
| --- | --- |
| `mod.rs` | Command module declarations. |
| `app.rs` | Exit, restart app, open app/core/logs dirs, devtools. |
| `backup.rs` | Local/WebDAV backup commands. |
| `clash.rs` | Start/stop/restart core, change core, read logs. |
| `lightweight.rs` | Lightweight (silent) mode commands. |
| `listener.rs` | Event listener management commands. |
| `media_unlock_checker/mod.rs` | Media-unlock check command. |
| `network.rs` | Network interface/hostname commands. |
| `profile.rs` | Profile CRUD, import, reorder, update. |
| `proxy.rs` | Proxy/TUN/system-proxy toggle commands. |
| `runtime.rs` | Runtime config get/patch. |
| `save_profile.rs` | Save a profile file back to disk. |
| `service.rs` | `install_service` / `uninstall_service` / `reinstall_service` / `repair_service` / `continue_with_sidecar`. |
| `system.rs` | System info command. |
| `uwp.rs` | Windows UWP loopback tool. |
| `validate.rs` | Profile/config validation. |
| `verge.rs` | Get/patch verge config. |
| `webdav.rs` | WebDAV config commands. |

### `src/config/` — configuration layer

| File | Purpose |
| --- | --- |
| `mod.rs` | Re-exports config types. |
| `config.rs` | `Config` singleton holding the four draft configs (verge/clash/profiles/runtime); TUN session suppression. |
| `verge.rs` | `IVerge` — the app settings schema (`simple_mode`, `enable_tun_mode`, …), template defaults, patch + save. |
| `clash.rs` | `IClashTemp` — the generated mihomo core config. |
| `profiles.rs` | Profile list storage/parsing. |
| `runtime.rs` | Runtime (hot) config. |
| `prfitem.rs` | `IProfileItem` model (subscription URL, merge files, options). |
| `encrypt.rs` | Encrypted config field (de)serialization (WebDAV password, etc.). |
| `mixed_port.rs` | Mixed-port fallback on conflicts. |
| `port.rs` | Port allocation helpers. |
| `snapshot.rs` | Config snapshot/diff helpers. |

### `src/core/` — core runtime & service management

| File | Purpose |
| --- | --- |
| `mod.rs` | Core module declarations. |
| `handle.rs` | Global app handle, notice/refresh helpers. |
| `autostart.rs` | OS auto-launch registration. |
| `backup.rs` | Backup engine. |
| `hotkey.rs` | Global hotkey registration. |
| `listener.rs` | Mihomo event listeners. |
| `logger.rs` | Log file management. |
| `notification.rs` | Notification payloads. |
| `owner_identity.rs` | Credentials proving the app "owns" the running service core. |
| `proxy_control.rs` | System proxy set/clear + guard mode. |
| `proxy_view.rs` | Proxy view model served to the frontend. |
| `runtime_bundle.rs` | Collects the core/service runtime bundle for the daemon. |
| `service.rs` | **Service manager**: detects, installs/uninstalls/repairs the privileged `clash-verge-service`; platform-specific installers. |
| `sysopt.rs` | System optimizations. |
| `timer.rs` | Profile auto-update timers. |
| `updater.rs` | Silent updater. |
| `validate.rs` | Config validation. |
| `win_uwp.rs` | Windows UWP loopback exemption. |
| `manager/mod.rs` | `CoreManager` singleton; `init()`, core state, singleton wiring. |
| `manager/config.rs` | Config update guard. |
| `manager/lifecycle.rs` | Core start/stop/restart state machine; **TUN startup decision** (`prepare_startup`). |
| `manager/state.rs` | Core running-mode state. |
| `runstate/mod.rs` | `RunStateStore` — single source of truth for service health + pending actions. |
| `runstate/health.rs` | `ServiceHealth`, `RunState` and derived answers (`tun_capable`, `service_needs_attention`, …). |
| `runstate/env.rs` | RunState environment glue (spawns reconciliation). |
| `runstate/owner.rs` | Service owner watch. |
| `runstate/probe.rs` | Service health probing. |
| `tray/mod.rs` | System tray icon + menu. |
| `tray/menu_def.rs` | Tray menu definitions. |
| `tray/speed_task.rs` | Tray speed display task. |

### `src/enhance/` — config merge pipeline

Builds the final mihomo config from global + profile + script overrides.

| File | Purpose |
| --- | --- |
| `mod.rs` | `enhance()` entry point; applies profile fields, merge, script, TUN. |
| `merge.rs` | Merge (extend) config application. |
| `field.rs` | Profile field overrides (ports, DNS, …). |
| `script.rs` | Script-based overrides. |
| `chain.rs` | Proxy chain building. |
| `seq.rs` | Ordered merge sequence. |
| `tun.rs` | Injects TUN settings into the generated config. |

### `src/feat/` — feature actions

React to config patches / events with side effects.

| File | Purpose |
| --- | --- |
| `mod.rs` | Module declarations. |
| `config.rs` | Applies verge/clash patches, computes update flags (restart core, sys proxy, …). |
| `clash.rs` | Clash config apply. |
| `profile.rs` | Profile apply/update flow. |
| `proxy.rs` | System proxy / TUN toggle actions. |
| `tun.rs` | `reconcile_tun_availability()` — auto-disable TUN when it can't work. |
| `listener.rs` | Listener registration. |
| `icon.rs` | Tray icon copy/cache. |
| `backup.rs` | Backup actions. |
| `window.rs` | Window actions. |

### `src/module/`

| File | Purpose |
| --- | --- |
| `mod.rs` | Module declarations. |
| `auto_backup.rs` | Automatic scheduled backup manager. |
| `lightweight.rs` | Lightweight/silent mode. |

### `src/process/`

| File | Purpose |
| --- | --- |
| `mod.rs` | Module declarations. |
| `async_handler.rs` | Tokio runtime + `AsyncHandler` spawn helpers. |

### `src/utils/`

| File | Purpose |
| --- | --- |
| `mod.rs` | Module declarations. |
| `dirs.rs` | App data/log/config directories and the `APP_ID` (singleton identity). |
| `help.rs` | Helpers (YAML save, elevation detection, etc.). |
| `init.rs` | Init helpers (resources, DNS, config). |
| `singleton.rs` | Single-instance enforcement. |
| `server.rs` | Embedded HTTP server. |
| `window_manager.rs` | Creates/manages the main window. |
| `notification.rs` | Notification message enum. |
| `network.rs`, `port.rs`, `speed.rs` | Network/port/speed helpers. |
| `tmpl.rs` | Text templates. |
| `yaml_emitter.rs` | YAML serialization emitter. |
| `connections_stream.rs` | Streaming connection data. |
| `schtasks.rs` | Windows scheduled tasks. |
| `tray_speed.rs` | Tray speed formatting. |
| `macos_launch_guard.rs` | macOS launch guard. |
| `linux/mod.rs`, `linux/mime.rs`, `linux/workarounds.rs` | Linux-specific helpers. |
| `resolve/mod.rs` | **Startup orchestration** (`resolve_setup_async`; includes `ensure_tun_mode_and_service`). |
| `resolve/dns.rs` | DNS config init. |
| `resolve/scheme.rs` | Deep-link scheme handling. |
| `resolve/window.rs` | Window creation config (title, size). |
| `resolve/window_script.rs` | Injected window script. |

---

## 5. Workspace crates — `crates/`

| Crate | Purpose |
| --- | --- |
| `clash-verge-draft` | Generic `Draft<T>` / `SharedDraft<T>` config types with draft/apply/discard + transactions (used by the config layer). |
| `clash-verge-i18n` | Locale loading, `set_locale`, generated i18n types. |
| `clash-verge-logging` | `logging!` macros + log level/file management. |
| `clash-verge-limiter` | Rate limiter used to cap concurrent profile updates. |
| `clash-verge-media-unlock` | Media-unlock (streaming region) checkers: `netflix.rs`, `youtube.rs`, `disney_plus.rs`, `spotify.rs`, `bilibili.rs`, `chatgpt.rs`, `claude.rs`, `gemini.rs`, `bahamut.rs`, `prime_video.rs`, `tiktok.rs`, plus shared `types.rs`/`utils.rs`/`lib.rs`. |
| `clash-verge-signal` | Cross-platform signal handling (`unix.rs`, `windows.rs`). |
| `tauri-plugin-clash-verge-sysinfo` | Tauri plugin exposing sysinfo (e.g. `is_current_app_handle_admin`). |

---

## 6. Scripts

### `scripts/`

| File | Purpose |
| --- | --- |
| `build.mjs` | **Cross-platform build helper** (new). Resolves platform/arch → Rust target, runs prebuild + `tauri build`. See below. |
| `prebuild.mjs` | Downloads the correct mihomo core + service binaries for a target, with caching. |
| `dev.mjs` | Dev-mode launcher (builds `tauri dev` invocation, service/sidecar modes). |
| `dev-control.mjs` | Dev process control (quit, ports, instance records). |
| `dev-service.mjs` | Dev service setup. |
| `utils.mjs` | Shared colored log helpers (`log_info`, `log_error`, `log_success`, `log_debug`). |
| `updater.mjs` / `updater-fixed-webview2.mjs` | Build updater artifacts (normal / bundled WebView2). |
| `portable.mjs` / `portable-fixed-webview2.mjs` | Build portable (zip) variants. |
| `release-version.mjs` / `publish-version.mjs` | Version bump + release publishing. |
| `service-release.mjs` | Clash service release helper. |
| `generate-i18n-keys.mjs` / `cleanup-unused-i18n.mjs` | i18n key generation / cleanup. |
| `fix-alpha_version.mjs` | Alpha version fixups. |
| `updatelog.mjs` | Update log extraction. |
| `telegram.mjs` | Telegram release notification. |
| `extract_update_logs.sh` | Extract changelog section for a release. |
| `set_dns.sh` / `unset_dns.sh` | DNS helpers (macOS). |

### `scripts-workflow/`

| File | Purpose |
| --- | --- |
| `bump_changelog.sh` | Changelog bump. |
| `get_latest_tauri_commit.bash` | Fetch latest Tauri commit. |

---

## 7. Building

### Quick build (single platform)

```bash
pnpm install
node scripts/build.mjs                  # release build for the current OS/arch
node scripts/build.mjs --profile fast   # fast dev iteration build
```

`--platform` / `--arch` / `--target` select the target; `--force` re-downloads the mihomo core.

```bash
node scripts/build.mjs --platform macos --arch arm64   # Apple Silicon
node scripts/build.mjs --platform macos --arch x64     # Intel
node scripts/build.mjs --platform windows --arch x64   # Windows (run on Windows)
node scripts/build.mjs --platform linux --arch arm64   # Linux ARM64 (run on Linux)
```

> **Note:** Tauri bundles are OS-native. Build each platform **on that OS**
> (or use the CI matrix in `.github/workflows/release.yml`, which builds
> macOS/Windows/Linux in parallel).

### Outputs

- **macOS**: `src-tauri/target/<triple>/<profile>/bundle/macos/*.app` and `bundle/dmg/*.dmg`
- **Windows**: `src-tauri/target/<triple>/<profile>/bundle/nsis/*-setup.exe`
- **Linux**: `src-tauri/target/<triple>/<profile>/bundle/deb/*.deb`, `bundle/rpm/*.rpm`, `bundle/appimage/*.AppImage`

### Development

```bash
pnpm dev            # dev mode (hot reload)
pnpm web:dev        # frontend only in browser
pnpm typecheck      # TypeScript check
pnpm lint           # ESLint
cargo check         # Rust type check (from src-tauri/)
```

---

## 8. End-user "simple mode" notes (this fork)

- On startup the backend **auto-enables TUN** and **installs/repairs the privileged service**
  (`src-tauri/src/utils/resolve/mod.rs` → `ensure_tun_mode_and_service`).
- `simple_mode` (default `true`) hides all sidebar items except **Home**
  (`src/pages/_layout.tsx`) and suppresses the profile item right-click context menu
  (`src/components/profile/profile-item.tsx`).
- Set `simple_mode: false` in `verge.yaml` and restart to restore the full UI for troubleshooting.
