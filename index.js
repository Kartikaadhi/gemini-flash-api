// import dependencies
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// konfigurasi dotenv
dotenv.config();

// inisialisasi express app
const app = express();
const upload = multer();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // letakkan di atas biar langsung kebaca saat akses /

/**
 * Inisialisasi koneksi ke Gemini API
 */
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Endpoint: Generate teks dari prompt
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = ai.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    const result = await model.generateContent(prompt);

    // ambil teks dengan cara aman
    const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mengambil respons.";

    res.json({ output: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat generate output' });
  }
});



/**
 * Endpoint: Upload file dan generate teks dengan konteks file
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { prompt } = req.body;

    if (!file) return res.status(400).json({ error: 'File tidak ditemukan' });

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } },
      { text: prompt }
    ]);

    const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mengambil respons.";

    res.json({ output: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat upload dan generate' });
  }
});


/**
 * Route utama: kirim file index.html
 */
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
