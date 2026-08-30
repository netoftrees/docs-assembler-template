# Changelog

All notable changes to the Docs Assembler Template are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This template repository is versioned independently of the Docs Assembler VS Code extension. The extension consumes releases via jsDelivr using Git tags (e.g., `v0.0.25`).

---

## [Unreleased]

### Upcoming
- Local Jekyll development instructions in README

---

## [0.0.30] - 2026-08-30

### Added
- **`.cspell.json`** - added to the distribution package. Repositories are now compatible out-of-the-box with the Code Spell Checker extension should users choose to install it.

### Changed
- **`distribution.json`** - added `.cspell.json` entry with `merge` strategy and `lineByLine` merge type.

---

## [0.0.26] - 2026-05-23

### Added
- **`updates.json` and `notices.json`** - new centralized configuration files for update discovery and user notices.
- **`resourcesVersion` property** - added to `package.json` to separate resource versioning from the repository/extension version.

### Changed
- **`package-assets.ts`** - updated to use `resourcesVersion` from `package.json` instead of the main `version` field for asset packaging and distribution.
- **`release.ts`** - updated to use `resourcesVersion` from `package.json` for tagging and release automation, decoupling resource releases from extension releases.
- **Post‑initialisation Feedback** - added help prompt to `末_FEEDBACK.md` for users unsure how to get started.

---

## [0.0.25] - 2026-05-19

### Added
- **GitHub Pages Ready** - Jekyll configuration (`_includes/`, `_layouts/`, `_config.yml`, `404.html`) for immediate publishing after `docs/` folder is populated.
- **FragmentRenderer Assets** - compiled JavaScript and CSS for client-side map rendering in published documentation, with Vite build pipeline for development and testing.
- **Static Assets** - `docs/assets/images/` and `docs/assets/scss/` for site styling and branding.
- **Git Configuration** - `.gitattributes` and `.gitignore` with standard Jekyll, Node, and OS-specific exclusions.
- **Resource Distribution Architecture** - `_distribution/` folder with versioned asset releases and `latest/` pointer for jsDelivr consumption.
- **Automated Build Pipeline** - `package-assets.ts` generates per-release zip archives with SHA-256 hashes for integrity verification.
- **Hash Reference Replacement** - `update-docs-assets.ts` automatically updates Jekyll `_includes/` and `_layouts/` to reference new Vite-hashed filenames.
- **Strategy-Based Installation Manifest** - supports `overwrite`, `skipIfExists`, `cleanOverwrite`, `merge`, and `addOnly` extraction strategies for flexible resource deployment.
- **Merge Types** - `appendUnique` for `.gitignore`/`.gitattributes`, `jsonDeep` for VS Code settings, `lineByLine` for text lists.
- **Release Automation** - `release.ts` script creates annotated Git tags from `package.json` version and pushes them automatically.
- **`update.json` Discovery File** - centralized version discovery at repo root, fetched by the extension via `@main` to check for available resource updates with localized English and Chinese messages.
- **Fallback Resource Loading** - extension downloader falls back to previous release tag if latest is not yet cached on jsDelivr.
- **Staging Cleanup** - `.staging/` directory is gitignored and automatically cleaned after zip creation to minimize repo size.
- **Root-Relative Asset Paths** - zip contents use root-relative paths (`docs/`, `tsmaps/`, `.templates/`, `root/`) resolved by extension to user's configured `docsFolder`.

### Fixed
- **CDN Cache Lag** - switched from `@latest` to `@main` branch refs, then to immutable Git tags for instant resource availability after release.
- **Zip Integrity Verification** - SHA-256 hash comparison prevents corrupted downloads from stale CDN edges.

### Security
- **Integrity Verification** - SHA-256 zip hashes in manifest prevent installation of corrupted or tampered resource packages.

---

*Note: Earlier releases between initial development and v0.0.25 are not individually documented here; their changes have been rolled into the v0.0.25 release notes above.*

