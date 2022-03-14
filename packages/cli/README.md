# @ziglang/cli

This package serves as a wrapper for the Zig compiler CLI itself. It checks if Zig is installed system-wide, and otherwise detects the current platform, fetches the corresponding Zig binary, and installs it locally in your `node_modules` folder. This will be the typical scenario when setting up in a CI environment where Zig is not available.

If Zig is already installed, by default only a symlink to it will be created, no additional Zig package is installed. This will be the typical setup in development. If desired, the `zig-install` script can still be used to install a local version of Zig, regardless of any system-wide version.

### Installing

```sh
npm i -D @ziglang/cli # or yarn or pnpm
```

### Scripts

At the end of the `npm install` process, the `postinstall.js` script should run automatically, and install/symlink Zig (and other scripts) locally into your `./node_modules/.bin` folder:

```sh
./node_modules/.bin/zig # the actual zig binary/symlink once installed
./node_modules/.bin/zig-install # installs zig locally
./node_modules/.bin/zig-reinstall # reinstalls zig locally
./node_modules/.bin/zig-uninstall # removes the local zig binary/symlink
```

The scripts can be manually executed if needed to fix any issue with the installation, either via `npx` (or `pnpx` or `yarn`), `npm exec`, or just referring to the script by name in your package.json `scripts`:

```sh
# examples for zig-install
./node_modules/.bin/zig-install
npx zig-install
npm exec zig-install
```

```json
{
  "scripts": {
    "postinstall": "zig-install"
  }
}
```

## Notes and TODOs

Priority:

- Handle versions, ideally it should be possible to track upstream Zig releases as tags, `latest` for stable releases, `next` to track master builds for example.
- Better cross-platform support, tested on Debian on WSL2, native Arch Linux and macOS Monterey. Should work well on most UNIX-like environments with `curl`, `tar`, and `xz`. Also tested deployment using Cloudflare Pages, Netlify, and Vercel (needed to manually `yum install xz` in the install command).

Explore:

- Provide a JS API for common zig CLI functionality (`build`, `build-lib`, `fmt`, `run`, `test`, `translate-c`, etc.)
- Compile Zig's `std.zig` functions into Wasm (export C-compatible functions), provide a JS API for the raw compiler functionality (tokenizer, parser)

## Inspiration

- [binary-install](https://github.com/EverlastingBugstopper/binary-install)
- [wasm-pack npm module](https://github.com/rustwasm/wasm-pack/tree/master/npm)

## License

[MIT](LICENSE)
