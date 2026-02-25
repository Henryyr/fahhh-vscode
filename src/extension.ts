import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";

// ─────────────────────────────────────────────
//  FAHHH! Error Sound Extension for VS Code
// ─────────────────────────────────────────────

let lastPlayTime = 0;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

// Pre-built paths — disiapkan saat aktivasi, bukan tiap play
let soundPath = "";
let vbsPath = "";

// Tulis VBS sekali saat aktivasi
function prepareVbs(volume: number) {
  const content = [
    `Dim snd`,
    `Set snd = CreateObject("WMPlayer.OCX")`,
    `snd.settings.volume = ${Math.floor(volume * 100)}`,
    `snd.URL = "${soundPath}"`,
    `snd.controls.play()`,
    `Do While snd.playState <> 1`,
    `  WScript.Sleep 30`,
    `Loop`,
    `snd.close()`,
  ].join("\r\n");
  fs.writeFileSync(vbsPath, content, "utf8");
}

function playSound() {
  const config = vscode.workspace.getConfiguration("fahhh");
  if (!config.get<boolean>("enabled", true)) return;

  // Cooldown check
  const now = Date.now();
  const cooldown = config.get<number>("cooldownMs", 2000);
  if (now - lastPlayTime < cooldown) return;
  lastPlayTime = now;

  if (!fs.existsSync(soundPath)) {
    outputChannel.appendLine(`[FAHHH] ❌ File not found: ${soundPath}`);
    return;
  }

  // Visual feedback — langsung, tanpa nunggu audio
  statusBarItem.text = "💥 FAHHH!";
  statusBarItem.backgroundColor = new vscode.ThemeColor(
    "statusBarItem.errorBackground",
  );
  setTimeout(() => {
    statusBarItem.text = "🔊 FAHHH";
    statusBarItem.backgroundColor = undefined;
  }, 1500);

  // spawn tanpa shell — lebih cepat dari exec()
  let proc: ReturnType<typeof spawn>;
  if (process.platform === "win32") {
    // VBS sudah di-cache saat aktivasi, tinggal jalankan
    proc = spawn("cscript", ["//nologo", vbsPath], {
      detached: true,
      stdio: "ignore",
    });
  } else if (process.platform === "darwin") {
    const vol = config.get<number>("volume", 1.0);
    proc = spawn("afplay", ["-v", String(vol), soundPath], {
      detached: true,
      stdio: "ignore",
    });
  } else {
    // Linux — mpg123 paling cepat, fallback ffplay
    proc = spawn("mpg123", ["-q", soundPath], {
      detached: true,
      stdio: "ignore",
    });
    proc.on("error", () => {
      const fb = spawn(
        "ffplay",
        ["-nodisp", "-autoexit", "-loglevel", "quiet", soundPath],
        {
          detached: true,
          stdio: "ignore",
        },
      );
      fb.unref();
    });
  }

  proc.unref(); // Jangan blok event loop
  outputChannel.appendLine(`[FAHHH] 💥 Playing!`);
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("FAHHH! Error Sound");

  // Siapkan paths
  soundPath = path.join(
    context.extensionUri.fsPath,
    "sound",
    "fahhh_KcgAXfs.mp3",
  );
  vbsPath = path.join(context.globalStorageUri.fsPath, "play.vbs");

  // Buat folder storage kalau belum ada
  fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });

  // Tulis VBS sekali di awal — tidak perlu ditulis ulang tiap play
  if (process.platform === "win32") {
    const vol = vscode.workspace
      .getConfiguration("fahhh")
      .get<number>("volume", 2.0)!;
    prepareVbs(vol);
    outputChannel.appendLine(`[FAHHH] VBS ready: ${vbsPath}`);
  }

  outputChannel.appendLine(`[FAHHH] ✅ Activated! Sound: ${soundPath}`);
  outputChannel.appendLine(`[FAHHH] File exists: ${fs.existsSync(soundPath)}`);

  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.text = "🔊 FAHHH";
  statusBarItem.tooltip = "FAHHH! Error Sound — Click to test";
  statusBarItem.command = "fahhh.test";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("fahhh.test", () => {
      playSound();
      vscode.window.showInformationMessage("💥 FAHHH!");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("fahhh.toggle", () => {
      const config = vscode.workspace.getConfiguration("fahhh");
      const current = config.get<boolean>("enabled", true);
      config.update("enabled", !current, vscode.ConfigurationTarget.Global);
      statusBarItem.text = !current ? "🔊 FAHHH" : "🔇 FAHHH";
      vscode.window.showInformationMessage(
        `FAHHH ${!current ? "enabled 🔊" : "disabled 🔇"}`,
      );
    }),
  );

  // ─── Diagnostic errors ──────────────────────────────────────────────────────
  const config = vscode.workspace.getConfiguration("fahhh");

  if (config.get<boolean>("triggerOnDiagnostics", true)) {
    let previousErrorCount = 0;

    context.subscriptions.push(
      vscode.languages.onDidChangeDiagnostics((event) => {
        const cfg = vscode.workspace.getConfiguration("fahhh");
        if (!cfg.get<boolean>("triggerOnDiagnostics", true)) return;

        let totalErrors = 0;
        for (const uri of event.uris) {
          totalErrors += vscode.languages
            .getDiagnostics(uri)
            .filter(
              (d) => d.severity === vscode.DiagnosticSeverity.Error,
            ).length;
        }

        if (totalErrors > previousErrorCount) {
          outputChannel.appendLine(
            `[FAHHH] ${totalErrors - previousErrorCount} new error(s)`,
          );
          playSound();
        }
        previousErrorCount = totalErrors;
      }),
    );
  }

  // ─── Task failures ──────────────────────────────────────────────────────────
  if (config.get<boolean>("triggerOnTestFailure", true)) {
    context.subscriptions.push(
      vscode.tasks.onDidEndTaskProcess((event) => {
        const cfg = vscode.workspace.getConfiguration("fahhh");
        if (!cfg.get<boolean>("triggerOnTestFailure", true)) return;

        const name = event.execution.task.name.toLowerCase();
        const isTest =
          name.includes("test") ||
          name.includes("jest") ||
          name.includes("mocha") ||
          name.includes("pytest") ||
          name.includes("vitest") ||
          name.includes("spec") ||
          name.includes("cargo test") ||
          name.includes("go test");

        if (isTest && event.exitCode !== 0 && event.exitCode !== undefined) {
          outputChannel.appendLine(
            `[FAHHH] Task "${event.execution.task.name}" failed`,
          );
          playSound();
        }
      }),
    );
  }

  // ─── Terminal output ────────────────────────────────────────────────────────
  if (config.get<boolean>("triggerOnTestFailure", true)) {
    const onWrite = (vscode.window as any).onDidWriteTerminalData as
      | ((cb: (e: { data: string }) => void) => vscode.Disposable)
      | undefined;

    if (typeof onWrite === "function") {
      const patterns = [
        "tests failed",
        "test failed",
        "failing tests",
        "assertion error",
        "assertionerror",
        "testfailure",
        "test failure",
        "panic:",
        "fatal:",
      ];

      context.subscriptions.push(
        onWrite((event) => {
          const cfg = vscode.workspace.getConfiguration("fahhh");
          if (!cfg.get<boolean>("triggerOnTestFailure", true)) return;
          const text = event.data.toLowerCase();
          if (patterns.some((p) => text.includes(p))) {
            playSound();
          }
        }),
      );
    }
  }

  outputChannel.appendLine("[FAHHH] Watching for errors and failures...");
}

export function deactivate() {
  outputChannel?.appendLine("[FAHHH] Deactivated.");
}
