// Content Pillar Utilities
import type { ContentPillar, Profile, Post, PillarAnalytics, ContentBalance } from './types';
import { POST_CATEGORIES } from './constants';

/**
 * Default color palette for content pillars
 * These colors are visually distinct and work well in grid layouts
 */
const DEFAULT_PILLAR_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

/**
 * Convert a string to a URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Migrate legacy string[] content pillars to ContentPillar[]
 */
export function migratePillars(pillars: string[] | ContentPillar[]): ContentPillar[] {
  // If already migrated (first item has 'id' property), return as-is
  if (pillars.length > 0 && typeof pillars[0] === 'object' && 'id' in pillars[0]) {
    const migratedPillars = pillars as ContentPillar[];
    // Ensure all pillars have orderIndex
    return migratedPillars.map((p, index) => ({
      ...p,
      orderIndex: p.orderIndex ?? index,
    }));
  }

  // Convert string[] to ContentPillar[]
  return (pillars as string[]).map((name, index) => ({
    id: slugify(name),
    name: name,
    color: DEFAULT_PILLAR_COLORS[index % DEFAULT_PILLAR_COLORS.length],
    description: '',
    orderIndex: index,
  }));
}

/**
 * Get content pillars from profile with automatic migration
 * Falls back to POST_CATEGORIES if no pillars defined
 */
export function getContentPillars(profile: Profile | null): ContentPillar[] {
  if (!profile || !profile.content_pillars || profile.content_pillars.length === 0) {
    // Fallback to POST_CATEGORIES as ContentPillars
    return POST_CATEGORIES.map((cat, index) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || DEFAULT_PILLAR_COLORS[index % DEFAULT_PILLAR_COLORS.length],
      description: cat.description,
      orderIndex: index,
    }));
  }

  const pillars = migratePillars(profile.content_pillars);
  return sortPillarsByOrder(pillars);
}

/**
 * Create a new content pillar with auto-generated color
 */
export function createPillar(name: string, existingPillars: ContentPillar[] = []): ContentPillar {
  const id = slugify(name);
  const colorIndex = existingPillars.length % DEFAULT_PILLAR_COLORS.length;

  return {
    id,
    name,
    color: DEFAULT_PILLAR_COLORS[colorIndex],
    description: '',
    orderIndex: existingPillars.length,
  };
}

/**
 * Get color for a pillar by ID
 */
export function getPillarColor(pillarId: string, pillars: ContentPillar[]): string {
  const pillar = pillars.find(p => p.id === pillarId);
  return pillar?.color || '#9CA3AF'; // Gray fallback
}

/**
 * Get pillar by ID
 */
export function getPillar(pillarId: string, pillars: ContentPillar[]): ContentPillar | undefined {
  return pillars.find(p => p.id === pillarId);
}

/**
 * Validate pillar data
 */
export function isValidPillar(pillar: any): pillar is ContentPillar {
  return (
    typeof pillar === 'object' &&
    typeof pillar.id === 'string' &&
    typeof pillar.name === 'string' &&
    typeof pillar.color === 'string' &&
    pillar.id.length > 0 &&
    pillar.name.length > 0
  );
}

/**
 * Update pillar color
 */
export function updatePillarColor(pillars: ContentPillar[], pillarId: string, newColor: string): ContentPillar[] {
  return pillars.map(p => p.id === pillarId ? { ...p, color: newColor } : p);
}

/**
 * Add a new pillar to the list
 */
export function addPillar(pillars: ContentPillar[], name: string): ContentPillar[] {
  // Check if pillar with this name already exists
  const id = slugify(name);
  if (pillars.some(p => p.id === id)) {
    return pillars;
  }

  const newPillar = createPillar(name, pillars);
  return [...pillars, newPillar];
}

/**
 * Remove a pillar from the list
 */
export function removePillar(pillars: ContentPillar[], pillarId: string): ContentPillar[] {
  return pillars.filter(p => p.id !== pillarId);
}

/**
 * Reorder pillars and update orderIndex
 */
export function reorderPillars(pillars: ContentPillar[], fromIndex: number, toIndex: number): ContentPillar[] {
  const result = Array.from(pillars);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Update orderIndex for all pillars
  return result.map((pillar, index) => ({
    ...pillar,
    orderIndex: index,
  }));
}

/**
 * Sort pillars by orderIndex
 */
export function sortPillarsByOrder(pillars: ContentPillar[]): ContentPillar[] {
  return [...pillars].sort((a, b) => {
    const orderA = a.orderIndex ?? 999;
    const orderB = b.orderIndex ?? 999;
    return orderA - orderB;
  });
}

/**
 * Calculate pillar analytics from posts
 */
export function calculatePillarAnalytics(posts: Post[], pillars: ContentPillar[]): PillarAnalytics[] {
  const totalPosts = posts.length;

  // Count posts per pillar
  const pillarCounts = new Map<string, number>();
  posts.forEach(post => {
    if (post.category) {
      pillarCounts.set(post.category, (pillarCounts.get(post.category) || 0) + 1);
    }
  });

  // Create analytics for each pillar
  return pillars.map(pillar => ({
    pillarId: pillar.id,
    pillarName: pillar.name,
    color: pillar.color,
    count: pillarCounts.get(pillar.id) || 0,
    percentage: totalPosts > 0 ? ((pillarCounts.get(pillar.id) || 0) / totalPosts) * 100 : 0,
  }));
}

/**
 * Get content balance summary
 */
export function getContentBalance(posts: Post[], pillars: ContentPillar[]): ContentBalance {
  const analytics = calculatePillarAnalytics(posts, pillars);

  return {
    pillars: analytics,
    totalPosts: posts.length,
  };
}
