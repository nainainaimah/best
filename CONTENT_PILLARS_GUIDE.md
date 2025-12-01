# Content Pillars System

## Overview

PostMuse now uses a **Content Pillars** system instead of hardcoded categories. This allows users to define their own content types that match their brand and strategy.

## What Changed

### Before (Hardcoded Categories)
- Fixed list of 10 categories (Listing, Quote, Tip, etc.)
- Same categories for all users regardless of industry
- No visual distinction in grid mode
- Limited pattern logic

### After (User-Defined Content Pillars)
- Users define their own content pillars in Settings
- Each pillar has a unique color for visual identification
- Pillars are used in Create Post as categories
- Pattern Mode uses pillars to create meaningful grid layouts

## Key Features

### 1. Pillar Management (Profile Settings → Content Tab)

Users can:
- Add custom content pillars (e.g., "Educational", "Behind the Scenes", "Product Launch")
- Assign colors to each pillar
- Remove pillars they don't use
- See a visual preview of their pillar system

### 2. Automatic Migration

- Existing string-based pillars are automatically migrated to the new format
- Fallback to POST_CATEGORIES if no pillars are defined
- Backward compatible with existing data

### 3. Create Post Integration

When creating a post:
- Category dropdown now shows "Content Pillar"
- Only displays user-defined pillars (or defaults)
- Clear explanation of what pillars are used for
- Link to Settings if no pillars are defined

### 4. Grid Pattern Mode

In the Grid Planner:
- Posts are color-coded by their pillar
- Pattern logic can organize posts by pillar type
- Visual coherence across the grid

## Technical Implementation

### New Types

```typescript
export type ContentPillar = {
  id: string;        // Slugified name (e.g., "behind-the-scenes")
  name: string;      // Display name (e.g., "Behind the Scenes")
  color: string;     // Hex color (e.g., "#6366F1")
  description?: string;
};
```

### Profile Type Update

```typescript
export type Profile = {
  // ... other fields
  content_pillars: ContentPillar[] | string[]; // Supports both v1 and v2
};
```

### Utility Functions (`lib/pillarUtils.ts`)

- `getContentPillars(profile)` - Get pillars with fallback to defaults
- `migratePillars(pillars)` - Convert string[] to ContentPillar[]
- `createPillar(name, existingPillars)` - Create new pillar with auto-color
- `getPillarColor(pillarId, pillars)` - Get color for a pillar
- `getPillar(pillarId, pillars)` - Get full pillar object
- `updatePillarColor(pillars, pillarId, newColor)` - Change pillar color
- `addPillar(pillars, name)` - Add new pillar to list
- `removePillar(pillars, pillarId)` - Remove pillar from list

### Color Palette

Default pillar colors (auto-assigned in order):
1. #6366F1 (Indigo)
2. #EC4899 (Pink)
3. #8B5CF6 (Purple)
4. #F59E0B (Amber)
5. #10B981 (Emerald)
6. #3B82F6 (Blue)
7. #EF4444 (Red)
8. #14B8A6 (Teal)
9. #F97316 (Orange)
10. #06B6D4 (Cyan)
11. #84CC16 (Lime)
12. Plus more...

## Usage Examples

### In Profile Settings

```tsx
import { getContentPillars, createPillar, migratePillars } from '@/lib/pillarUtils';

// Get current pillars
const pillars = migratePillars(profile.content_pillars || []);

// Add new pillar
const newPillar = createPillar('Educational Content', pillars);

// Update profile
setProfile({
  ...profile,
  content_pillars: [...pillars, newPillar]
});
```

### In Create Post

```tsx
import { getContentPillars } from '@/lib/pillarUtils';

// Get user's pillars (with fallback)
const pillars = getContentPillars(profile);

// Display in dropdown
<select value={category} onChange={(e) => setCategory(e.target.value)}>
  <option value="">Select content pillar</option>
  {pillars.map(pillar => (
    <option key={pillar.id} value={pillar.id}>
      {pillar.name}
    </option>
  ))}
</select>
```

### In Grid Mode

```tsx
import { getPillarColor } from '@/lib/pillarUtils';

// Get pillar color for a post
const color = getPillarColor(post.category, pillars);

// Apply color to grid item
<div style={{ backgroundColor: color }}>
  {pillar.name}
</div>
```

## Database Schema

The `content_pillars` field in the profiles table is JSONB and can contain:

### V1 Format (Legacy)
```json
["Educational", "Behind the Scenes", "Product Launch"]
```

### V2 Format (Current)
```json
[
  {
    "id": "educational",
    "name": "Educational",
    "color": "#6366F1",
    "description": ""
  },
  {
    "id": "behind-the-scenes",
    "name": "Behind the Scenes",
    "color": "#EC4899",
    "description": ""
  }
]
```

Both formats are supported through automatic migration.

## Migration Strategy

The system automatically migrates string[] to ContentPillar[]:

1. Loads profile from database
2. Checks if first pillar is object or string
3. If string array, converts to ContentPillar[]
4. Assigns colors from default palette
5. Generates IDs from slugified names

No database migration needed - happens at runtime!

## User Benefits

### For Content Creators
- Define pillars that match their niche (fitness, fashion, tech, etc.)
- Visual organization with color-coded posts
- Better planning with pillar-based patterns

### For Brands
- Align pillars with brand strategy
- Track content distribution across pillars
- Maintain consistent content mix

### For Agencies
- Different pillar sets for different clients
- Industry-specific templates
- Professional appearance with cohesive grids

## Future Enhancements

Potential improvements:
- Pillar analytics (posts per pillar, engagement by pillar)
- Preset pillar templates for industries
- Pillar-based scheduling rules
- Pattern templates that use specific pillars
- Pillar performance insights
- Bulk pillar operations

## Best Practices

1. **Keep it Simple**: 3-5 pillars is optimal
2. **Be Specific**: "Product Launch" > "Content"
3. **Use Colors Wisely**: Choose distinct colors for easy recognition
4. **Align with Strategy**: Pillars should match your content strategy
5. **Review Regularly**: Update pillars as your strategy evolves

## Troubleshooting

### Pillars not showing in Create Post
- Verify pillars are defined in Settings → Content tab
- Check that profile.content_pillars is not empty
- Ensure profile is loaded before rendering dropdown

### Colors not displaying
- Check that pillar.color is a valid hex color
- Verify pillar ID matches the post.category value
- Ensure contentPillars prop is passed to grid component

### Migration issues
- Old string arrays are automatically migrated
- No manual intervention needed
- Colors are auto-assigned on first load

## Related Files

- `/lib/types.ts` - ContentPillar type definition
- `/lib/pillarUtils.ts` - Utility functions
- `/lib/constants.ts` - Default colors and POST_CATEGORIES fallback
- `/app/[locale]/profile/page.tsx` - Pillar management UI
- `/app/[locale]/post/[id]/page.tsx` - Pillar selection in Create Post
- `/app/[locale]/grid/page.tsx` - Pillar-based grid display

## Support

For questions or issues with the Content Pillars system, check:
1. This guide for usage instructions
2. `/lib/pillarUtils.ts` for implementation details
3. The component files listed above for examples
