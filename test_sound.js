const { exec } = require("child_process");
const soundPath = "C:\\Users\\Hype AMD\\Projects\\fahhh-vscode\\src\\sound\\fahhh_KcgAXfs.mp3";
const winVolume = 100;
let cmd = `powershell -c "$player = New-Object -ComObject WMPlayer.OCX; $player.settings.volume = ${winVolume}; $player.URL = '${soundPath}'; $player.controls.play(); Start-Sleep -s 2"`;
console.log("CMD:", cmd);
exec(cmd, (err, stdout, stderr) => {
    console.log("ERR:", err);
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);
});
