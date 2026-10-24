
const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.use(express.static("public"));

app.get("/api/status", (req, res) => {
  res.json({ app: "Desenrola AI", status: "online" });
});

app.post("/api/analisar", upload.single("print"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        erro: "A IA ainda não foi configurada."
      });
    }

    if (!req.file || !req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        erro: "Envie uma imagem válida."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const base64 = req.file.buffer.toString("base64");

    const resposta = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analise este print de conversa. Entenda as últimas mensagens e sugira 3 respostas naturais em português brasileiro: uma tranquila, uma engraçada e uma com flerte leve. Respeite o contexto e não invente mensagens ilegíveis."
          },
          {
            type: "input_image",
            image_url: `data:${req.file.mimetype};base64,${base64}`,
            detail: "high"
          }
        ]
      }]
    });

    res.json({ sugestoes: resposta.output_text });
  } catch (erro) {
    console.error("Erro na análise:", erro.message);
    res.status(500).json({
      erro: "Não consegui analisar o print. Tente novamente."
    });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Desenrola AI rodando na porta ${port}`);
});
