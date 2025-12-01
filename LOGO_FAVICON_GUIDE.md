# Logo & Favicon Setup Guide

## Overview

PostMuse now has proper branding with logo and favicon support throughout the application.

## Favicon

The favicon is configured in `/app/layout.tsx` using Next.js metadata API. It supports multiple sizes:

- `/favicon.ico` - Standard browser favicon
- `/icons/favicon-16x16.png` - 16x16 favicon
- `/icons/favicon-32x32.png` - 32x32 favicon
- `/icons/apple-touch-icon.png` - Apple device icon (180x180)

### Current Implementation

A placeholder SVG favicon has been created at `/public/favicon.svg` with:
- PostMuse brand colors (primary: #6366F1, accent: #EC4899)
- Simple, recognizable design
- Scalable vector format

### To Replace with Custom Favicon

1. Design your favicon (minimum 32x32, recommended 512x512)
2. Generate multiple sizes using a favicon generator (e.g., https://realfavicongenerator.net/)
3. Place files in `/public/` and `/public/icons/` directories
4. Update paths in `/app/layout.tsx` if needed

## Logo Component

Location: `/components/Logo.tsx`

### Features

- **Responsive**: Shows icon only or icon + text
- **Brand-aware**: Uses user's brand colors from profile
- **Clickable**: Links back to dashboard
- **Flexible**: Can be customized via props

### Usage

```tsx
import Logo from '@/components/Logo';

// Full logo with text
<Logo
  locale="en"
  brandColor="#6366F1"
  showText={true}
/>

// Icon only
<Logo
  locale="en"
  brandColor="#6366F1"
  showText={false}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `locale` | string | 'en' | Current locale for navigation |
| `className` | string | '' | Additional CSS classes |
| `showText` | boolean | true | Whether to show "PostMuse.ai" text |
| `brandColor` | string | '#6366F1' | Brand color from user profile |

### Current Logo Design

The current implementation uses a simple text-based logo with:
- Initials "PM" in a colored box
- "PostMuse" text with ".ai" suffix
- Adapts to user's brand colors

### To Replace with Custom Logo

1. **Option A: Update the Logo component**
   - Replace the `PM` text with an `<Image>` component
   - Place your logo image in `/public/logo.png`
   - Update `/components/Logo.tsx`:

```tsx
import Image from 'next/image';

export default function Logo({ ... }) {
  return (
    <Link href={`/${locale}/dashboard`}>
      <Image
        src="/logo.png"
        alt="PostMuse"
        width={40}
        height={40}
      />
      {showText && <span>PostMuse.ai</span>}
    </Link>
  );
}
```

2. **Option B: Use SVG logo**
   - Create your logo as an SVG component
   - Import and use it in the Logo component

## Where Logo Appears

Currently implemented in:
- ✅ Dashboard (`/app/[locale]/dashboard/page.tsx`)

To be added to:
- ⏳ Grid Planner page
- ⏳ Profile/Settings page
- ⏳ Create Post page
- ⏳ Calendar page

## Best Practices

1. **Favicon Requirements**:
   - Simple design (recognizable at 16x16)
   - High contrast
   - Avoid fine details
   - Test on both light and dark browser themes

2. **Logo Requirements**:
   - Scalable vector format (SVG) preferred
   - Multiple sizes for different contexts
   - Transparent background
   - Looks good on both light and dark backgrounds

3. **Brand Consistency**:
   - Use colors from user's brand colors when possible
   - Maintain consistent proportions across devices
   - Ensure readability at all sizes

## Troubleshooting

### Favicon not appearing

- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check that files exist in `/public/` directory
- Verify metadata in `/app/layout.tsx` has correct paths

### Logo not displaying

- Check that `/components/Logo.tsx` exists
- Verify component is imported in the page
- Ensure locale and brandColor props are passed correctly

### Logo colors not updating

- Confirm user profile has brand_colors set
- Check that brandColor prop is being passed from profile data
- Verify CSS style is not being overridden
