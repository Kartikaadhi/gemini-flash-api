// import dependencies
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";                      
import { fileURLToPath } from "url";  

// konfigurasi dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// inisialisasi express app
const app = express();
const upload = multer();

// middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

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

    // model + konfigurasi parameter (temperature, top_p, top_k)
    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash", // model terbaru
      generationConfig: {
        temperature: 0.7, 
        top_p: 0.9,       
        top_k: 40,        
      },
    });

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

     if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    const model = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
      },
    });

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
* ENDPOINT: CHAT CONVERSATION
*/
app.post("/api/chat", async (req, res) => {
  try {
    const { conversation } = req.body;
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(conversation);
    const text = result.response.text();
    res.json({ response: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
});

/**
 * Route utama: kirim file index.html
 */
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

