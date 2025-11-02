# 📱 MellChat - Detailed Screen Descriptions

## Overview

This document provides detailed descriptions of each screen in the MellChat application, following Material Design principles and optimized for mobile PWA experience.

---

## 🔄 Onboarding Flow

### 1. Welcome Screen

**Purpose:** First-time user introduction to the application

**Layout:**
- Centered logo "MellChat" at the top
- Application description text below the logo
- Platform icons (Twitch, YouTube, Kick) displayed horizontally
- "Get Started" button centered at the bottom

**Visual Elements:**
- Static Material Design background
- Minimalist design approach
- Focus on call-to-action button
- Dark theme with high contrast

**User Actions:**
- Tap "Get Started" to proceed to platform selection

**Navigation:**
- Next: Platform Selection Screen

---

### 2. Platform Selection Screen

**Purpose:** Choose authentication method or skip to main app

**Layout:**
- "MellChat" logo centered at the top
- Streaming platform icons (Twitch, YouTube, Kick) displayed prominently
- "Sign In" button (primary action)
- "Skip" button (secondary action)

**Visual Elements:**
- Material Icons for platform representations
- Consistent button styling
- Centered layout design
- Material Design color scheme

**User Actions:**
- Tap "Sign In" to proceed to authentication
- Tap "Skip" to go directly to main screen

**Navigation:**
- Sign In → Authentication Screen
- Skip → Main Screen (without auth)

---

### 3. Authentication Screen

**Purpose:** User login and registration

**Layout:**
- Authentication options (Google OAuth)
- Registration button
- "Back" button for navigation

**Visual Elements:**
- Material Design buttons
- Google OAuth integration styling
- Simple navigation layout

**User Actions:**
- Tap Google button for OAuth authentication
- Tap registration button for new account
- Tap "Back" to return to platform selection

**Navigation:**
- Back → Platform Selection Screen
- Success → Main Screen

---

### 4. Main Screen (After Skip)

**Purpose:** Main application interface without authentication

**Layout:**
- "MellChat" logo centered
- Platform icons displayed
- "Add Stream" button prominently placed

**Visual Elements:**
- Ready-to-use interface
- Minimalist design
- Clear call-to-action

**User Actions:**
- Tap "Add Stream" to add first stream

**Navigation:**
- Add Stream → Add Stream Modal

---

## 📱 Main Application Screens

### 5. Header Component

**Purpose:** Main navigation and branding

**Layout:**
- "MellChat" logo on the left (clickable)
- Personalization button on the right
- Settings button on the right

**Visual Elements:**
- Material Design styling
- Background extends under iPhone notch
- Compact button design
- Gradient text for logo

**User Actions:**
- Tap logo to go to Recent Streams
- Tap personalization button for user settings
- Tap settings button for app settings

**Navigation:**
- Logo → Recent Streams Screen
- Buttons → Respective settings screens

---

### 6. Stream Cards Component

**Purpose:** Display active streaming channels

**Layout:**
- Horizontal scrollable row of cards
- Platform logo at the top of each card
- Author name below logo (clickable link)
- Unread messages counter button
- Unread questions counter button
- Collapse button in top-right corner

**Visual Elements:**
- Material Design card components
- Horizontal scrolling with snap alignment
- Clickable counters with animation
- Links to original streaming platforms

**User Actions:**
- Tap card to switch to that stream
- Tap author name to open original platform
- Tap message counter to scroll to unread messages
- Tap question counter to scroll to unread questions
- Tap collapse button to minimize stream

**Navigation:**
- Card tap → Switch to stream
- Author name → External platform
- Counters → Scroll to unread content
- Collapse → Hide stream

---

### 7. Chat Container Component

**Purpose:** Display real-time chat messages

**Layout:**
- Vertical scrollable message list
- Messages displayed as individual cards
- Auto-scroll to new messages
- Scroll to unread functionality

**Visual Elements:**
- Material Design message cards
- Adaptive height for different screen sizes
- iOS PWA optimization
- Smooth scrolling animations

**User Actions:**
- Scroll to view message history
- Tap on messages for interactions
- Use scroll buttons to jump to unread content

**Navigation:**
- Integrated with Stream Cards for content switching

---

### 8. Message Cards Component

**Purpose:** Individual chat message display

**Layout:**
- Username (sender name) on the left
- Platform logo next to username
- Timestamp (date and time) below username
- Message text on the right side

**Visual Elements:**
- Material Design card styling
- Visual separation between cards
- High contrast text
- Compact font sizing

**User Actions:**
- Tap username for user profile (future feature)
- Tap platform logo for platform info
- Long press for message options (future feature)

**Navigation:**
- No direct navigation, informational display

---

### 9. Search Bar Component

**Purpose:** Chat search and stream management

**Layout:**
- Search input field for text/username search
- "+" button (Floating Action Button) for adding streams
- Positioned below chat container

**Visual Elements:**
- Material Design text input field
- Floating Action Button styling
- Real-time search functionality
- Clear visual hierarchy

**User Actions:**
- Type to search messages by text
- Type to search messages by usernames
- Tap "+" to open Add Stream modal

**Navigation:**
- "+" button → Add Stream Modal
- Search results → Filtered chat view

---

### 10. Add Stream Modal

**Purpose:** Add new streaming channels

**Layout:**
- Modal overlay with centered content
- URL input field
- "Connect" button
- "Cancel" button

**Visual Elements:**
- Material Design modal styling
- Outlined text input field
- Primary and secondary button styling
- Overlay background

**User Actions:**
- Enter streaming URL
- Tap "Connect" to add stream
- Tap "Cancel" to close modal

**Navigation:**
- Connect → Add stream to active list
- Cancel → Close modal, return to main screen

---

### 11. Recent Streams Screen

**Purpose:** View and manage stream history

**Layout:**
- "Back" button at the top
- "Recent Streams" title
- Vertical list of wide stream cards
- Same information as active stream cards

**Visual Elements:**
- Material Design card components
- Vertical list layout
- Wide cards for better information display
- Hidden collapsed streams

**User Actions:**
- Tap "Back" to return to main screen
- Tap stream card to reactivate stream
- Tap author name to open original platform

**Navigation:**
- Back → Main Screen
- Stream card → Activate stream, return to main screen

---

## 🎨 Visual Design Principles

### Material Design Implementation
- **Static Background:** Material Design themed background
- **Color Palette:** Material Design dark theme colors
- **Typography:** Roboto font family with Material scale
- **Components:** Material buttons, cards, text fields, and icons
- **Animations:** Material Motion principles

### Component Styling
- **Buttons:** Material Filled, Outlined, and Text variants
- **Cards:** Material Card with elevation and rounded corners
- **Input Fields:** Material Outlined Text Field styling
- **Icons:** Material Icons throughout the interface
- **FAB:** Floating Action Button for primary actions

### Interaction Design
- **Ripple Effects:** Material ripple on button interactions
- **Hover States:** Material hover effects for interactive elements
- **Focus States:** Clear focus indicators for accessibility
- **Motion:** Smooth Material Motion transitions

---

## 📱 Mobile Optimization

### iOS PWA Features
- **Full Screen Mode:** Utilizes entire screen real estate
- **Notch Integration:** Header background extends under iPhone notch
- **Touch Optimization:** Touch-friendly button sizes and spacing
- **Viewport Handling:** Proper viewport height calculations

### Responsive Design
- **Breakpoints:** Material Design breakpoint system
- **Adaptive Layout:** Components adapt to different screen sizes
- **Touch Targets:** Minimum 44pt touch targets for accessibility

### Performance
- **Virtual Scrolling:** Efficient rendering of long message lists
- **Lazy Loading:** On-demand loading of content
- **Optimized Rendering:** Material Design performance best practices

---

## 🔄 Navigation Flow

### Primary Navigation Paths
1. **Onboarding:** Welcome → Platform Selection → Authentication/Skip → Main
2. **Stream Management:** Main → Add Stream Modal → Stream Cards
3. **Chat Interaction:** Stream Cards → Chat Container → Message Cards
4. **History Access:** Header Logo → Recent Streams → Back to Main

### Secondary Navigation
- **Settings Access:** Header buttons → Settings screens
- **Platform Links:** Author names → External platforms
- **Search Functionality:** Search Bar → Filtered chat view

---

## 🎯 User Experience Goals

### Primary Objectives
- **Intuitive Navigation:** Clear and logical screen flow
- **Efficient Stream Management:** Easy addition and removal of streams
- **Real-time Communication:** Seamless chat experience across platforms
- **Mobile-First Design:** Optimized for mobile PWA usage

### Accessibility Features
- **High Contrast:** Dark theme with high contrast ratios
- **Touch Targets:** Adequate size for touch interaction
- **Keyboard Navigation:** Full keyboard accessibility
- **Screen Reader Support:** Proper ARIA labels and structure

### Performance Targets
- **Fast Loading:** Quick initial load and screen transitions
- **Smooth Scrolling:** 60fps scrolling performance
- **Efficient Updates:** Real-time updates without performance impact
- **Battery Optimization:** Efficient resource usage for mobile devices

---

## 🎨 Внедрение нового UI/UX из Figma

### Этапы работ
1. Импорт дизайн‑токенов (цвета, типографика, радиусы, тени, spacing)
2. Согласование токенов с текущими CSS переменными и утилити‑классами
3. Создание темы glassmorphism (bg, blur, opacity, тени, радиусы)
4. Обновление глобальных стилей: `reset`, `globals`, `animations`
5. Сборка UI Kit в `src/shared/components` (Button, Input, Select, Card, Modal, Tag, Switch, Tooltip, Tabs, Avatar, Badge)
6. Замена базовых элементов на UI Kit во всех фичах
7. Пересборка `src/app` (layout, header, навигация)
8. Обновление экранов `features/chat` (список, карточка, инпут, action‑bar)
9. Обновление экранов `features/streams` (карточки/грид, состояния)
10. Обновление экранов `features/settings` (формы, теги, переключатели)
11. Тёмная тема и переключатель (`data-theme`, системная схема)
12. Визуальный QA (отступы, адаптив, контраст, доступность)

### Технические детали
- Токены: импорт JSON из Figma Variables/Figma Tokens → маппинг в CSS custom properties в `:root` и `:root[data-theme="dark"]`
- Стиль: glassmorphism через переменные (цвет фона, blur, backdrop, тени, радиусы, opacity)
- Производительность: мемоизация обработчиков, виртуализация списков > 50, lazy images, отсутствие лишних перерисовок
- Доступность: фокус‑стили, aria‑атрибуты, контраст ≥ WCAG AA

### Затронутые разделы кода
- `src/styles/*.css` — обновление переменных и утилити‑классов
- `src/shared/components/*` — новый UI Kit
- `src/app/*` — лэйаут и хедер
- `src/features/chat/*` — списки, карточки, инпут
- `src/features/streams/*` — карточки/грид, пустые состояния
- `src/features/settings/*` — формы и контролы

### Чек‑лист приемки
- Токены соответствуют Figma, светлая/тёмная темы переключаются
- Компоненты UI Kit покрывают 100% базовых элементов
- Экранные состояния (loading/empty/error) оформлены
- Списки не лагают, сообщения рендерятся стабильно
- Контрасты и фокус‑стили проходят проверку
