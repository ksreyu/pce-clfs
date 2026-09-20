interface MatchInput {
  category: string;
  name: string;
  location: string;
  date: string;
  color?: string;
  brand?: string;
  model?: string;
  description: string;
  identifyingFeatures?: string;
}

const CATEGORY_SIMILARITY: Record<string, string[]> = {
  'Electronics': ['Electronics'],
  'Books': ['Books'],
  'Bags': ['Bags'],
  'Wallets': ['Wallets'],
  'ID Cards': ['ID Cards'],
  'Keys': ['Keys'],
  'Clothing': ['Clothing'],
  'Accessories': ['Accessories'],
  'Documents': ['Documents'],
  'Stationery': ['Stationery'],
  'Other': ['Other'],
};

const LOCATION_SIMILARITY: Record<string, string[]> = {
  'Library': ['Library', 'Reading Hall', 'Study Room'],
  'Cafeteria': ['Cafeteria', 'Canteen', 'Food Court'],
  'Lecture Hall A': ['Lecture Hall A', 'Block A'],
  'Lecture Hall B': ['Lecture Hall B', 'Block B'],
  'Computer Lab': ['Computer Lab', 'IT Lab'],
  'Sports Complex': ['Sports Complex', 'Gym', 'Playground'],
  'Parking Lot': ['Parking Lot', 'Parking'],
  'Hostel': ['Hostel', 'Dormitory'],
  'Admin Building': ['Admin Building', 'Office'],
  'Grounds': ['Grounds', 'Campus Grounds'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function calculateTextSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateCategoryScore(cat1: string, cat2: string): number {
  if (cat1.toLowerCase() === cat2.toLowerCase()) return 1;
  const similar1 = CATEGORY_SIMILARITY[cat1] || [cat1];
  const similar2 = CATEGORY_SIMILARITY[cat2] || [cat2];
  const overlap = similar1.filter(c => similar2.includes(c));
  return overlap.length > 0 ? 0.8 : 0;
}

function calculateLocationScore(loc1: string, loc2: string): number {
  if (loc1.toLowerCase() === loc2.toLowerCase()) return 1;
  const similar1 = LOCATION_SIMILARITY[loc1] || [loc1];
  const similar2 = LOCATION_SIMILARITY[loc2] || [loc2];
  const overlap = similar1.filter(l => similar2.includes(l));
  if (overlap.length > 0) return 0.8;
  const tokens1 = tokenize(loc1);
  const tokens2 = tokenize(loc2);
  const commonTokens = tokens1.filter(t => tokens2.includes(t));
  return commonTokens.length > 0 ? 0.4 : 0;
}

function calculateDateScore(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 1;
  if (diffDays <= 1) return 0.9;
  if (diffDays <= 3) return 0.7;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 14) return 0.3;
  return 0.1;
}

function calculateColorScore(c1?: string, c2?: string): number {
  if (!c1 || !c2) return 0.5;
  if (c1.toLowerCase() === c2.toLowerCase()) return 1;
  return 0;
}

function calculateBrandScore(b1?: string, b2?: string): number {
  if (!b1 || !b2) return 0.5;
  if (b1.toLowerCase() === b2.toLowerCase()) return 1;
  return 0;
}

function calculateModelScore(m1?: string, m2?: string): number {
  if (!m1 || !m2) return 0.5;
  if (m1.toLowerCase() === m2.toLowerCase()) return 1;
  return 0;
}

function calculateDescriptionScore(d1: string, d2: string, f1?: string, f2?: string): number {
  const descSim = calculateTextSimilarity(d1, d2);
  let featSim = 0;
  if (f1 && f2) {
    featSim = calculateTextSimilarity(f1, f2);
  }
  return descSim * 0.7 + featSim * 0.3;
}

export function calculateMatchScore(lost: MatchInput, found: MatchInput): { score: number; reason: string } {
  const categoryScore = calculateCategoryScore(lost.category, found.category);
  const nameScore = calculateTextSimilarity(lost.name, found.name);
  const locationScore = calculateLocationScore(lost.location, found.location);
  const dateScore = calculateDateScore(lost.date, found.date);
  const colorScore = calculateColorScore(lost.color, found.color);
  const brandScore = calculateBrandScore(lost.brand, found.brand);
  const modelScore = calculateModelScore(lost.model, found.model);
  const descScore = calculateDescriptionScore(lost.description, found.description, lost.identifyingFeatures, found.identifyingFeatures);

  const totalScore =
    categoryScore * 0.20 +
    nameScore * 0.20 +
    locationScore * 0.20 +
    dateScore * 0.15 +
    colorScore * 0.10 +
    brandScore * 0.05 +
    modelScore * 0.05 +
    descScore * 0.05;

  const score = Math.round(totalScore * 100);

  const reasons: string[] = [];
  if (categoryScore >= 0.8) reasons.push('Same category');
  if (nameScore >= 0.3) reasons.push('Similar item name');
  if (locationScore >= 0.6) reasons.push('Same/similar location');
  if (dateScore >= 0.7) reasons.push('Close date range');
  if (colorScore >= 0.8) reasons.push('Same color');
  if (brandScore >= 0.8) reasons.push('Same brand');
  if (modelScore >= 0.8) reasons.push('Same model');
  if (descScore >= 0.3) reasons.push('Similar description');

  const reason = reasons.length > 0 ? reasons.join('; ') : 'Low overall similarity';

  return { score, reason };
}

export function getMatchLevel(score: number): string {
  if (score >= 80) return 'High Match';
  if (score >= 60) return 'Possible Match';
  return 'Low Match';
}
