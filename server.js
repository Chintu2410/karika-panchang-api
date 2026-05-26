import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "Chintu_Api_8200";
const DATA_FILE = path.join(process.cwd(), "data", "panchang.json");

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || !safeEqual(key, API_KEY)) {
    return res.status(401).json({
      success: false,
      error: "Invalid or missing API key"
    });
  }
  next();
}

function readJson() {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function normalizeTime(value) {
  if (!value) return null;
  let v = String(value).trim().toUpperCase();
  v = v.replace(/s+/g, " ");
  v = v.replace("AM", "").replace("PM", "").trim();
  return v;
}

function normalizeVaar(vaar) {
  const map = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    thuseday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday"
  };
  const key = String(vaar || "").trim().toLowerCase();
  return map[key] || vaar || "";
}

function normalizeTithi(tithi) {
  const map = {
    pratipada: "Pratipada",
    dwitiya: "Dwitiya",
    tritiya: "Tritiya",
    chaturthi: "Chaturthi",
    panchami: "Panchami",
    shashthi: "Shashthi",
    saptami: "Saptami",
    ashtami: "Ashtami",
    navami: "Navami",
    dasami: "Dashami",
    dashami: "Dashami",
    ekadashi: "Ekadashi",
    dwadashi: "Dwadashi",
    trayodashi: "Trayodashi",
    chaturdashi: "Chaturdashi",
    purnima: "Purnima",
    amavasya: "Amavasya"
  };
  const key = String(tithi || "").trim().toLowerCase();
  return map[key] || tithi || "";
}

function normalizeNakshatra(nakshatra) {
  const map = {
    ashwini: "Ashwini",
    bharani: "Bharani",
    krittika: "Krittika",
    rohini: "Rohini",
    mrigashirsha: "Mrigashirsha",
    ardra: "Ardra",
    punarvasu: "Punarvasu",
    pushya: "Pushya",
    ashlesha: "Ashlesha",
    magha: "Magha",
    "u.fangul": "Uttara Phalguni",
    "uttara phalguni": "Uttara Phalguni"
  };
  const key = String(nakshatra || "").trim().toLowerCase();
  return map[key] || nakshatra || "";
}

function normalizeRashi(rashi) {
  const map = {
    mesha: "Mesha",
    vrishabha: "Vrishabha",
    mithuna: "Mithuna",
    karka: "Karka",
    simha: "Simha",
    simbaa: "Simha",
    kanya: "Kanya",
    tula: "Tula",
    vrischika: "Vrischika",
    dhanu: "Dhanu",
    makara: "Makara",
    kumbha: "Kumbha",
    meena: "Meena"
  };
  const key = String(rashi || "").trim().toLowerCase();
  return map[key] || rashi || "";
}

function cleanRecord(item) {
  return {
    date: item.date || null,
    vaar: normalizeVaar(item.vaar),
    tithi: normalizeTithi(item.tithi),
    nakshatra: normalizeNakshatra(item.nakshatra),
    sunrise: normalizeTime(item.sunrise),
    chandra_rashi: normalizeRashi(item.chandra_rashi)
  };
}

function getYearRecords(json, year) {
  const records = json[year];
  if (!Array.isArray(records)) return [];
  return records.map(cleanRecord);
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Karika Panchang API",
    version: "1.0.0",
    endpoints: {
      allDates: "/api/panchang/2026",
      oneDate: "/api/panchang/2026/2026-05-26"
    }
  });
});

app.get("/api/panchang/:year", requireApiKey, (req, res) => {
  try {
    const { year } = req.params;
    const json = readJson();
    const data = getYearRecords(json, year);

    if (!data.length) {
      return res.status(404).json({
        success: false,
        error: `No records found for year ${year}`
      });
    }

    res.json({
      success: true,
      year,
      total: data.length,
      data
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to load Panchang data"
    });
  }
});

app.get("/api/panchang/:year/:date", requireApiKey, (req, res) => {
  try {
    const { year, date } = req.params;
    const json = readJson();
    const data = getYearRecords(json, year);
    const record = data.find(item => item.date === date);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `No Panchang found for ${date}`
      });
    }

    res.json({
      success: true,
      year,
      date,
      data: record
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to load Panchang data"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});