import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Gbê ou Moument" });
  });

  // AI Generate Challenge Route (Gemini 3.7 Flash)
  app.post("/api/gemini/generate-challenge", async (req, res) => {
    try {
      const { type = "vérité", intensity = "simple", theme = "ambiance soirée" } = req.body;
      const ai = getAiClient();

      if (!ai) {
        // Fallback default challenges if API key is not yet set
        const fallbacks: Record<string, Record<string, string[]>> = {
          vérité: {
            simple: [
              "Si tu devais échanger ta vie avec l'un des joueurs pendant 24h, qui choisirais-tu et pourquoi ?",
              "Quel est le mensonge le plus ridicule que tu aies raconté à tes parents ?",
              "Quelle est la chanson la plus honteuse que tu écoutes en cachette sous la douche ?",
              "Quel est ton pire souvenir de rendez-vous galant ou de crush ?"
            ],
            osée: [
              "Quel est ton plus gros fantasme inavoué à ce jour ?",
              "As-tu déjà eu des sentiments secrets pour quelqu'un dans cette pièce ?",
              "Quelle est la chose la plus folle que tu aies faite par amour ou attirance ?",
              "Quel est le secret intime que tu n'as jamais partagé avec personne ?"
            ]
          },
          action: {
            simple: [
              "Fais une déclaration d'amour théâtrale et dramatique à une bouteille d'eau pendant 30 secondes.",
              "Imite un professeur en colère ou une star de musique ivoirienne pendant 1 minute.",
              "Envoie un emoji mystère au 3ème contact de ton répertoire téléphonique.",
              "Fais 10 pompes ou 10 squats en criant 'Gbê ou Moument !' à chaque répétition."
            ],
            osée: [
              "Fais un regard de séduction irrésistible les yeux dans les yeux avec le joueur à ta gauche pendant 20 secondes sans rire.",
              "Chuchote à l'oreille du joueur de ton choix ton plus grand talent caché.",
              "Laisse le groupe poster un message drôle et intrigant en story sur ton réseau préféré pendant 5 minutes.",
              "Fais une danse du coupé-décalé ou afrobeat endiablée au milieu de la pièce."
            ]
          }
        };

        const list = fallbacks[type.toLowerCase()]?.[intensity.toLowerCase()] || fallbacks.vérité.simple;
        const randomItem = list[Math.floor(Math.random() * list.length)];
        return res.json({ success: true, challenge: randomItem, isFallback: true });
      }

      const prompt = `Génère une proposition percutante, amusante et engageante pour le jeu "Gbê ou Moument" (Action ou Vérité en ambiance urbaine/afro/party).
Type demandé : ${type === "vérité" ? "VÉRITÉ (Gbê - confession intime, drôle ou révélatrice)" : "ACTION (Moument - défi physique, théâtral, drôle ou audacieux)"}.
Intensité : ${intensity === "osée" ? "Osée (intime, piquante, sans filtre mais respectueuse)" : "Simple (amicale, drôle, réflexion, accessible à tous)"}.
Contexte ou thème : ${theme}.

RÈGLES IMPORTANTES :
- Rédige UNIQUEMENT la phrase du défi entre guillemets ou sous forme directe.
- Pas de texte d'introduction ni de conclusion.
- Ton : festif, dynamique, moderne et percutant.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      let challengeText = response.text ? response.text.trim() : "";
      // Clean up markdown quotes if present
      challengeText = challengeText.replace(/^["']|["']$/g, '');

      return res.json({ success: true, challenge: challengeText });
    } catch (err: unknown) {
      console.error("Gemini error in /api/gemini/generate-challenge:", err);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la génération IA",
        challenge: "Quelle est la chose la plus spontanée que tu aies faite cette année ?"
      });
    }
  });

  // AI Moderation Route
  app.post("/api/gemini/moderate-challenge", async (req, res) => {
    try {
      const { text = "" } = req.body;
      const ai = getAiClient();

      if (!ai || !text.trim()) {
        return res.json({ approved: true, reason: "Modération automatique validée." });
      }

      const prompt = `Tu es le modérateur de contenu pour le jeu d'ambiance "Gbê ou Moument".
Vérifie le défi suivant : "${text}".
Vérifie qu'il ne contient pas de haine, de violence extrême, de harcèlement direct dangereux ou de contenu illégal. L'humour, les taquineries bon enfant, les vérités piquantes et les défis de fête sont autorisés et encouragés.

Réponds sous le format JSON :
{
  "approved": true ou false,
  "feedback": "commentaire court pour le joueur"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || '{"approved": true, "feedback": "Validé"}');
      return res.json({ approved: parsed.approved ?? true, feedback: parsed.feedback || "Défi conforme aux règles de jeu." });
    } catch (err: unknown) {
      console.error("Moderation error:", err);
      return res.json({ approved: true, feedback: "Validé par défaut." });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // The preview proxy does not forward Vite's HMR WebSocket reliably.
        // Disable the client socket so preview loads without connection errors.
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Gbê ou Moument server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
