# Design Guidelines: Sänsa Learn Educational Platform

## Design Approach

**Selected Approach:** Design System (Material Design influenced) + Educational Platform References

**Justification:** This is a utility-focused, information-dense educational platform where clarity, learnability, and efficiency are paramount. Drawing inspiration from Google Classroom's clean organization, Khan Academy's approachable interface, and Duolingo's mobile-first design patterns.

**Core Principles:**
- Clarity over decoration
- Accessibility for diverse student age groups (Class 5-12, NEET/JEE)
- Efficient information hierarchy
- Mobile-first responsive design
- Support for bilingual content (Hindi/English)

---

## Typography System

**Font Families:**
- Primary: Inter (Google Fonts) - for UI elements, body text, navigation
- Secondary: Poppins (Google Fonts) - for headings, emphasis, section titles

**Hierarchy:**
- Page Titles: text-3xl font-bold (Poppins)
- Section Headers: text-2xl font-semibold (Poppins)
- Card Titles: text-lg font-semibold (Inter)
- Body Text: text-base font-normal (Inter)
- Captions/Meta: text-sm font-medium (Inter)
- Labels: text-xs font-medium uppercase tracking-wide (Inter)

---

## Layout System

**Spacing Primitives (Tailwind):**
Primary scale: 2, 4, 8, 12, 16, 20
- Micro spacing: p-2, gap-2 (8px) - tight elements, badges
- Standard spacing: p-4, gap-4 (16px) - cards, form fields
- Section spacing: p-8, py-12 (32px, 48px) - containers, sections
- Large spacing: py-16, py-20 (64px, 80px) - page sections

**Container Structure:**
- Max width: max-w-7xl mx-auto px-4
- Mobile padding: px-4
- Desktop padding: px-6 lg:px-8
- Card containers: rounded-xl with p-6

**Grid Systems:**
- Subject cards: grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
- Test list: grid grid-cols-1 gap-4
- Leaderboard: Single column with dividers
- Banner carousel: Horizontal scroll with snap-scroll

---

## Component Library

### Navigation
**Bottom Tab Bar (Mobile Primary):**
- Fixed bottom navigation: fixed bottom-0 w-full
- 5 equal-width tabs with icons above labels
- Active state: icon filled, label font-semibold
- Icon size: w-6 h-6
- Tab height: h-16
- Use Heroicons for all navigation icons

**Top Header:**
- Logo (left): h-8 object-contain
- Title: text-xl font-semibold
- Actions (right): notification bell, search icon
- Height: h-14
- Shadow on scroll: shadow-sm

### Cards & Content Blocks

**Subject Cards:**
- Rounded-xl with p-6
- Icon at top (w-12 h-12)
- Subject name: text-lg font-semibold
- Material count badge: text-xs px-2 py-1 rounded-full
- Hover: subtle scale transform (scale-105)

**Study Material Cards:**
- Horizontal layout for lists
- Icon/thumbnail (left): w-16 h-16 rounded-lg
- Title + metadata stack (right)
- Download/view button (far right)
- Border-b divider between items

**Test Cards:**
- Prominent title: text-xl font-bold
- Metadata row: duration, questions, status badges
- Start/View Results button: w-full mt-4
- Score display: Large text-4xl font-bold with circular progress indicator

**Announcement Cards:**
- Full-width with border-l-4 accent
- Icon badge (top-left)
- Title: text-base font-semibold
- Timestamp: text-xs
- Dismissible close button

### Forms & Inputs

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border: border-2 rounded-lg
- Focus: ring-2 offset-2
- Labels: text-sm font-medium mb-2

**Dropdowns/Selects:**
- Same styling as inputs
- Chevron icon (right)
- Dropdown menu: rounded-lg shadow-lg with max-h-60 overflow-y-auto

**Buttons:**
- Primary: h-12 px-6 rounded-lg font-semibold
- Secondary: Same with border-2
- Icon buttons: w-10 h-10 rounded-full
- Small: h-9 px-4 text-sm

**File Upload:**
- Dashed border area with upload icon
- Drag-and-drop zone: min-h-32
- File preview list below with remove buttons

### Test Interface

**Question Display:**
- Question number badge: Circular, text-lg
- Question text: text-lg leading-relaxed mb-4
- Options: 4 radio buttons in vertical stack, each p-4 rounded-lg border-2
- Selected state: border accent, background tint
- Navigation: Previous/Next buttons + grid overview

**Timer Display:**
- Fixed top-right: text-2xl font-mono font-bold
- Icon: Clock (Heroicons)
- Warning state when < 10 minutes

**Answer Grid Overview:**
- Grid layout: grid-cols-5 gap-2
- Each cell: w-10 h-10 rounded
- States: Answered (filled), Unattempted (outline), Current (ring)

### Chat Interface

**Message Bubbles:**
- Sender: ml-auto, max-w-[70%], rounded-2xl rounded-tr-sm
- Receiver: mr-auto, max-w-[70%], rounded-2xl rounded-tl-sm
- Padding: px-4 py-2
- Timestamp: text-xs below message

**Input Area:**
- Fixed bottom (above tab bar on mobile)
- Height: min-h-12
- Attachment buttons (left): Camera, Image, Emoji
- Text input: flex-1
- Send button (right): rounded-full w-10 h-10

**Group List:**
- Avatar (left): w-12 h-12 rounded-full
- Group name + last message preview
- Unread badge (right): rounded-full with count
- Divider: border-b

### Profile & Settings

**Profile Header:**
- Avatar: w-24 h-24 rounded-full mx-auto
- Edit icon overlay on avatar
- Name: text-2xl font-bold text-center
- Username: text-sm

**Info Sections:**
- Label-value pairs in rows
- Edit icon buttons aligned right
- Dividers between sections: space-y-4

### Admin Controls

**Upload Modals:**
- Full-screen overlay on mobile
- Centered card on desktop: max-w-2xl
- Step indicator for multi-step uploads
- Progress bars for file uploads

**Content Management:**
- Table view with sortable columns
- Action buttons: Edit, Delete icons
- Bulk selection checkboxes
- Pagination at bottom

---

## Special Considerations

### Bilingual Support
- Use appropriate font rendering for Devanagari script (Hindi)
- Ensure adequate line-height for Hindi text (1.75)
- Language toggle: Prominent in header or profile

### Mobile Optimization
- Touch targets minimum: 44px (h-11)
- Swipe gestures for navigation where appropriate
- Collapsible sections for long content
- Bottom sheet modals instead of centered overlays

### Accessibility
- Consistent focus states with ring-2
- Sufficient contrast ratios
- Icon + text labels (not icon-only)
- Skip navigation links
- ARIA labels for interactive elements

### Performance
- Lazy load images and media
- Virtual scrolling for long lists (tests, materials)
- Skeleton loaders during data fetch
- Optimistic UI updates for chat

---

## Images

**Logo:** 
- Placement: Top-left of header
- Size: h-8 to h-10
- Format: SVG or PNG with transparent background

**Profile Photos:**
- Circular avatars throughout
- Sizes: w-8 h-8 (small), w-12 h-12 (medium), w-24 h-24 (large profile)
- Default placeholder: User initials on solid background

**Banner Section (Home):**
- Horizontal scrollable carousel
- Image dimensions: 16:9 aspect ratio
- Width: Full container minus padding
- Height: h-48 on mobile, h-64 on desktop
- Rounded-xl with snap-scroll behavior

**Study Materials:**
- PDF icon for documents
- Video thumbnail for videos
- Generic file icons for other formats
- Size: w-16 h-16 in list view

**No large hero images** - This is a utility app, not a marketing site. Focus on functional, information-dense layouts.