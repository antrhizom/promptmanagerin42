import { Prompt } from '@/lib/types';
import { ROLLEN, BILDUNGSSTUFEN, ANWENDUNGSFAELLE, OUTPUT_FORMATE } from '@/lib/constants';

export interface UserActivity {
  code: string;
  displayName: string;
  bewertungen: number;
  kommentare: number;
  kopien: number;
  total: number;
}

export interface Stats {
  totalPrompts: number;
  totalUsers: number;
  totalRatings: number;
  totalUsage: number;
  totalComments: number;
  promptsPerFormat: { name: string; count: number }[];
  promptsPerPlatform: { name: string; count: number }[];
  topModels: { name: string; count: number }[];
  promptsPerUseCase: { name: string; count: number }[];
  promptsPerRole: { name: string; count: number }[];
  promptsPerLevel: { name: string; count: number }[];
  topUsers: UserActivity[];
  topRated: { id: string; titel: string; rating: number }[];
  topUsed: { id: string; titel: string; usage: number }[];
  topTags: { name: string; count: number }[];
}

export function calculateStats(prompts: Prompt[], userNames?: Record<string, string>): Stats {
  const totalPrompts = prompts.length;
  const totalUsers = new Set(prompts.map(p => p.erstelltVon)).size;
  const totalRatings = prompts.reduce((sum, p) =>
    sum + Object.values(p.bewertungen || {}).reduce((s, v) => s + v, 0), 0);
  const totalUsage = prompts.reduce((sum, p) => sum + (p.nutzungsanzahl || 0), 0);
  const totalComments = prompts.reduce((sum, p) => sum + (p.kommentare?.length || 0), 0);

  // Per format
  const formatCounts: Record<string, number> = {};
  OUTPUT_FORMATE.forEach(f => { formatCounts[f] = 0; });
  prompts.forEach(p => (p.outputFormate || []).forEach(f => {
    formatCounts[f] = (formatCounts[f] || 0) + 1;
  }));
  const promptsPerFormat = Object.entries(formatCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Per platform
  const platformCounts: Record<string, number> = {};
  prompts.forEach(p => Object.keys(p.plattformenUndModelle || {}).forEach(plat => {
    platformCounts[plat] = (platformCounts[plat] || 0) + 1;
  }));
  const promptsPerPlatform = Object.entries(platformCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Top models
  const modelCounts: Record<string, number> = {};
  prompts.forEach(p => Object.values(p.plattformenUndModelle || {}).forEach(models => {
    (models || []).forEach(m => { modelCounts[m] = (modelCounts[m] || 0) + 1; });
  }));
  const topModels = Object.entries(modelCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Per use case
  const allCases = Object.values(ANWENDUNGSFAELLE).flat();
  const caseCounts: Record<string, number> = {};
  allCases.forEach(c => { caseCounts[c] = 0; });
  prompts.forEach(p => (p.anwendungsfaelle || []).forEach(a => {
    caseCounts[a] = (caseCounts[a] || 0) + 1;
  }));
  const promptsPerUseCase = Object.entries(caseCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Per role - unterstützt komma-getrennte Rollen (Multi-Select)
  const roleCounts: Record<string, number> = {};
  ROLLEN.forEach(r => { roleCounts[r] = 0; });
  prompts.forEach(p => {
    const rolle = p.erstelltVonRolle || '';
    if (rolle) {
      const rollen = rolle.includes(',') ? rolle.split(',').map(r => r.trim()) : [rolle];
      rollen.forEach(r => {
        roleCounts[r] = (roleCounts[r] || 0) + 1;
      });
    }
  });
  const promptsPerRole = Object.entries(roleCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Per education level - unterstützt komma-getrennte Bildungsstufen (Multi-Select)
  const levelCounts: Record<string, number> = {};
  BILDUNGSSTUFEN.forEach(b => { levelCounts[b] = 0; });
  prompts.forEach(p => {
    const stufe = p.bildungsstufe || '';
    if (stufe) {
      const stufen = stufe.includes(',') ? stufe.split(',').map(s => s.trim()) : [stufe];
      stufen.forEach(s => {
        levelCounts[s] = (levelCounts[s] || 0) + 1;
      });
    }
  });
  const promptsPerLevel = Object.entries(levelCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Top users - mit detaillierten Aktivitäten (ohne Prompts, da nur Admins erstellen)
  const userBewertungen: Record<string, number> = {};
  const userKommentare: Record<string, number> = {};
  const userKopien: Record<string, number> = {};
  // Code→Name Zuordnung aus Kommentaren erstellen
  const codeToName: Record<string, string> = { ...(userNames || {}) };

  prompts.forEach(p => {
    const user = p.erstelltVon;
    // Bewertungen auf Prompts des Erstellers
    const ratings = Object.values(p.bewertungen || {}).reduce((s, v) => s + v, 0);
    userBewertungen[user] = (userBewertungen[user] || 0) + ratings;
    // Kommentare geschrieben (pro Kommentarverfasser) + Namen sammeln
    (p.kommentare || []).forEach(k => {
      userKommentare[k.userCode] = (userKommentare[k.userCode] || 0) + 1;
      if (k.userName && !codeToName[k.userCode]) {
        codeToName[k.userCode] = k.userName;
      }
    });
    // Kopien (Nutzungsanzahl)
    userKopien[user] = (userKopien[user] || 0) + (p.nutzungsanzahl || 0);
  });

  const allUserCodes = new Set([
    ...Object.keys(userBewertungen),
    ...Object.keys(userKommentare),
    ...Object.keys(userKopien),
  ]);

  const topUsers: UserActivity[] = Array.from(allUserCodes).map(code => {
    const b = userBewertungen[code] || 0;
    const k = userKommentare[code] || 0;
    const ko = userKopien[code] || 0;
    return {
      code,
      displayName: codeToName[code] || code,
      bewertungen: b,
      kommentare: k,
      kopien: ko,
      total: b + k + ko,
    };
  })
    .filter(u => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Top rated
  const topRated = [...prompts]
    .map(p => ({
      id: p.id,
      titel: p.titel,
      rating: Object.values(p.bewertungen || {}).reduce((s, v) => s + v, 0)
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // Top used
  const topUsed = [...prompts]
    .map(p => ({ id: p.id, titel: p.titel, usage: p.nutzungsanzahl || 0 }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

  // Top tags
  const tagCounts: Record<string, number> = {};
  prompts.forEach(p => (p.tags || []).forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  }));
  const topTags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    totalPrompts, totalUsers, totalRatings, totalUsage, totalComments,
    promptsPerFormat, promptsPerPlatform, topModels,
    promptsPerUseCase, promptsPerRole, promptsPerLevel,
    topUsers, topRated, topUsed, topTags
  };
}
