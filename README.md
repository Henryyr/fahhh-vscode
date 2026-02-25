# FAHHH! Error Sound — VS Code Extension

> **Plays a dramatic "FAHHH" sound when errors or test failures are detected.**
> Because silent failures are boring. Be notified with DRAMA.

---

## Features

- **Diagnostic Errors** — Plays sound when new red-squiggle errors appear in your code
- **Test Failures** — Plays sound when test tasks exit with non-zero code
- **Terminal Watcher** — Detects common failure patterns in terminal output
- **Configurable** — Volume, cooldown, and per-trigger toggles
- **Status Bar Button** — Click to test the sound anytime

---

## Installation

### From Source

```bash
# Clone the repo
git clone <your-repo>
cd fahhh-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npx vsce package

# Install the .vsix file
code --install-extension fahhh-error-sound-1.0.0.vsix
```

### Prerequisites for Sound Playback

| OS      | Requirement                            |
|---------|----------------------------------------|
| Windows | Built-in (PowerShell Media.SoundPlayer)|
| macOS   | Built-in (`afplay`)                    |
| Linux   | `aplay` (ALSA), `paplay` (PulseAudio), or `ffplay` (FFmpeg) |

**Linux install:**
```bash
# Ubuntu/Debian
sudo apt install alsa-utils

# Or PulseAudio
sudo apt install pulseaudio-utils
```

---

## Configuration

Open VS Code settings (`Ctrl+,`) and search for "FAHHH":

| Setting | Default | Description |
|---------|---------|-------------|
| `fahhh.enabled` | `true` | Master on/off switch |
| `fahhh.volume` | `1.0` | Volume (0.0–1.0) |
| `fahhh.triggerOnDiagnostics` | `true` | Fire on code errors |
| `fahhh.triggerOnTestFailure` | `true` | Fire on test failures |
| `fahhh.cooldownMs` | `2000` | Cooldown between sounds (ms) |

---

## Commands

| Command | Description |
|---------|-------------|
| `FAHHH! Test Sound` | Plays the sound immediately |
| `FAHHH! Toggle On/Off` | Toggles the extension |

Access via `Ctrl+Shift+P` → type "FAHHH"

---

## How It Works

The sound is **synthesized in pure code** — no audio files bundled. It generates a WAV file with:
- Pitch that slides from 440Hz → 80Hz (the "falling" FAHHH effect)
- Multiple harmonics for a harsh, dramatic tone
- Breath noise at the start for the "F" consonant

---

## License

MIT — Make all the FAHHH noise you want
