# AI Pricing Calculator System - Complete Technical Analysis

**Date:** 2026-03-21  
**Status:** Complete  
**Scope:** Backend pricing engine, schemas, AI tools, frontend integration, edge cases

---

## 1. SYSTEM OVERVIEW

The AI pricing calculator is a role-aware, multi-day pricing system that:
- Calculates room + transport + ferry combo prices
- Supports mixed-day bookings (different day types per night)
- Shows listed prices to users, cost prices to admins
- Applies profit margins dynamically
- Handles child policies, surcharges, seasonal pricing
- Integrates deeply with Gemini AI chat for sales staff

**Architecture:**
```
Frontend (React) → API Hono.js → Chat Module + Pricing Services
                                  ↓
                         Gemini AI Tools
                                  ↓
                    Combo Calculator Service
                                  ↓
           Room Allocator + Transport Resolver
                                  ↓
                         PostgreSQL DB
```

---

## 2. GEMINI AI TOOL DEFINITIONS

**File:** `apps/api/src/modules/chat/gemini-tool-definitions.ts`

### Tool List (11 total):
1. **getMarketOverview** - List properties in market (lightweight, no pricing)
2. **getPropertyDetails** - Single property details (no pricing)
3. **getPropertyPricing** - Room pricing with optional filters
4. **compareProperties** - Side-by-side 2-5 properties
5. **searchProperties** - Cross-market search with filters
6. **getMarketAttractions** - Attractions, dining, transport info
7. **getItineraryTemplates** - Trip templates by duration
8. **getMarketBusinessData** - Competitors, targets, strategies, pricing policies
9. **searchKnowledgeBase** - KB articles search
10. **getTransportPricing** - Bus/ferry pricing with child policies + surcharges
11. **calculateComboPrice** - **CORE PRICING TOOL** - Full combo calculation

### calculateComboPrice Parameters:
```
marketSlug (required)
propertySlug (optional) - null = all properties
numAdults (required)
numChildrenUnder10 (default 0)
numChildrenUnder5 (default 0)
numNights (required, 1-30)
dayTypes (optional array) - One per night for mixed-day trips
dayType (optional string) - All nights same type (fallback)
transportClass (optional) - cabin | limousine | sleeper
ferryClass (optional) - speed_boat | small_boat
tripType (optional) - roundtrip (default) | oneway
departureProvince (optional) - For cross-province surcharge
```

**Key Insight:** `dayTypes` array takes precedence over `dayType`. For T5+T6+T7 mixed trip:
```
dayTypes: ["weekday", "friday", "saturday"]
```

---

## 3. TOOL EXECUTION & ROLE-AWARE PRICING

**File:** `apps/api/src/modules/chat/gemini-tool-handlers.ts`

```typescript
export async function executeToolCall(
  name: string,
  args: ToolArgs,
  userRole: string  // "admin" or "user"
): Promise<string>
```

**Role-Based Behavior:**
- **Admin (role="admin")**:
  - Shows `discountPrice` (cost price)
  - Shows profit margin calculations
  - Can override profit margin via `profitMarginOverride`
- **User (role="user")**:
  - Shows only listed `price` (marked-up price)
  - No cost visibility
  - No margin override

**calculateComboPrice Handler:**
```typescript
const handler = buildComboHandler(userRole);
return fetchFormattedCombo(input, userRole);
```

---

## 4. SYSTEM PROMPT (AI INSTRUCTIONS)

**File:** `apps/api/src/modules/chat/gemini-utils.ts`

### Key Instructions for AI:
1. **User Role**: Sales staff, not customers
2. **Anti-Hallucination**: MUST call tools before answering. NO invented prices/properties.
3. **Lookup Rules**:
   - Only use properties returned by tools
   - Don't mention properties not in tool results
   - If market not found, say "System doesn't have [market], currently has: [list]"
4. **Progressive Strategy** (avoid N+1):
   - getMarketOverview → getPropertyDetails → getPropertyPricing
   - Use propertySlug filters when possible
5. **Day Type Mapping**:
   ```
   T2-T5 (Mon-Thu) = weekday
   T6 (Fri) = friday
   T7 (Sat) = saturday
   CN (Sun) = sunday
   Holidays = holiday
   ```
6. **Price Format**: VND with dots: `2.800.000₫`
7. **Mixed-Day Booking**: Use `dayTypes: ["weekday","friday","saturday"]` for T5+T6+T7

### Customizable Prompt Sections (from DB):
- `prompt_role` - Role definition
- `prompt_lookup_rules` - Tool usage rules
- `prompt_anti_hallucination` - Data integrity
- `prompt_progressive_strategy` - Lookup flow
- `prompt_questioning` - Questions to ask
- `prompt_price_guide` - Day type mapping, combo labels
- `prompt_response_format` - Output format

---

## 5. COMBO CALCULATOR SERVICE (CORE ENGINE)

**File:** `apps/api/src/modules/pricing/combo-calculator-service.ts`

### Main Function:
```typescript
export async function calculateCombo(
  dto: ComboCalculateRequest,
  userRole: string
): Promise<ComboCalculationResult>
```

### Processing Flow:

**Step 1: Normalize Day Types**
```typescript
// Input: dayTypes OR dayType
const dayTypes = normalizeDayTypes(dto);
// Output: array of length === numNights
// Example: numNights=3, dayType="weekday" → ["weekday","weekday","weekday"]
```

**Step 2: Resolve Room Candidates (Multi-Day)**
```typescript
const candidates = await resolveRoomCandidatesMultiDay(
  marketId, propertySlug, comboType, dayTypes
);
// Single JOIN query - fetches ALL pricing for all dayTypes at once
// Only returns rooms that have pricing for ALL requested dayTypes
```

**Step 3: Allocate Rooms**
```typescript
const rooms = allocateRoomsMultiDay(
  candidates, numRoomGuests, dayTypes, isAdmin,
  numAdults, numChildrenUnder10
);
// Greedy: picks best-fit rooms, merges identical allocations
// Per-room cost calculated across all nights (different rates per night)
```

**Step 4: Resolve Transport**
```typescript
const transport = await resolveTransportLine(
  marketId, "bus", transportClass,
  numAdults, numChildrenUnder10, numChildrenUnder5, isAdmin,
  tripType, departureProvince
);
const ferry = await resolveTransportLine(
  marketId, "ferry", ferryClass, ...
);
```

**Step 5: Load Profit Margin**
```typescript
const profitMarginPercent = await loadProfitMargin(
  marketId, marginOverride
);
// Returns: defaultPercent from pricingConfigs
```

**Step 6: Calculate Final Price**
```typescript
const subtotal = roomCost + transportCost + ferryCost;
const marginAmount = Math.round(subtotal * profitMarginPercent / 100);
const grandTotal = subtotal + marginAmount;
const perPerson = numPeople > 0 ? Math.round(grandTotal / numPeople) : 0;
```

**Admin-Only Calculations:**
```typescript
if (isAdmin) {
  discountSubtotal = roomDiscountCost + transportDiscountCost + ferryDiscountCost;
  discountGrandTotal = discountSubtotal + discountMarginAmount;
  discountPerPerson = discountGrandTotal / numPeople;
}
```

---

## 6. ROOM ALLOCATION ALGORITHM

**File:** `apps/api/src/modules/pricing/combo-room-allocator.ts`

### Multi-Day Room Candidate Query:
```typescript
// Unique dayTypes requested
const uniqueDayTypes = [...new Set(dayTypes)];

// Single JOIN: propertyRooms → roomPricing
// WHERE: comboType, dayTypes IN (...), seasonName = "default"
// Result: RoomCandidateMultiDay with prices: Map<dayType, RoomPriceData>
```

**Key Structure:**
```typescript
interface RoomCandidateMultiDay {
  room: { id, roomType, bookingCode, capacity };
  prices: Map<string, RoomPriceData>; // "weekday" → pricing, "friday" → pricing, etc.
  propertyName: string;
}

interface RoomPriceData {
  price: number;
  discountPrice: number | null; // Admin only
  standardGuests: number;
  underStandardPrice: number | null; // If guests < standard
  extraAdultSurcharge: number | null;
  extraChildSurcharge: number | null;
}
```

### Allocation Algorithm (Greedy):
1. **Track nights per day type**:
   ```
   dayTypes = ["weekday", "friday", "saturday"] (3 nights)
   nightsPerDayType = { weekday: 1, friday: 1, saturday: 1 }
   ```

2. **For each person/group needing a room**:
   - Pick best-fit room (fits remaining capacity, largest if no exact fit)
   - Calculate cost per night across all dayTypes:
     ```
     for each unique dayType:
       price = roomPrice[dayType]
       if guests < standardGuests and underStandardPrice:
         price = underStandardPrice
       if extraAdults: price += extraAdults * extraAdultSurcharge
       if extraChildren: price += extraChildren * extraChildSurcharge
       
       totalCost += price * nightsPerDayType[dayType]
     ```

3. **Merge identical room allocations**:
   ```
   Same roomType + propertyName + pricePerRoom → quantity++
   ```

### Price Calculation Per Night:
```typescript
function calcRoomNightCost(
  p: RoomPriceData,
  guestsInRoom: number,
  extraAdults: number,
  extraChildren: number,
  isAdmin: boolean
): { price: number; discount: number | null }
```

**Logic:**
- **Under-standard guests** (if `guestsInRoom < standardGuests`):
  - Use `underStandardPrice` if available, else use regular `price`
- **Extra adult/child surcharges**: Added to base price
- **Admin sees both**: Regular `price` and `discountPrice`
- **User sees only**: Regular `price`

---

## 7. TRANSPORT PRICING RESOLVER

**File:** `apps/api/src/modules/pricing/combo-transport-resolver.ts`

### Main Function:
```typescript
export async function resolveTransportLine(
  marketId: string,
  category: string,  // "bus" or "ferry"
  vehicleClass: string | undefined,
  numAdults: number,
  numChildrenUnder10: number,
  numChildrenUnder5: number,
  isAdmin: boolean,
  tripType?: string,  // "oneway" or "roundtrip"
  departureProvince?: string
): Promise<ComboTransportLine | null>
```

### Trip Type Handling:
```typescript
const isRoundtrip = tripType !== "oneway";

const basePrice = isRoundtrip
  ? (tp.roundtripListedPrice ?? tp.onewayListedPrice)
  : tp.onewayListedPrice;

const baseDiscount = isRoundtrip
  ? (tp.roundtripDiscountPrice ?? tp.onewayDiscountPrice ?? null)
  : (tp.onewayDiscountPrice ?? null);
```

**Default:** roundtrip (if tripType undefined)

### Child Policy:
```
childFreeCount = numChildrenUnder5  // Free (always)
childDiscountCount = numChildrenUnder10  // Gets discount

childCost = Math.max(0, basePrice - childDiscountAmount)
```

**Default values from schema:**
- `childFreeUnder: 5`
- `childDiscountUnder: 10`
- `childDiscountAmount: 100000`

### Cross-Province Surcharge:
```typescript
if (departureProvince && tp.crossProvinceSurcharges) {
  const match = surcharges.find(s => s.province === departureProvince);
  if (match) {
    // Apply to PAYING passengers (adults + children 5-10)
    const payingPassengers = numAdults + numChildrenUnder10;
    const surchargeTotal = match.surcharge * payingPassengers;
    totalCost += surchargeTotal;
  }
}
```

**Seed Example:**
```
province: "Quảng Ninh", surcharge: 200000
province: "Ninh Bình", surcharge: 300000
```

### Total Cost Calculation:
```typescript
const adultCost = numAdults * basePrice;
const childDiscountCost = childDiscountCount * Math.max(0, basePrice - discountAmt);
let totalCost = adultCost + childDiscountCost;
// + surcharge if applicable

// Admin sees discount cost too
if (isAdmin && baseDiscount !== null) {
  totalDiscountCost = (numAdults * baseDiscount) + (childDiscountCount * discountedChildCost);
}
```

---

## 8. DATABASE SCHEMAS

### Room Pricing Schema
**File:** `apps/api/src/db/schema/room-pricing-schema.ts`

```sql
CREATE TABLE room_pricing (
  id UUID PRIMARY KEY,
  room_id UUID NOT NULL (references propertyRooms),
  combo_type VARCHAR(20) NOT NULL,      -- "2n1d", "3n2d", "per_night"
  day_type VARCHAR(20) NOT NULL,        -- "weekday", "friday", "saturday", "sunday"
  season_name VARCHAR(100) DEFAULT "default",
  season_start DATE,
  season_end DATE,
  standard_guests INTEGER NOT NULL,
  price INTEGER NOT NULL,               -- Listed price (user/marked-up)
  discount_price INTEGER,               -- Cost price (admin only)
  price_plus1 INTEGER,                  -- (Unused currently)
  price_minus1 INTEGER,                 -- (Unused currently)
  discount_price_plus1 INTEGER,         -- (Unused currently)
  discount_price_minus1 INTEGER,        -- (Unused currently)
  under_standard_price INTEGER,         -- Price if guests < standard_guests
  extra_adult_surcharge INTEGER,        -- Per extra adult
  extra_child_surcharge INTEGER,        -- Per extra child
  extra_night INTEGER,                  -- (Unused currently)
  included_amenities TEXT,
  notes TEXT,
  ai_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(room_id, combo_type, day_type, season_name)
);
```

**Index:** `(room_id, combo_type, day_type, season_name)` for efficient multi-day queries

### Transport Pricing Schema
**File:** `apps/api/src/db/schema/transport-pricing-schema.ts`

```sql
CREATE TABLE transport_pricing (
  id UUID PRIMARY KEY,
  provider_id UUID NOT NULL (references transportProviders),
  vehicle_class VARCHAR(50) NOT NULL,   -- "cabin", "limousine", "sleeper", "speed_boat", "small_boat"
  seat_type VARCHAR(50) NOT NULL,       -- "single", "double", "front", "vip", "standard"
  capacity_per_unit INTEGER DEFAULT 1,
  oneway_listed_price INTEGER NOT NULL,
  oneway_discount_price INTEGER,
  roundtrip_listed_price INTEGER,
  roundtrip_discount_price INTEGER,
  child_free_under INTEGER DEFAULT 5,   -- Age threshold for free
  child_discount_under INTEGER DEFAULT 10,
  child_discount_amount INTEGER,        -- Discount amount (not percent)
  onboard_services TEXT,
  cross_province_surcharges JSONB,      -- [{ province, surcharge }, ...]
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  ai_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(provider_id, vehicle_class, seat_type)
);
```

**Cross-Province Surcharges Structure:**
```json
[
  { "province": "Quảng Ninh", "surcharge": 200000 },
  { "province": "Ninh Bình", "surcharge": 300000 }
]
```

### Pricing Configs Schema
**File:** `apps/api/src/db/schema/pricing-configs-schema.ts`

```sql
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY,
  market_id UUID (references markets),    -- NULL = global
  property_id UUID (references marketProperties),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,  -- "child_policy", "extra_guest_policy", "surcharge", "profit_margin", etc.
  config JSONB NOT NULL,           -- Rule-specific config
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  ai_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Profit Margin Config Structure:**
```json
{
  "defaultPercent": 20,  // 20% margin
  "percent": 20
}
```

---

## 9. PRICING DATA SEEDING

### Price Matrix (Hardcoded in seed)
**File:** `apps/api/src/db/seed/seed-market-data.ts` (lines 46-79)

```typescript
const PRICE_MATRIX: Record<string, Record<string, number>> = {
  "3n2d": { weekday: 2800000, friday: 3000000, saturday: 3200000, sunday: 3000000 },
  "2n1d": { weekday: 1800000, friday: 2000000, saturday: 2200000, sunday: 2000000 },
  "per_night": { weekday: 1500000, friday: 1700000, saturday: 1900000, sunday: 1700000 },
};
```

### Room Premium Multipliers
```typescript
const ROOM_PREMIUM: Record<string, number> = {
  // phu-quy
  "BX-DLX": 1.3, "BX-FAM": 1.2,
  "HB-STD": 0.85, "HB-TRP": 0.9,
  // ... more rooms
};
```

**Calculation:** `basePrice * premium`

### Transport Pricing Seeds
**File:** `apps/api/src/db/seed/data/transport-pricing-seed-data.ts`

```typescript
transportPricingSeedData["HG"]: [  // Hông Giang provider code
  {
    vehicleClass: "cabin", seatType: "single",
    onewayListedPrice: 400000, onewayDiscountPrice: 350000,
    roundtripListedPrice: 800000, roundtripDiscountPrice: 700000,
    childFreeUnder: 5, childDiscountUnder: 10, childDiscountAmount: 100000,
    crossProvinceSurcharges: [
      { province: "Quảng Ninh", surcharge: 200000 },
      { province: "Ninh Bình", surcharge: 300000 },
    ]
  },
  // ... more classes
]
```

---

## 10. FRONTEND QUICK CALCULATOR

**File:** `apps/web/src/components/pricing/pricing-quick-calculator.tsx`

### Input Form:
- Number of adults
- Number of children 5-10
- Number of children <5
- Number of nights (computed from combo types)
- Day type (weekday, friday, saturday, sunday, holiday)
- Transport class (cabin, limousine, sleeper, none)
- Trip type (roundtrip, oneway)

### API Call:
```typescript
POST /combo-calculator/calculate
{
  marketSlug: string,
  numAdults: number,
  numChildrenUnder10: number,
  numChildrenUnder5: number,
  numNights: number,
  dayTypes: Array<string>,  // All same dayType repeated: Array(nights).fill(dayType)
  transportClass?: string,
  tripType?: string,
}
```

### Response Display:
- **Users:** Show `grandTotal` and `perPerson` only
- **Admins:** Show both `grandTotal` + `discountGrandTotal` (cost), profit margin %
- Show warnings if no rooms found

### Key Code (line 48):
```typescript
dayTypes: Array(nights).fill(dayType)  // Creates array for all nights same type
```

---

## 11. KEY ALGORITHMS & EDGE CASES

### 1. Mixed-Day Booking (T5+T6+T7)
**Issue:** Different prices per night
**Solution:**
- Input: `dayTypes: ["weekday", "friday", "saturday"]` (numNights=3)
- Room allocator tracks `nightsPerDayType = { weekday: 1, friday: 1, saturday: 1 }`
- For each room, cost = Σ(price[dayType] * nights[dayType])

**Example:**
```
3-night room: weekday=1M, friday=1.1M, saturday=1.2M
Total = 1M*1 + 1.1M*1 + 1.2M*1 = 3.3M
(not 3.1M * 3)
```

### 2. Multi-Room Bookings
**Issue:** 5 people need 2 rooms
**Solution:** Greedy allocation
1. Room 1 (capacity 2): 2 adults → cost per night
2. Room 2 (capacity 3): 3 adults → cost per night
3. **Merge identical allocations:**
   - Same roomType + propertyName + pricePerRoom → quantity++

### 3. Under-Standard Guest Pricing
**Issue:** 1 adult booking 2-person room
**Solution:**
```
if (guestsInRoom < standardGuests && underStandardPrice):
  use underStandardPrice
else:
  use price
```

### 4. Extra Adult/Child Surcharges
**Issue:** 4 adults in 2-person standard room
**Solution:**
```
extraAdults = 4 - 2 (standard) = 2
pricePerRoom = basePrice + 2 * extraAdultSurcharge
Applied across ALL nights (not repeated)
```

### 5. One-Way vs Round-Trip Transport
**Default:** roundtrip
**Logic:**
```
if (tripType !== "oneway"):
  price = roundtripListedPrice ?? onewayListedPrice
else:
  price = onewayListedPrice
```

### 6. Cross-Province Surcharge
**Issue:** Booking from Quảng Ninh to Cát Bà
**Solution:**
```
if (departureProvince && match found in surcharges):
  surchargeTotal = surcharge * (numAdults + numChildrenUnder10)
  totalCost += surchargeTotal
```

### 7. Child Free vs Discount vs Full Price
**Transport Policy:**
```
Under 5: FREE (childFreeCount = numChildrenUnder5)
5-10: DISCOUNT (childDiscountCount = numChildrenUnder10)
  childCost = max(0, basePrice - childDiscountAmount)
Over 10: FULL PRICE (= numAdults)
```

### 8. Seasonal Pricing
**Currently:**
- Only `seasonName = "default"` used in calculations
- `seasonStart` / `seasonEnd` stored but not filtered
- **TODO:** Implement date-range filtering for seasons

### 9. Profit Margin (Admin Only)
**Calculation:**
```
marginAmount = round(subtotal * profitMarginPercent / 100)
grandTotal = subtotal + marginAmount

// Admin sees:
discountSubtotal = (cost prices)
discountGrandTotal = discountSubtotal + (cost * margin %)
discountPerPerson = discountGrandTotal / numPeople
```

---

## 12. SYSTEM PROMPT & AI BEHAVIOR

### Gemini Tool Descriptions (Vietnamese):
1. **getMarketOverview**: "Lấy tổng quan thị trường và DANH SÁCH cơ sở lưu trú"
2. **getPropertyDetails**: "Lấy CHI TIẾT một cơ sở lưu trú cụ thể"
3. **getPropertyPricing**: "Lấy bảng giá phòng"
4. **calculateComboPrice**: "Tính giá combo trọn gói: phòng + vận chuyển + tàu"

### System Instructions (Hardcoded):
- **Role:** Sales staff assistant, not customer-facing
- **Anti-Hallucination:** LUÔN gọi tool TRỚ KHI trả lời (ALWAYS call tools)
- **Lookup Rules:** Use propertySlug to filter, avoid loading all data
- **Progressive Strategy:** Overview → Details → Pricing (not all at once)
- **Day Type Mapping:**
  - T2-T5 = weekday
  - T6 = friday
  - T7 = saturday
  - CN = sunday
- **Format:** VND with dots: `2.800.000₫`

### Customizable Sections (from DB):
Admin can configure via `ai_chat_configs` table:
- Role definition
- Lookup rules
- Anti-hallucination guidelines
- Progressive strategy
- Questioning guidelines
- Price calculation guide
- Response format

---

## 13. TRANSPORT FETCHERS & FORMATTING

**File:** `apps/api/src/modules/market-data/ai-transport-fetchers.ts`

### fetchTransportPricing (Staff-Facing):
- Shows LISTED prices only (profit already included)
- Formats as text for AI: provider name, route, vehicle/seat types, prices
- Includes child policy and cross-province surcharges

### fetchFormattedCombo (AI Output):
```
[BÁO GIÁ COMBO — 5 người, 3N2Đ, khứ hồi]
Thị trường: cat-ba | Loại ngày: weekday, friday, saturday

PHÒNG:
  Suite (3 ng): 1.500.000₫/phòng × 1 = 1.500.000₫
  Deluxe (2 ng): 1.200.000₫/phòng × 1 = 1.200.000₫
  Tổng phòng: 2.700.000₫ (gốc: 2.400.000₫)

VẬN CHUYỂN (cabin khứ hồi):
  5 ng × 600.000₫ = 3.000.000₫ (gốc: 500.000₫)

TÀUferry (speed_boat khứ hồi):
  (Không)

TỔNG (giá bán): 5.700.000₫
Biên lợi nhuận (20%): +1.140.000₫
TỔNG SAU MARGIN: 6.840.000₫ (gốc: 5.400.000₫)
GIÁ/NGƯỜI: 1.368.000₫ (gốc: 1.080.000₫)
```

---

## 14. UNRESOLVED QUESTIONS & GAPS

1. **Seasonal Pricing Not Implemented:**
   - `seasonStart` / `seasonEnd` fields exist but queries only use `seasonName = "default"`
   - Need date-based filtering in `resolveRoomCandidatesMultiDay`

2. **Holiday Day Type Not Mapped:**
   - Schema allows `day_type = "holiday"`
   - System prompt mentions "holiday" but unclear how to determine holiday dates
   - No seed data for holiday pricing

3. **Unused Fields in Room Pricing:**
   - `pricePlus1`, `priceMinus1`, `discountPricePlus1`, `discountPriceMinus1` never used
   - `extraNight` never used
   - Purpose unclear

4. **Multiple Nights, Same Type Not Optimized:**
   - Currently allocates with `nightsPerDayType` math
   - Example: 3 nights all weekday should be simpler (just price * 3)

5. **No Discount Policies:**
   - No support for group discounts, loyalty discounts, early-bird discounts
   - Only profit margin exists

6. **Combo Type Calculation:**
   - `numNights=1` → "2n1d", `numNights=2` → "3n2d", else "per_night"
   - No custom mapping, doesn't match actual calendar days

7. **Room Capacity vs Guest Count:**
   - No validation: Can 1 person book 4-capacity room? Yes.
   - Leads to "under-standard" pricing if not configured

8. **Transport & Ferry Can Both Apply:**
   - No exclusion: Both bus + ferry included in same combo
   - Real world: Usually mutually exclusive OR sequential (ferry to island, then local transport)

9. **Profit Margin Applied Once:**
   - Single margin on total
   - No per-item margin, no per-room margin, no per-transport margin

---

## 15. DATA FLOW EXAMPLE

### Scenario: Calculate price for 4 adults, 2 children (5-10), 3 nights (T5+T6+T7), Cát Bà property, cabin+roundtrip, from Quảng Ninh

**Frontend:**
```json
{
  "marketSlug": "cat-ba",
  "propertySlug": "lan-ha-bay-homestay",
  "numAdults": 4,
  "numChildrenUnder10": 2,
  "numChildrenUnder5": 0,
  "numNights": 3,
  "dayTypes": ["weekday", "friday", "saturday"],
  "transportClass": "cabin",
  "ferryClass": null,
  "tripType": "roundtrip",
  "departureProvince": "Quảng Ninh"
}
```

**Backend Combo Calculator:**

1. **Normalize:**
   - numPeople = 4 + 2 + 0 = 6
   - numRoomGuests = 4 + 2 = 6 (under-5 don't count)
   - comboType = "3n2d" (numNights=3 → per_night)
   - dayTypes = ["weekday", "friday", "saturday"]

2. **Resolve Rooms:**
   ```sql
   SELECT ... FROM room_pricing
   WHERE market_id = "cat-ba"
     AND property_id = "lan-ha-bay-homestay"
     AND combo_type = "per_night"
     AND day_type IN ("weekday", "friday", "saturday")
     AND season_name = "default"
   ```
   - Result: Suite (3 capacity), Deluxe (2 capacity), Std (1 capacity)

3. **Allocate:**
   - Room 1: 3-capacity Suite, 3 adults
     - Cost: (1.2M*weekday + 1.3M*friday + 1.4M*saturday) = 3.9M
   - Room 2: 2-capacity Deluxe, 1 adult + 2 children
     - Cost: (0.9M*weekday + 1.0M*friday + 1.1M*saturday) = 3.0M
   - Total Rooms: 6.9M

4. **Resolve Transport (Cabin, Roundtrip):**
   - Base: roundtripListedPrice = 800k (or 1.2M for double)
   - Paying: 4 adults + 2 children (5-10) = 6
   - Cost: 6 * 800k = 4.8M
   - Surcharge (Quảng Ninh): 200k * 6 = 1.2M
   - **Total Transport: 6.0M**

5. **Profit Margin:**
   - Subtotal: 6.9M + 6.0M = 12.9M
   - Margin (20%): 12.9M * 20% = 2.58M
   - **Grand Total: 15.48M**
   - **Per Person: 15.48M / 6 = 2.58M**

6. **Admin Sees (discountPrice):**
   - Room discount cost, transport discount cost
   - Margin calculated on discount subtotal

---

## 16. KEY FILES REFERENCE

**Backend Pricing:**
- `apps/api/src/modules/chat/gemini-tool-definitions.ts` - Tool definitions
- `apps/api/src/modules/chat/gemini-tool-handlers.ts` - Tool execution
- `apps/api/src/modules/pricing/combo-calculator-service.ts` - Main calculator
- `apps/api/src/modules/pricing/combo-room-allocator.ts` - Room logic
- `apps/api/src/modules/pricing/combo-transport-resolver.ts` - Transport logic
- `apps/api/src/modules/market-data/ai-transport-fetchers.ts` - Formatting

**Schemas:**
- `apps/api/src/db/schema/room-pricing-schema.ts`
- `apps/api/src/db/schema/transport-pricing-schema.ts`
- `apps/api/src/db/schema/pricing-configs-schema.ts`
- `packages/shared/src/schemas/market-property-schemas.ts` - Zod schemas

**Seeds:**
- `apps/api/src/db/seed/seed-market-data.ts` - Main seeding
- `apps/api/src/db/seed/data/transport-pricing-seed-data.ts`
- `apps/api/src/db/seed/data/pricing-configs-seed-data.ts`

**Frontend:**
- `apps/web/src/components/pricing/pricing-quick-calculator.tsx`

**System Prompt:**
- `apps/api/src/modules/chat/gemini-utils.ts` - `buildSystemPrompt()` / `buildSystemPromptFromDb()`

---

## 17. SUMMARY

The pricing system is **mature and production-ready** with:
- Role-aware pricing (user/admin separation)
- Mixed-day booking support
- Child policy automation
- Cross-province surcharges
- Profit margin management
- Deep AI integration for sales staff
- Single-query optimization (no N+1)

**Main strengths:**
- Comprehensive combo calculation (rooms + transport + ferry)
- Anti-hallucination safeguards in AI prompts
- Database-driven customization of prompt sections
- Greedy room allocation handles multi-room bookings

**Main gaps:**
- Seasonal pricing querying not implemented
- Holiday dates not determined
- Discount policies missing
- Transport/ferry exclusivity not enforced

