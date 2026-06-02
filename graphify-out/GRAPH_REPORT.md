# Graph Report - .  (2026-06-02)

## Corpus Check
- 121 files · ~151,827 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 617 nodes · 1254 edges · 51 communities (42 shown, 9 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.89)
- Token cost: 2,800 input · 1,100 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin & Cashier Order Mgmt|Admin & Cashier Order Mgmt]]
- [[_COMMUNITY_Admin Dashboard & Layout|Admin Dashboard & Layout]]
- [[_COMMUNITY_Dependencies & Packages|Dependencies & Packages]]
- [[_COMMUNITY_Analytics & Data Viz|Analytics & Data Viz]]
- [[_COMMUNITY_App Root & Notifications|App Root & Notifications]]
- [[_COMMUNITY_Menu & Cashier Checkout|Menu & Cashier Checkout]]
- [[_COMMUNITY_Project Docs & Business Model|Project Docs & Business Model]]
- [[_COMMUNITY_Feedback Form|Feedback Form]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Component System Config|Component System Config]]
- [[_COMMUNITY_Menubar UI Component|Menubar UI Component]]
- [[_COMMUNITY_Dahi Puri Menu Images|Dahi Puri Menu Images]]
- [[_COMMUNITY_Chai Beverage Images|Chai Beverage Images]]
- [[_COMMUNITY_Base UI Utilities|Base UI Utilities]]
- [[_COMMUNITY_Carousel UI Component|Carousel UI Component]]
- [[_COMMUNITY_Cashier Pending Queue|Cashier Pending Queue]]
- [[_COMMUNITY_Masala Puri Menu Images|Masala Puri Menu Images]]
- [[_COMMUNITY_Dev Tools & Linting|Dev Tools & Linting]]
- [[_COMMUNITY_Dropdown Menu Component|Dropdown Menu Component]]
- [[_COMMUNITY_Trend Indicator & Dialogs|Trend Indicator & Dialogs]]
- [[_COMMUNITY_Bisi Bele Bath Images|Bisi Bele Bath Images]]
- [[_COMMUNITY_Alert Dialog Component|Alert Dialog Component]]
- [[_COMMUNITY_South Indian Rice Dish|South Indian Rice Dish]]
- [[_COMMUNITY_Build & Dev Scripts|Build & Dev Scripts]]
- [[_COMMUNITY_Select UI Component|Select UI Component]]
- [[_COMMUNITY_User Profile Page|User Profile Page]]
- [[_COMMUNITY_Brand Logo (Black Variant)|Brand Logo (Black Variant)]]
- [[_COMMUNITY_Category Tabs & Scroll|Category Tabs & Scroll]]
- [[_COMMUNITY_Brand Logo (Color Variant)|Brand Logo (Color Variant)]]
- [[_COMMUNITY_Database Schema Check|Database Schema Check]]
- [[_COMMUNITY_App Icon & Brand Colors|App Icon & Brand Colors]]
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_Accordion Component|Accordion Component]]
- [[_COMMUNITY_Button & Calendar|Button & Calendar]]
- [[_COMMUNITY_Claude Dev Settings|Claude Dev Settings]]
- [[_COMMUNITY_PhonePe QR Payment|PhonePe QR Payment]]
- [[_COMMUNITY_Razorpay Payment Route|Razorpay Payment Route]]
- [[_COMMUNITY_Razorpay Webhook Route|Razorpay Webhook Route]]
- [[_COMMUNITY_Genkit AI Integration|Genkit AI Integration]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Image Placeholder|Image Placeholder]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 65 edges
2. `useSupabase()` - 55 edges
3. `Button` - 30 edges
4. `useToast()` - 25 edges
5. `Card` - 19 edges
6. `CardContent` - 19 edges
7. `compilerOptions` - 17 edges
8. `useCart()` - 15 edges
9. `MenuItem` - 15 edges
10. `Dahi Puri Dish` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Campus Cafe Connect Software Pricing Proposal` --semantically_similar_to--> `BNM Cafe Application Pricing and Maintenance Proposal`  [INFERRED] [semantically similar]
  PRICING_PROPOSAL.md → pricing-proposal.md
- `Real-time Inventory Check` --semantically_similar_to--> `Real-time Order Management`  [INFERRED] [semantically similar]
  docs/blueprint.md → PRICING_PROPOSAL.md
- `Final Buy-Out Ownership Transfer` --semantically_similar_to--> `One-Time Software Licensing Fee Model`  [INFERRED] [semantically similar]
  pricing-proposal.md → PRICING_PROPOSAL.md
- `Monthly Subscription SaaS Model` --semantically_similar_to--> `Annual Subscription SaaS Model`  [INFERRED] [semantically similar]
  pricing-proposal.md → PRICING_PROPOSAL.md
- `Graphify Knowledge Graph Instructions` --references--> `Campus Cafe Connect Web Application`  [INFERRED]
  CLAUDE.md → PRICING_PROPOSAL.md

## Import Cycles
- 1-file cycle: `src/lib/placeholder-images.ts -> src/lib/placeholder-images.ts`

## Hyperedges (group relationships)
- **Pricing Models for Campus Cafe Connect / BNM Cafe App** — concept_one_time_license, concept_annual_subscription, concept_monthly_subscription, concept_buyout_option [INFERRED 0.85]
- **Core Features of Campus Cafe Connect App** — concept_user_authentication, concept_menu_display, concept_cart_management, concept_order_history, concept_realtime_inventory [EXTRACTED 1.00]
- **Admin Capabilities of Campus Cafe Connect** — concept_admin_analytics, concept_realtime_order_mgmt, concept_csv_export [EXTRACTED 1.00]

## Communities (51 total, 9 thin omitted)

### Community 0 - "Admin & Cashier Order Mgmt"
Cohesion: 0.09
Nodes (45): AdminLogin(), KOTCard(), safeFormatDistanceToNow(), statusDisplayMap, syncOrderStatus(), placeholderImages, Order, OrderStationStatus (+37 more)

### Community 1 - "Admin Dashboard & Layout"
Cohesion: 0.06
Nodes (47): AdminLayout(), sidebarNavItems, AdminDashboard(), AdminPage(), AdminAnalyticsPage(), AdminLoginPage(), AnalyticsPageContainer(), BottomNavBar() (+39 more)

### Community 2 - "Dependencies & Packages"
Cohesion: 0.04
Nodes (46): dependencies, class-variance-authority, clsx, date-fns, dotenv, embla-carousel-react, framer-motion, genkit (+38 more)

### Community 3 - "Analytics & Data Viz"
Cohesion: 0.09
Nodes (24): AnalyticsData, COLORS, RawOrder, TimeRange, TooltipExplainer(), OrderItem, OrderItem, OrderItem (+16 more)

### Community 4 - "App Root & Notifications"
Cohesion: 0.09
Nodes (26): inter, RootLayoutContent(), Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+18 more)

### Community 5 - "Menu & Cashier Checkout"
Cohesion: 0.11
Nodes (20): CategoryTabs(), MenuGrid(), MenuGridProps, OrderSidebar(), CashierPageContent(), ReceiptTemplate(), MenuItemCardProps, CartContextType (+12 more)

### Community 6 - "Project Docs & Business Model"
Cohesion: 0.10
Nodes (26): Firebase App Hosting Configuration, Campus Cafe Connect App Blueprint, Graphify Knowledge Graph Instructions, Admin Sales Analytics Dashboard, Annual Subscription SaaS Model, Final Buy-Out Ownership Transfer, Campus Cafe Connect Web Application, Cart Management (+18 more)

### Community 7 - "Feedback Form"
Cohesion: 0.13
Nodes (15): FeedbackFormContent(), formSchema, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem (+7 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 9 - "Component System Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 10 - "Menubar UI Component"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 11 - "Dahi Puri Menu Images"
Cohesion: 0.14
Nodes (16): Chaat Category Snack, Chaat Category, Indian Street Food Cuisine, Indian Street Food Cuisine, Dahi Puri Dish, Dahi Puri Image, Tamarind and Green Chutney, Chutneys (Tamarind and Green) (+8 more)

### Community 12 - "Chai Beverage Images"
Cohesion: 0.19
Nodes (15): Cafe Menu Item, Cardamom, Cinnamon, Cloves, Hot Beverage, Chai Image, Masala Chai, Milk Tea (+7 more)

### Community 13 - "Base UI Utilities"
Cohesion: 0.14
Nodes (7): Checkbox, PopoverContent, Progress, RadioGroup, RadioGroupItem, Slider, Switch

### Community 14 - "Carousel UI Component"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 15 - "Cashier Pending Queue"
Cohesion: 0.21
Nodes (10): CashierPendingQueue(), PendingOrder, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+2 more)

### Community 16 - "Masala Puri Menu Images"
Cohesion: 0.20
Nodes (11): Chaat Category, Indian Street Food Cuisine, Masala Puri, Masala Puri Image, Green Curry / Masala Gravy, Spiced Masala Gravy, Diced Onion, Puri (Fried Bread) (+3 more)

### Community 17 - "Dev Tools & Linting"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, genkit-cli, postcss, tailwindcss, @types/node, @types/react (+2 more)

### Community 18 - "Dropdown Menu Component"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 19 - "Trend Indicator & Dialogs"
Cohesion: 0.31
Nodes (7): TrendIndicator(), TrendIndicatorProps, cn(), KOTCard(), DialogFooter(), DialogHeader(), DialogOverlay

### Community 20 - "Bisi Bele Bath Images"
Cohesion: 0.25
Nodes (9): Rice Dish Category, South Indian Cuisine, Bisi Bele Bath, Cashews, Lentils (Dal), Rice, Spices (Masala), Mixed Vegetables (+1 more)

### Community 21 - "Alert Dialog Component"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 22 - "South Indian Rice Dish"
Cohesion: 0.25
Nodes (8): South Indian Cuisine, Bisi Bele Bath, Cashews, Lentils (Toor Dal), Rice, Mixed Vegetables, Menu Item Photo, Bowl Presentation

### Community 23 - "Build & Dev Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, genkit:dev, genkit:watch, lint, start, typecheck

### Community 24 - "Select UI Component"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 25 - "User Profile Page"
Cohesion: 0.38
Nodes (4): ProfilePage(), Avatar, AvatarFallback, AvatarImage

### Community 26 - "Brand Logo (Black Variant)"
Cohesion: 0.60
Nodes (6): BNM Cafe Brand Identity, BNM Cafe Application, Coffee Cup Icon, Monochrome Black and White Color Scheme, BNM Cafe Logo (Black Variant), Bubble/Retro Typography Style

### Community 27 - "Category Tabs & Scroll"
Cohesion: 0.53
Nodes (4): CategoryTabsProps, Category, ScrollArea, ScrollBar

### Community 28 - "Brand Logo (Color Variant)"
Cohesion: 0.60
Nodes (5): BNM Cafe Brand Name, Coffee Cup Icon, Brand Color Palette (Black and Brown), BNM Cafe Logo (bnmlogoB12), Retro Bubbly Typography Style

### Community 30 - "App Icon & Brand Colors"
Cohesion: 0.67
Nodes (4): BNM Cafe App Icon, Brand Identity - Warm Orange-Pink Gradient, Coffee Cup Symbol, Rounded Square Icon Shape

### Community 31 - "Package Metadata"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 32 - "Accordion Component"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 33 - "Button & Calendar"
Cohesion: 0.67
Nodes (3): buttonVariants, Calendar(), CalendarProps

### Community 35 - "PhonePe QR Payment"
Cohesion: 0.67
Nodes (3): QR Code 1 (PhonePe Payment), Mohamed Ammaar Hussain, PhonePe Payment App

## Knowledge Gaps
- **260 isolated node(s):** `PreToolUse`, `extends`, `{ createClient }`, `supabase`, `$schema` (+255 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Trend Indicator & Dialogs` to `Admin & Cashier Order Mgmt`, `Admin Dashboard & Layout`, `Accordion Component`, `Button & Calendar`, `App Root & Notifications`, `Analytics & Data Viz`, `Feedback Form`, `Menubar UI Component`, `Base UI Utilities`, `Carousel UI Component`, `Cashier Pending Queue`, `Dropdown Menu Component`, `Alert Dialog Component`, `Select UI Component`, `User Profile Page`, `Category Tabs & Scroll`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `useSupabase()` connect `Admin Dashboard & Layout` to `Admin & Cashier Order Mgmt`, `Analytics & Data Viz`, `Menu & Cashier Checkout`, `Feedback Form`, `Cashier Pending Queue`, `User Profile Page`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Button` connect `Admin & Cashier Order Mgmt` to `Admin Dashboard & Layout`, `Analytics & Data Viz`, `Menu & Cashier Checkout`, `Feedback Form`, `Carousel UI Component`, `Cashier Pending Queue`, `User Profile Page`, `Category Tabs & Scroll`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useSupabase()` (e.g. with `AppLayoutContent()` and `AdminFeedbackDashboard()`) actually correct?**
  _`useSupabase()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PreToolUse`, `extends`, `{ createClient }` to the rest of the system?**
  _276 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin & Cashier Order Mgmt` be split into smaller, more focused modules?**
  _Cohesion score 0.08730931515741643 - nodes in this community are weakly interconnected._
- **Should `Admin Dashboard & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.061072261072261075 - nodes in this community are weakly interconnected._