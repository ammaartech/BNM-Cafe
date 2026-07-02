# Graph Report - BNM-Cafe  (2026-07-02)

## Corpus Check
- 111 files · ~500,917 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 659 nodes · 1325 edges · 52 communities (41 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4681f11d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 65 edges
2. `useSupabase()` - 53 edges
3. `Button` - 29 edges
4. `useToast()` - 23 edges
5. `Card` - 18 edges
6. `CardContent` - 18 edges
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

## Communities (52 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (49): MenuGrid(), MenuGridProps, PendingOrder, MenuItemCardProps, MyFeedbackPage(), categories, menuItems, orders (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (46): AdminLayout(), sidebarNavItems, AdminDashboard(), AdminPage(), AdminLoginPage(), AnalyticsPageContainer(), BottomNavBar(), AppLayoutContent() (+38 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (46): dependencies, class-variance-authority, clsx, date-fns, dotenv, embla-carousel-react, framer-motion, genkit (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (41): AdminLogin(), AdminAnalyticsPage(), AnalyticsData, COLORS, RawOrder, TimeRange, TooltipExplainer(), TrendIndicator() (+33 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (26): inter, RootLayoutContent(), Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (8): scripts, build, dev, genkit:dev, genkit:watch, lint, start, typecheck

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (34): Firebase App Hosting Configuration, Campus Cafe Connect App Blueprint, Graphify Knowledge Graph Instructions, Admin Sales Analytics Dashboard, Annual Subscription SaaS Model, Final Buy-Out Ownership Transfer, Campus Cafe Connect Web Application, Cart Management (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (14): formSchema, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (16): Chaat Category Snack, Chaat Category, Indian Street Food Cuisine, Indian Street Food Cuisine, Dahi Puri Dish, Dahi Puri Image, Tamarind and Green Chutney, Chutneys (Tamarind and Green) (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.19
Nodes (15): Cafe Menu Item, Cardamom, Cinnamon, Cloves, Hot Beverage, Chai Image, Masala Chai, Milk Tea (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (14): cn(), KOTCard(), Checkbox, PopoverContent, SheetContent, SheetContentProps, SheetDescription, SheetFooter() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (11): Chaat Category, Indian Street Food Cuisine, Masala Puri, Masala Puri Image, Green Curry / Masala Gravy, Spiced Masala Gravy, Diced Onion, Puri (Fried Bread) (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, genkit-cli, postcss, tailwindcss, @types/node, @types/react (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (21): KOTCard(), safeFormatDistanceToNow(), statusDisplayMap, AuthForm(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (9): Rice Dish Category, South Indian Cuisine, Bisi Bele Bath, Cashews, Lentils (Dal), Rice, Spices (Masala), Mixed Vegetables (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (8): South Indian Cuisine, Bisi Bele Bath, Cashews, Lentils (Toor Dal), Rice, Mixed Vegetables, Menu Item Photo, Bowl Presentation

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (15): 1. Executive Summary, 1. Monthly Subscription Plan (SaaS Model), 2. Final Buy-Out Option (Ownership Transfer), 2. Key Value Propositions, 3. Maintenance & Support Service (6 Months), 3. Pricing Models & Market Comparison, 4. Recommended Offer, **A one-time fee of ₹1,50,000 for the software license, plus a first-year-included maintenance package.** (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 25 - "Community 25"
Cohesion: 0.28
Nodes (6): containerVariants, itemVariants, ProfilePage(), Avatar, AvatarFallback, AvatarImage

### Community 26 - "Community 26"
Cohesion: 0.60
Nodes (6): BNM Cafe Brand Identity, BNM Cafe Application, Coffee Cup Icon, Monochrome Black and White Color Scheme, BNM Cafe Logo (Black Variant), Bubble/Retro Typography Style

### Community 27 - "Community 27"
Cohesion: 0.50
Nodes (3): **App Name**: Campus Cafe Connect, Core Features:, Style Guidelines:

### Community 28 - "Community 28"
Cohesion: 0.60
Nodes (5): BNM Cafe Brand Name, Coffee Cup Icon, Brand Color Palette (Black and Brown), BNM Cafe Logo (bnmlogoB12), Retro Bubbly Typography Style

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (4): BNM Cafe App Icon, Brand Identity - Warm Orange-Pink Gradient, Coffee Cup Symbol, Rounded Square Icon Shape

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (3): buttonVariants, Calendar(), CalendarProps

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (3): QR Code 1 (PhonePe Payment), Mohamed Ammaar Hussain, PhonePe Payment App

### Community 36 - "Community 36"
Cohesion: 0.39
Nodes (5): getRazorpay(), POST(), razorpay, POST(), razorpay

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (4): Done in this codebase, MANUAL — do these to finish, Security Hardening — status & manual follow-ups, Verification (after applying the migration)

## Knowledge Gaps
- **281 isolated node(s):** `PreToolUse`, `allow`, `extends`, `{ createClient }`, `supabase` (+276 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 13` to `Community 0`, `Community 1`, `Community 32`, `Community 3`, `Community 4`, `Community 33`, `Community 37`, `Community 7`, `Community 10`, `Community 14`, `Community 18`, `Community 19`, `Community 21`, `Community 24`, `Community 25`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `useSupabase()` connect `Community 1` to `Community 0`, `Community 3`, `Community 7`, `Community 19`, `Community 25`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 0` to `Community 1`, `Community 3`, `Community 7`, `Community 14`, `Community 19`, `Community 25`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `useSupabase()` (e.g. with `AppLayoutContent()` and `AdminFeedbackDashboard()`) actually correct?**
  _`useSupabase()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PreToolUse`, `allow`, `extends` to the rest of the system?**
  _297 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07405515832482125 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.058445353594389245 - nodes in this community are weakly interconnected._