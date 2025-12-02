// Pattern Engine v2 - Pillar-Aware Grid Layout Logic
import type { Post, ContentPillar, PatternTemplate } from './types';

/**
 * Apply a pattern template to a list of posts
 * Handles pillar matching, soft-fill, and overfill gracefully
 */
export function applyPatternTemplate(
  posts: Post[],
  template: PatternTemplate,
  pillars: ContentPillar[],
  gridSize: number = 9
): Post[] {
  // If no template or posts, return posts as-is
  if (!template.template || template.template.length === 0 || posts.length === 0) {
    return posts;
  }

  // Group posts by pillar ID
  const postsByPillar = groupPostsByPillar(posts, pillars);

  // Map template slots to posts
  const arrangedPosts: Post[] = [];
  const usedPostIds = new Set<string>();

  // Process each slot in the template
  for (let i = 0; i < Math.min(template.template.length, gridSize); i++) {
    const requiredPillarId = template.template[i];

    // Try to find a post for this pillar
    const post = findNextPost(requiredPillarId, postsByPillar, usedPostIds, pillars);

    if (post) {
      arrangedPosts.push(post);
      usedPostIds.add(post.id);
    }
  }

  // Handle overfill: Add remaining posts that weren't used
  const remainingPosts = posts.filter(p => !usedPostIds.has(p.id));
  arrangedPosts.push(...remainingPosts);

  return arrangedPosts;
}

/**
 * Group posts by their pillar ID
 */
function groupPostsByPillar(
  posts: Post[],
  pillars: ContentPillar[]
): Map<string, Post[]> {
  const grouped = new Map<string, Post[]>();

  // Initialize with empty arrays for all pillars
  pillars.forEach(pillar => {
    grouped.set(pillar.id, []);
  });

  // Group posts
  posts.forEach(post => {
    if (post.category) {
      const existing = grouped.get(post.category) || [];
      grouped.set(post.category, [...existing, post]);
    } else {
      // Posts without pillar go to 'unassigned'
      const existing = grouped.get('unassigned') || [];
      grouped.set('unassigned', [...existing, post]);
    }
  });

  return grouped;
}

/**
 * Find next post for a required pillar with fallback logic
 * Implements soft-fill when pillar is exhausted
 */
function findNextPost(
  requiredPillarId: string,
  postsByPillar: Map<string, Post[]>,
  usedPostIds: Set<string>,
  pillars: ContentPillar[]
): Post | null {
  // Try to get a post from the required pillar
  const pillarPosts = postsByPillar.get(requiredPillarId) || [];
  const availablePost = pillarPosts.find(p => !usedPostIds.has(p.id));

  if (availablePost) {
    return availablePost;
  }

  // Soft-fill: Try to find from similar/related pillars or any pillar
  // First try unassigned posts
  const unassignedPosts = postsByPillar.get('unassigned') || [];
  const unassignedPost = unassignedPosts.find(p => !usedPostIds.has(p.id));

  if (unassignedPost) {
    return unassignedPost;
  }

  // Then try any other pillar
  for (const [pillarId, posts] of postsByPillar.entries()) {
    if (pillarId !== requiredPillarId && pillarId !== 'unassigned') {
      const post = posts.find(p => !usedPostIds.has(p.id));
      if (post) {
        return post;
      }
    }
  }

  return null;
}

/**
 * Generate a dynamic balanced pattern based on user's pillars
 */
export function generateBalancedPattern(
  pillars: ContentPillar[],
  gridSize: number = 9
): string[] {
  if (pillars.length === 0) {
    return [];
  }

  const pattern: string[] = [];
  let pillarIndex = 0;

  for (let i = 0; i < gridSize; i++) {
    pattern.push(pillars[pillarIndex % pillars.length].id);
    pillarIndex++;
  }

  return pattern;
}

/**
 * Generate a row-theme pattern (each row is one pillar)
 */
export function generateRowThemePattern(
  pillars: ContentPillar[],
  columns: number = 3,
  rows: number = 3
): string[] {
  const pattern: string[] = [];

  for (let row = 0; row < rows; row++) {
    const pillar = pillars[row % pillars.length];
    for (let col = 0; col < columns; col++) {
      pattern.push(pillar.id);
    }
  }

  return pattern;
}

/**
 * Generate a column-theme pattern (each column is one pillar)
 */
export function generateColumnThemePattern(
  pillars: ContentPillar[],
  columns: number = 3,
  rows: number = 3
): string[] {
  const pattern: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const pillar = pillars[col % pillars.length];
      pattern.push(pillar.id);
    }
  }

  return pattern;
}

/**
 * Validate that a pattern template can be applied to the current posts
 * Returns warnings if there are mismatches
 */
export function validatePattern(
  posts: Post[],
  template: PatternTemplate,
  pillars: ContentPillar[]
): {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Count posts per pillar
  const postCounts = new Map<string, number>();
  posts.forEach(post => {
    if (post.category) {
      postCounts.set(post.category, (postCounts.get(post.category) || 0) + 1);
    }
  });

  // Count required slots per pillar in template
  const requiredCounts = new Map<string, number>();
  template.template.forEach(pillarId => {
    requiredCounts.set(pillarId, (requiredCounts.get(pillarId) || 0) + 1);
  });

  // Check for mismatches
  requiredCounts.forEach((required, pillarId) => {
    const available = postCounts.get(pillarId) || 0;

    if (available < required) {
      const pillar = pillars.find(p => p.id === pillarId);
      const pillarName = pillar?.name || pillarId;
      warnings.push(
        `Pattern requires ${required} "${pillarName}" posts but only ${available} available`
      );
      suggestions.push(
        `Create ${required - available} more "${pillarName}" posts or choose a different pattern`
      );
    }
  });

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

/**
 * Get a pattern template with dynamic template filled in based on user pillars
 */
export function getPatternTemplate(
  templateId: string,
  pillars: ContentPillar[],
  baseTemplates: PatternTemplate[]
): PatternTemplate | null {
  const template = baseTemplates.find(t => t.id === templateId);

  if (!template) {
    return null;
  }

  // If template already has a pattern defined, return as-is
  if (template.template.length > 0) {
    return template;
  }

  // Generate dynamic pattern based on template type
  let generatedTemplate: string[] = [];

  switch (templateId) {
    case 'balanced-mix':
      generatedTemplate = generateBalancedPattern(pillars, 9);
      break;
    case 'row-theme':
      generatedTemplate = generateRowThemePattern(pillars, 3, 3);
      break;
    case 'column-theme':
      generatedTemplate = generateColumnThemePattern(pillars, 3, 3);
      break;
    default:
      generatedTemplate = generateBalancedPattern(pillars, 9);
  }

  return {
    ...template,
    template: generatedTemplate,
  };
}
