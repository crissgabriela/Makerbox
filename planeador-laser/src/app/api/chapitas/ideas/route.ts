import { NextRequest, NextResponse } from 'next/server';
import {
  AI_TEAM_IDEAS_BY_THEME,
  BadgeIconId,
  IdeaThemeId,
  TeamIdeaSuggestion,
} from '@/lib/badges-processor';

const VALID_ICONS: BadgeIconId[] = [
  'paw',
  'star',
  'bolt',
  'atom',
  'rocket',
  'heart',
  'robot',
  'shield',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const theme = (body.theme || 'animales') as IdeaThemeId;
    const customTopic = typeof body.customTopic === 'string' ? body.customTopic.trim() : '';
    const memberCount = Math.min(5, Math.max(2, Number(body.memberCount) || 4));

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      '';

    if (apiKey) {
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
      const prompt = `Eres un asistente creativo educativo de MakerBox (Universidad de Talca) para niños y jóvenes de 5° a 8° básico que están diseñando chapitas hexagonales tipo panal en equipo.
Genera exactamente 3 ideas creativas y divertidas de equipos basadas en la temática "${theme}"${
        customTopic ? ` y el interés especial "${customTopic}"` : ''
      } para un grupo de ${memberCount} integrantes.

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown ni texto extra):
[
  {
    "teamName": "Nombre corto (máx 18 caracteres)",
    "motto": "Lema breve e inspirador del equipo",
    "icons": ["paw", "star", "bolt", "atom", "rocket"],
    "sampleMemberNames": ["Apodo1", "Apodo2", "Apodo3", "Apodo4", "Apodo5"]
  }
]
Nota: "icons" solo puede usar valores dentro de: ${VALID_ICONS.join(', ')}.`;

      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
              apiKey.trim()
            )}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.85,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText =
              data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const sanitized: TeamIdeaSuggestion[] = parsed.slice(0, 3).map((item) => ({
                teamName: String(item.teamName || 'Equipo Maker').slice(0, 22),
                motto: String(item.motto || 'Conectados como un panal'),
                icons: Array.isArray(item.icons)
                  ? item.icons
                      .map((ic: string) =>
                        VALID_ICONS.includes(ic as BadgeIconId)
                          ? (ic as BadgeIconId)
                          : 'star'
                      )
                      .concat(VALID_ICONS)
                      .slice(0, 5)
                  : VALID_ICONS.slice(0, 5),
                sampleMemberNames: Array.isArray(item.sampleMemberNames)
                  ? item.sampleMemberNames.map((n: string) => String(n).slice(0, 12)).slice(0, 5)
                  : ['Alex', 'Sofi', 'Max', 'Vale', 'Leo'],
              }));

              return NextResponse.json({
                ideas: sanitized,
                agentUsed: `Google Gemini (${model})`,
                liveAi: true,
              });
            }
          }
        } catch {
          // Intentar siguiente modelo o fallback local
        }
      }
    }

    const fallbackIdeas = AI_TEAM_IDEAS_BY_THEME[theme] ?? AI_TEAM_IDEAS_BY_THEME.animales;
    return NextResponse.json({
      ideas: fallbackIdeas,
      agentUsed: 'Banco Creativo MakerBox IA (Modo Instantáneo)',
      liveAi: false,
    });
  } catch {
    return NextResponse.json({
      ideas: AI_TEAM_IDEAS_BY_THEME.animales,
      agentUsed: 'Banco Creativo MakerBox IA',
      liveAi: false,
    });
  }
}
