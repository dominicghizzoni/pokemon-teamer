import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

/**
 * POST /api/team
 * body: { description: string }
 * returns: { team: [{ name, reason, types, image }], rawModelOutput }
 */
app.post("/api/team", async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "description required" });

  const systemPrompt = `
You are a professional Pokémon team builder and personality analyst.
You must ALWAYS output valid JSON — nothing else.
`;

  const userPrompt = `
The user described themselves as: "${description}"

Create a team of EXACTLY SIX Pokémon that realistically match this person.
Use official Pokémon names only (no fan-made Pokémon).

Each Pokémon must include:
- "name": string
- "reason": short explanation why it fits the user (1–2 sentences)
- "types": array of lowercase strings (e.g., ["water", "flying"])

Return ONLY valid JSON in this format:

{
  "team": [
    {
      "name": "Pikachu",
      "reason": "A cheerful and energetic Pokémon that reflects your outgoing nature.",
      "types": ["electric"]
    },
    {
      "name": "Gyarados",
      "reason": "Represents your inner strength and passion beneath a calm exterior.",
      "types": ["water", "flying"]
    }
    // ... four more
  ]
}

Do not add comments, explanations, or text outside the JSON.
`;

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_output_tokens: 800,
    });

    const raw = response.output_text?.trim();

    if (!raw) return res.status(500).json({ error: "no model output" });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw new Error("Model output not valid JSON");
    }

    const team = parsed.team;
    if (!Array.isArray(team) || team.length !== 6) {
      throw new Error("Model did not return exactly six Pokémon");
    }


    const enriched = await Promise.all(team.map(async (p) => {
      // Handle regional forms properly
      let rawName = p.name.toLowerCase()
        .replace(/'/g, "")
        .replace(/\./g, "")
        .replace(/\s+/g, "-");

      try {
        // Try the main Pokémon endpoint first
        let url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(rawName)}`;
        let { data } = await axios.get(url);

        // Use official artwork if available
        let image = data.sprites?.other?.["official-artwork"]?.front_default
          || data.sprites?.front_default;

        // If no image, check forms for regional variants
        if (!image && data.forms?.length > 0) {
          for (const form of data.forms) {
            const formData = await axios.get(form.url);
            image = formData.data.sprites?.other?.["official-artwork"]?.front_default
              || formData.data.sprites?.front_default;
            if (image) break;
          }
        }

        const types = data.types?.map(t => t.type.name) || [];

        return { name: data.name, reason: p.reason, types, image };

      } catch {
        // Fallback: keep original name and reason, empty types/image
        return { name: p.name, reason: p.reason, types: p.types || [], image: null };
      }
    }));


        res.json({ team: enriched, rawModelOutput: raw });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message, details: err?.response?.data || null });
      }
    });


app.listen(process.env.PORT || 4000, () => {
  console.log("Listening on port", process.env.PORT || 4000);
});
