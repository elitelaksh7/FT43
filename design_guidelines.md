# Fintech Expense Tracking App - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern fintech leaders like Mint, YNAB, and Revolut, emphasizing clean data visualization and trustworthy financial interfaces.

## Core Design Principles
- **Trust & Security**: Professional appearance that conveys financial reliability
- **Data Clarity**: Clear hierarchy for financial information and insights
- **Progressive Disclosure**: Reveal complexity gradually through intuitive flows
- **Mobile-First**: Optimized for on-the-go expense tracking

## Color Palette
**Primary Colors:**
- Brand Primary: 220 90% 50% (vibrant blue for trust)
- Brand Secondary: 220 15% 25% (dark slate for text)

**Functional Colors:**
- Success: 142 76% 36% (green for positive transactions)
- Warning: 38 92% 50% (amber for alerts)
- Danger: 0 84% 60% (red for overspending)

**Neutral Palette:**
- Background: 220 13% 97% (light mode) / 220 13% 9% (dark mode)
- Surface: 0 0% 100% (light mode) / 220 13% 15% (dark mode)
- Text Primary: 220 15% 25% (light mode) / 220 13% 95% (dark mode)

## Typography
**Font Stack**: Inter (Google Fonts)
- **Headers**: font-bold, text-2xl to text-4xl
- **Body**: font-medium, text-base
- **Captions**: font-normal, text-sm
- **Data/Numbers**: font-mono for amounts and dates

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Tight spacing: p-2, m-2 for compact elements
- Standard spacing: p-4, gap-4 for general layout
- Generous spacing: p-6, m-6 for section separation
- Large spacing: p-8, m-8 for major layout blocks

## Component Library

### Cards & Surfaces
- **Expense Cards**: Rounded corners (rounded-xl), subtle shadows (shadow-sm), hover elevation
- **Dashboard Widgets**: Glass-morphism effect with backdrop-blur-sm
- **Transaction Items**: Clean list items with clear visual separation

### Navigation
- **Bottom Tab Bar**: Fixed mobile navigation with icon + label
- **Header**: Sticky header with app logo and user profile access
- **Floating Action Button**: Primary CTA for quick expense addition

### Forms & Inputs
- **Camera Interface**: Full-screen overlay with circular capture button
- **Upload Areas**: Dashed border drag-and-drop zones
- **Category Selection**: Tag-based interface with color coding
- **Amount Input**: Large, prominent number input with currency formatting

### Data Visualization
- **Charts**: Recharts components with brand color scheme
- **Progress Indicators**: Circular and linear progress bars for budgets
- **Spending Meters**: Visual gauge components for category limits

### Modals & Overlays
- **Transaction Confirmation**: Slide-up modal with OCR results preview
- **Edit Transaction**: Full-screen modal with form fields
- **Nudge Notifications**: Toast-style alerts with action buttons

## Interactive Elements
- **Swipe Actions**: Left/right swipe on transactions for quick actions
- **Pull-to-Refresh**: Native mobile gesture for data sync
- **Haptic Feedback**: Subtle vibrations for successful actions
- **Loading States**: Skeleton screens and progress indicators

## Visual Hierarchy
- **Financial Amounts**: Largest text size with monospace font
- **Transaction Descriptions**: Medium weight, clear contrast
- **Metadata**: Smaller, muted text for dates and categories
- **Action Items**: Prominent buttons with appropriate color coding

## Responsive Considerations
- **Mobile-First**: Primary interface optimized for phone screens
- **Tablet Adaptation**: Utilize extra space for side-by-side views
- **Desktop Enhancement**: Dashboard-style layout with multiple columns

## Images
No large hero images required. Focus on:
- **Icon Library**: Consistent financial and category icons throughout
- **Receipt Previews**: Thumbnail images in transaction lists
- **Empty States**: Simple illustrations for no-data scenarios
- **Onboarding Graphics**: Minimal icons explaining key features

The design emphasizes functional beauty over decorative elements, ensuring users can quickly understand their financial data while feeling confident in the app's security and reliability.