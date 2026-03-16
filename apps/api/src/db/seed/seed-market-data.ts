import { db, queryClient } from "../connection.js";
import {
  markets,
  marketCompetitors,
  marketCustomerJourneys,
  marketTargetCustomers,
  marketAttractions,
  marketDiningSpots,
  marketTransportation,
  marketInventoryStrategies,
  marketProperties,
  propertyRooms,
  roomPricing,
  evaluationCriteria,
  propertyEvaluations,
  itineraryTemplates,
  itineraryTemplateItems,
  pricingConfigs,
  aiDataSettings,
} from "../schema/index.js";

import { marketsData } from "./data/markets-seed-data.js";
import { competitorsData } from "./data/competitors-seed-data.js";
import { customerJourneysData } from "./data/customer-journeys-seed-data.js";
import { targetCustomersData } from "./data/target-customers-seed-data.js";
import { attractionsData } from "./data/attractions-seed-data.js";
import { diningSpotsData } from "./data/dining-spots-seed-data.js";
import { transportationData } from "./data/transportation-seed-data.js";
import { inventoryStrategiesData } from "./data/inventory-strategies-seed-data.js";
import { propertiesData } from "./data/properties-seed-data.js";
import { evaluationCriteriaData } from "./data/evaluation-criteria-seed-data.js";
import { itineraryTemplatesData } from "./data/itinerary-templates-seed-data.js";
import { pricingConfigsData } from "./data/pricing-configs-seed-data.js";
import { aiSettingsData } from "./data/ai-settings-seed-data.js";

// Room pricing combos and day types
const COMBO_TYPES = ["3n2d", "2n1d", "per_night"] as const;
const DAY_TYPES = ["weekday", "friday", "saturday", "sunday"] as const;

// Base prices per combo per day type multiplier
const PRICE_MATRIX: Record<string, Record<string, number>> = {
  "3n2d":    { weekday: 2800000, friday: 3000000, saturday: 3200000, sunday: 3000000 },
  "2n1d":    { weekday: 1800000, friday: 2000000, saturday: 2200000, sunday: 2000000 },
  "per_night":{ weekday: 1500000, friday: 1700000, saturday: 1900000, sunday: 1700000 },
};

// Premium multiplier for deluxe/bay-view rooms
const ROOM_PREMIUM: Record<string, number> = {
  "BX-DLX": 1.3, "BX-FAM": 1.2,
  "HB-STD": 0.85, "HB-TRP": 0.9,
  "CE-DLX": 1.5, "CE-STD": 1.1,
  "LH-STD": 1.0, "LH-FAM": 1.25,
  "SB-SUP": 1.2, "SB-DLX": 1.5,
};

async function clearMarketData() {
  console.log("  Clearing existing market data...");
  // Delete in reverse FK order
  await db.delete(roomPricing);
  await db.delete(propertyEvaluations);
  await db.delete(propertyRooms);
  await db.delete(itineraryTemplateItems);
  await db.delete(itineraryTemplates);
  await db.delete(pricingConfigs);
  await db.delete(evaluationCriteria);
  await db.delete(marketProperties);
  await db.delete(marketInventoryStrategies);
  await db.delete(marketTransportation);
  await db.delete(marketDiningSpots);
  await db.delete(marketAttractions);
  await db.delete(marketTargetCustomers);
  await db.delete(marketCustomerJourneys);
  await db.delete(marketCompetitors);
  await db.delete(aiDataSettings);
  await db.delete(markets);
  console.log("  Cleared.");
}

async function seedMarkets() {
  const inserted = await db.insert(markets).values(marketsData).returning();
  console.log(`  Inserted ${inserted.length} markets`);
  return Object.fromEntries(inserted.map((m) => [m.slug, m.id]));
}

async function seedCompetitors(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(competitorsData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketCompetitors).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} competitors`);
}

async function seedCustomerJourneys(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(customerJourneysData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketCustomerJourneys).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} customer journey stages`);
}

async function seedTargetCustomers(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(targetCustomersData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketTargetCustomers).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} target customer segments`);
}

async function seedAttractions(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(attractionsData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketAttractions).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} attractions`);
}

async function seedDiningSpots(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(diningSpotsData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketDiningSpots).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} dining spots`);
}

async function seedTransportation(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(transportationData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketTransportation).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} transportation routes`);
}

async function seedInventoryStrategies(marketIds: Record<string, string>) {
  let count = 0;
  for (const [slug, rows] of Object.entries(inventoryStrategiesData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    await db.insert(marketInventoryStrategies).values(rows.map((r) => ({ ...r, marketId })));
    count += rows.length;
  }
  console.log(`  Inserted ${count} inventory strategies`);
}

async function seedEvaluationCriteria() {
  const inserted = await db.insert(evaluationCriteria).values(evaluationCriteriaData).returning();
  console.log(`  Inserted ${inserted.length} evaluation criteria`);
  return inserted;
}

async function seedProperties(
  marketIds: Record<string, string>,
  criteriaRows: Array<{ id: string; criteriaName: string }>
) {
  let propCount = 0;
  let roomCount = 0;
  let pricingCount = 0;
  let evalCount = 0;

  // Evaluation value map per criteriaName — sample values for demo
  const evalValues: Record<string, Record<string, string>> = {
    "bien-xanh-phu-quy": {
      "Khoảng cách đến biển": "1km",
      "Khoảng cách đến trung tâm": "500m",
      "Khoảng cách đến cảng/bến tàu": "500m",
      "Diện tích phòng": "25–35m²",
      "View từ phòng": "Biển (tầng thượng)",
      "Loại giường": "Queen/Đôi",
      "Điều hòa nhiệt độ": "Có",
      "Wifi tốc độ": "20Mbps",
      "WC riêng hay chung": "Riêng",
      "Nước nóng lạnh": "Có",
      "Vệ sinh sạch sẽ": "Tốt",
      "Bữa sáng": "Tùy chọn (+50k)",
      "Cho thuê xe máy/xe đạp": "Có (150k/ngày)",
      "Hỗ trợ đặt tour": "Có",
      "Check-in/Check-out linh hoạt": "Linh hoạt",
      "View biển/vịnh": "Sân thượng",
      "View từ sân thượng/ban công": "Toàn cảnh biển",
    },
    "hoa-bien-phu-quy": {
      "Khoảng cách đến biển": "2km",
      "Khoảng cách đến trung tâm": "100m",
      "Khoảng cách đến cảng/bến tàu": "800m",
      "Diện tích phòng": "20–22m²",
      "View từ phòng": "Đường phố",
      "Loại giường": "Đôi/3 người",
      "Điều hòa nhiệt độ": "Có",
      "Wifi tốc độ": "15Mbps",
      "WC riêng hay chung": "Chung (STD) / Riêng (TRP)",
      "Nước nóng lạnh": "Có",
      "Vệ sinh sạch sẽ": "Khá",
      "Bữa sáng": "Không",
      "Cho thuê xe máy/xe đạp": "Có (120k/ngày)",
      "Hỗ trợ đặt tour": "Cơ bản",
      "Check-in/Check-out linh hoạt": "Tiêu chuẩn",
      "View biển/vịnh": "Không",
      "View từ sân thượng/ban công": "Không",
    },
    "coastal-escape-phu-quy": {
      "Khoảng cách đến biển": "Trực tiếp",
      "Khoảng cách đến trung tâm": "3km",
      "Khoảng cách đến cảng/bến tàu": "3km",
      "Diện tích phòng": "25–30m²",
      "View từ phòng": "Biển trực tiếp (DLX)",
      "Loại giường": "King/Queen",
      "Điều hòa nhiệt độ": "Có",
      "Wifi tốc độ": "30Mbps",
      "WC riêng hay chung": "Riêng",
      "Nước nóng lạnh": "Có",
      "Vệ sinh sạch sẽ": "Rất tốt",
      "Bữa sáng": "Bao gồm",
      "Cho thuê xe máy/xe đạp": "Có (miễn phí xe đạp)",
      "Hỗ trợ đặt tour": "Đầy đủ",
      "Check-in/Check-out linh hoạt": "Linh hoạt",
      "View biển/vịnh": "Ban công biển (DLX)",
      "View từ sân thượng/ban công": "Biển trực tiếp",
    },
    "lan-ha-bay-homestay": {
      "Khoảng cách đến biển": "2 phút đi bộ",
      "Khoảng cách đến trung tâm": "10 phút đi bộ",
      "Khoảng cách đến cảng/bến tàu": "15 phút đi xe",
      "Diện tích phòng": "22–32m²",
      "View từ phòng": "Vịnh (tầng 3)",
      "Loại giường": "Queen/King+Đơn",
      "Điều hòa nhiệt độ": "Có",
      "Wifi tốc độ": "25Mbps",
      "WC riêng hay chung": "Riêng",
      "Nước nóng lạnh": "Có",
      "Vệ sinh sạch sẽ": "Tốt",
      "Bữa sáng": "Tùy chọn (+60k)",
      "Cho thuê xe máy/xe đạp": "Có (xe đạp miễn phí)",
      "Hỗ trợ đặt tour": "Đầy đủ (kayak, VQG)",
      "Check-in/Check-out linh hoạt": "Linh hoạt",
      "View biển/vịnh": "Rooftop bar",
      "View từ sân thượng/ban công": "View vịnh tầng 3",
    },
    "cat-ba-sunrise-boutique": {
      "Khoảng cách đến biển": "10 phút đi bộ",
      "Khoảng cách đến trung tâm": "Trung tâm",
      "Khoảng cách đến cảng/bến tàu": "300m",
      "Diện tích phòng": "28–32m²",
      "View từ phòng": "Vịnh (DLX)",
      "Loại giường": "Đôi/King",
      "Điều hòa nhiệt độ": "Có",
      "Wifi tốc độ": "50Mbps",
      "WC riêng hay chung": "Riêng",
      "Nước nóng lạnh": "Có (bồn tắm DLX)",
      "Vệ sinh sạch sẽ": "Rất tốt",
      "Bữa sáng": "Buffet bao gồm",
      "Cho thuê xe máy/xe đạp": "Tour desk hỗ trợ",
      "Hỗ trợ đặt tour": "Đầy đủ",
      "Check-in/Check-out linh hoạt": "24h reception",
      "View biển/vịnh": "Ban công vịnh (DLX)",
      "View từ sân thượng/ban công": "View vịnh (DLX)",
    },
  };

  for (const [marketSlug, properties] of Object.entries(propertiesData)) {
    const marketId = marketIds[marketSlug];
    if (!marketId) continue;

    for (const prop of properties) {
      const { rooms, ...propData } = prop;

      const [insertedProp] = await db
        .insert(marketProperties)
        .values({ ...propData, marketId })
        .returning();
      if (!insertedProp) continue;
      propCount++;

      // Insert rooms
      for (const room of rooms) {
        const [insertedRoom] = await db
          .insert(propertyRooms)
          .values({ ...room, propertyId: insertedProp.id })
          .returning();
        if (!insertedRoom) continue;
        roomCount++;

        // Insert room pricing
        const premium = ROOM_PREMIUM[room.bookingCode] ?? 1.0;
        const pricingRows = [];
        for (const combo of COMBO_TYPES) {
          for (const day of DAY_TYPES) {
            const base = PRICE_MATRIX[combo]?.[day] ?? 1500000;
            const price = Math.round((base * premium) / 50000) * 50000;
            pricingRows.push({
              roomId: insertedRoom.id,
              comboType: combo,
              dayType: day,
              seasonName: "default",
              standardGuests: room.capacity > 2 ? 3 : 2,
              price,
              pricePlus1: Math.round(price * 1.15 / 50000) * 50000,
              priceMinus1: Math.round(price * 0.9 / 50000) * 50000,
              extraNight: Math.round((PRICE_MATRIX["per_night"]?.[day] ?? 1500000) * premium / 50000) * 50000,
            });
          }
        }
        await db.insert(roomPricing).values(pricingRows);
        pricingCount += pricingRows.length;
      }

      // Insert property evaluations
      const propEvalValues = evalValues[prop.slug] ?? {};
      const evalRows = criteriaRows
        .filter((c) => propEvalValues[c.criteriaName])
        .map((c) => ({
          propertyId: insertedProp.id,
          criteriaId: c.id,
          value: propEvalValues[c.criteriaName],
        }));
      if (evalRows.length > 0) {
        await db.insert(propertyEvaluations).values(evalRows);
        evalCount += evalRows.length;
      }
    }
  }

  console.log(`  Inserted ${propCount} properties, ${roomCount} rooms, ${pricingCount} pricing rows, ${evalCount} evaluations`);
}

async function seedItineraryTemplates(marketIds: Record<string, string>) {
  let templateCount = 0;
  let itemCount = 0;
  for (const [slug, templates] of Object.entries(itineraryTemplatesData)) {
    const marketId = marketIds[slug];
    if (!marketId) continue;
    for (const tpl of templates) {
      const { items, ...tplData } = tpl;
      const [inserted] = await db
        .insert(itineraryTemplates)
        .values({ ...tplData, marketId })
        .returning();
      if (!inserted) continue;
      templateCount++;
      await db.insert(itineraryTemplateItems).values(
        items.map((item) => ({ ...item, templateId: inserted.id }))
      );
      itemCount += items.length;
    }
  }
  console.log(`  Inserted ${templateCount} itinerary templates, ${itemCount} items`);
}

async function seedPricingConfigs() {
  await db.insert(pricingConfigs).values(pricingConfigsData);
  console.log(`  Inserted ${pricingConfigsData.length} pricing configs`);
}

async function seedAiSettings() {
  await db.insert(aiDataSettings).values(aiSettingsData);
  console.log(`  Inserted ${aiSettingsData.length} AI data settings`);
}

async function main() {
  console.log("Seeding market data...");
  try {
    await clearMarketData();
    const marketIds = await seedMarkets();
    await seedCompetitors(marketIds);
    await seedCustomerJourneys(marketIds);
    await seedTargetCustomers(marketIds);
    await seedAttractions(marketIds);
    await seedDiningSpots(marketIds);
    await seedTransportation(marketIds);
    await seedInventoryStrategies(marketIds);
    const criteriaRows = await seedEvaluationCriteria();
    await seedProperties(marketIds, criteriaRows);
    await seedItineraryTemplates(marketIds);
    await seedPricingConfigs();
    await seedAiSettings();
    console.log("Market data seed completed successfully!");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
