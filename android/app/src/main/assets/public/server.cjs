var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var aiClient = null;
function getAiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Gb\xEA ou Moument" });
  });
  app.post("/api/gemini/generate-challenge", async (req, res) => {
    try {
      const { type = "v\xE9rit\xE9", intensity = "simple", theme = "ambiance soir\xE9e" } = req.body;
      const ai = getAiClient();
      if (!ai) {
        const fallbacks = {
          v\u00E9rit\u00E9: {
            simple: [
              "Si tu devais \xE9changer ta vie avec l'un des joueurs pendant 24h, qui choisirais-tu et pourquoi ?",
              "Quel est le mensonge le plus ridicule que tu aies racont\xE9 \xE0 tes parents ?",
              "Quelle est la chanson la plus honteuse que tu \xE9coutes en cachette sous la douche ?",
              "Quel est ton pire souvenir de rendez-vous galant ou de crush ?"
            ],
            os\u00E9e: [
              "Quel est ton plus gros fantasme inavou\xE9 \xE0 ce jour ?",
              "As-tu d\xE9j\xE0 eu des sentiments secrets pour quelqu'un dans cette pi\xE8ce ?",
              "Quelle est la chose la plus folle que tu aies faite par amour ou attirance ?",
              "Quel est le secret intime que tu n'as jamais partag\xE9 avec personne ?"
            ]
          },
          action: {
            simple: [
              "Fais une d\xE9claration d'amour th\xE9\xE2trale et dramatique \xE0 une bouteille d'eau pendant 30 secondes.",
              "Imite un professeur en col\xE8re ou une star de musique ivoirienne pendant 1 minute.",
              "Envoie un emoji myst\xE8re au 3\xE8me contact de ton r\xE9pertoire t\xE9l\xE9phonique.",
              "Fais 10 pompes ou 10 squats en criant 'Gb\xEA ou Moument !' \xE0 chaque r\xE9p\xE9tition."
            ],
            os\u00E9e: [
              "Fais un regard de s\xE9duction irr\xE9sistible les yeux dans les yeux avec le joueur \xE0 ta gauche pendant 20 secondes sans rire.",
              "Chuchote \xE0 l'oreille du joueur de ton choix ton plus grand talent cach\xE9.",
              "Laisse le groupe poster un message dr\xF4le et intrigant en story sur ton r\xE9seau pr\xE9f\xE9r\xE9 pendant 5 minutes.",
              "Fais une danse du coup\xE9-d\xE9cal\xE9 ou afrobeat endiabl\xE9e au milieu de la pi\xE8ce."
            ]
          }
        };
        const list = fallbacks[type.toLowerCase()]?.[intensity.toLowerCase()] || fallbacks.v\u00E9rit\u00E9.simple;
        const randomItem = list[Math.floor(Math.random() * list.length)];
        return res.json({ success: true, challenge: randomItem, isFallback: true });
      }
      const prompt = `G\xE9n\xE8re une proposition percutante, amusante et engageante pour le jeu "Gb\xEA ou Moument" (Action ou V\xE9rit\xE9 en ambiance urbaine/afro/party).
Type demand\xE9 : ${type === "v\xE9rit\xE9" ? "V\xC9RIT\xC9 (Gb\xEA - confession intime, dr\xF4le ou r\xE9v\xE9latrice)" : "ACTION (Moument - d\xE9fi physique, th\xE9\xE2tral, dr\xF4le ou audacieux)"}.
Intensit\xE9 : ${intensity === "os\xE9e" ? "Os\xE9e (intime, piquante, sans filtre mais respectueuse)" : "Simple (amicale, dr\xF4le, r\xE9flexion, accessible \xE0 tous)"}.
Contexte ou th\xE8me : ${theme}.

R\xC8GLES IMPORTANTES :
- R\xE9dige UNIQUEMENT la phrase du d\xE9fi entre guillemets ou sous forme directe.
- Pas de texte d'introduction ni de conclusion.
- Ton : festif, dynamique, moderne et percutant.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
      });
      let challengeText = response.text ? response.text.trim() : "";
      challengeText = challengeText.replace(/^["']|["']$/g, "");
      return res.json({ success: true, challenge: challengeText });
    } catch (err) {
      console.error("Gemini error in /api/gemini/generate-challenge:", err);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la g\xE9n\xE9ration IA",
        challenge: "Quelle est la chose la plus spontan\xE9e que tu aies faite cette ann\xE9e ?"
      });
    }
  });
  app.post("/api/gemini/moderate-challenge", async (req, res) => {
    try {
      const { text = "" } = req.body;
      const ai = getAiClient();
      if (!ai || !text.trim()) {
        return res.json({ approved: true, reason: "Mod\xE9ration automatique valid\xE9e." });
      }
      const prompt = `Tu es le mod\xE9rateur de contenu pour le jeu d'ambiance "Gb\xEA ou Moument".
V\xE9rifie le d\xE9fi suivant : "${text}".
V\xE9rifie qu'il ne contient pas de haine, de violence extr\xEAme, de harc\xE8lement direct dangereux ou de contenu ill\xE9gal. L'humour, les taquineries bon enfant, les v\xE9rit\xE9s piquantes et les d\xE9fis de f\xEAte sont autoris\xE9s et encourag\xE9s.

R\xE9ponds sous le format JSON :
{
  "approved": true ou false,
  "feedback": "commentaire court pour le joueur"
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const parsed = JSON.parse(response.text || '{"approved": true, "feedback": "Valid\xE9"}');
      return res.json({ approved: parsed.approved ?? true, feedback: parsed.feedback || "D\xE9fi conforme aux r\xE8gles de jeu." });
    } catch (err) {
      console.error("Moderation error:", err);
      return res.json({ approved: true, feedback: "Valid\xE9 par d\xE9faut." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gb\xEA ou Moument server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
