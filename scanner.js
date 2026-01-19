const fs = require("fs");
const path = require("path");

// === AYARLAR ===
const SCAN_DIR = "/sdcard/Download";
const SUSPICIOUS_EXTENSIONS = [".apk", ".exe", ".bat", ".vbs", ".js"];
const SUSPICIOUS_KEYWORDS = [
  "eval",
  "base64",
  "curl",
  "wget",
  "powershell",
  "rm -rf"
];

let results = [];

function scanDirectory(dirPath) {
  let files;

  try {
    files = fs.readdirSync(dirPath);
  } catch (err) {
    return;
  }

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (err) {
      return;
    }

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      analyzeFile(fullPath, stat.size);
    }
  });
}

function analyzeFile(filePath, size) {
  let score = 0;
  const ext = path.extname(filePath).toLowerCase();

  if (SUSPICIOUS_EXTENSIONS.includes(ext)) {
    score++;
  }

  if (size < 50 * 1024 && ext === ".apk") {
    score++;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    SUSPICIOUS_KEYWORDS.forEach(word => {
      if (content.includes(word)) score++;
    });
  } catch (err) {
    // binary dosya olabilir, geç
  }

  if (score > 0) {
    results.push({
      file: filePath,
      score: score
    });
  }
}

// === ÇALIŞTIR ===
console.log("🔍 Mobile Security Scanner başlatıldı...");
console.log("📂 Taranan klasör:", SCAN_DIR);

scanDirectory(SCAN_DIR);

console.log("\n📊 SONUÇLAR:");
if (results.length === 0) {
  console.log("✅ Şüpheli dosya bulunmadı");
} else {
  results.forEach(r => {
    const level =
      r.score >= 3 ? "🔴 RİSKLİ" :
      r.score === 2 ? "🟠 ŞÜPHELİ" :
      "🟡 DÜŞÜK RİSK";

    console.log(`${level} | Puan: ${r.score} | ${r.file}`);
  });
}

console.log("\n✔ Tarama tamamlandı.");


