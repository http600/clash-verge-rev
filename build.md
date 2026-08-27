```shell
node scripts/build.mjs                  # build for the current OS/arch (release)
node scripts/build.mjs --profile fast   # fast-release cargo profile (dev iteration)
node scripts/build.mjs --platform macos --arch arm64   # Apple Silicon
node scripts/build.mjs --platform macos --arch x64     # Intel
node scripts/build.mjs --platform windows --arch x64   # Windows
node scripts/build.mjs --platform linux --arch arm64   # Linux ARM64
node scripts/build.mjs --target aarch64-apple-darwin   # explicit Rust triple
node scripts/build.mjs --force          # force re-download mihomo core
node scripts/build.mjs --skip-prebuild  # skip core download
```