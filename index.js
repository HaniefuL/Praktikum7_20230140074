import express from "express";
import mysql from "mysql2/promise";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.static("public")); // ✅ Serve file index.html di folder public

// === Koneksi Database ===
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "b3RSYUKUR",
  database: "database",
  port: 3307,
});

// === Generate API Key ===
function generateAPIKey() {
  const part1 = Math.random().toString(36).substring(2, 10);
  const part2 = Math.random().toString(36).substring(2, 10);
  return "sk-" + part1 + part2 + Date.now().toString(36);
}

// === Endpoint: Generate API Key ===
app.post("/api/generate", async (req, res) => {
  try {
    const apiKey = generateAPIKey();
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");

    await db.execute("INSERT INTO `table` (`API key`) VALUES (?)", [hash]);

    res.json({
      success: true,
      message: "API key berhasil dibuat dan disimpan ke database",
      api_key: apiKey,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Gagal membuat API key" });
  }
});

// === Endpoint: Validasi API Key ===
// === Endpoint: Validasi API Key (RESPON SINGKAT) ===
app.post("/api/validate", async (req, res) => {
  try {
    const { api_key } = req.body;
    if (!api_key) {
      // 400 = Bad Request jika field tidak dikirim
      return res.status(400).json({ valid: false, error: "api_key required" });
    }

    const hash = crypto.createHash("sha256").update(api_key).digest("hex");
    const [rows] = await db.execute("SELECT 1 FROM `table` WHERE `API key` = ? LIMIT 1", [hash]);

    if (rows.length === 0) {
      // 200 juga boleh, tapi kita kirim valid:false (atau 401 jika ingin menunjukkan unauthorized)
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error("Validate error:", err);
    // 500 untuk kesalahan server
    return res.status(500).json({ valid: false, error: "server_error" });
  }
});


// === Jalankan Server ===
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server berjalan di http://localhost:${PORT}`));
