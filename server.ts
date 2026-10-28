import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or holds default placeholder. Falling back to local AI simulation.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Chat Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history, language } = req.body;
  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return highly realistic simulation responses if API key is not configured
      return simulateChatResponse(message, language, res);
    }

    // Format chat history for the standard Gemini chat
    const systemPrompt = `You are SAHARA AI, an enterprise-grade emergency safety companion. 
You are highly helpful, reassuring, and concise. Offer rapid first aid guidance, route navigation tips, 
or safety protocols depending on the user's distress. Keep answers professional and compact (under 3 paragraphs). 
Always prioritize user safety and instruct them to seek professional medical or emergency services when needed.
${language === "hi" ? "You MUST reply ONLY in Hindi (using Devanagari script)." : "You MUST reply ONLY in English."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
        ...(history || []).map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        })),
        { role: "user", parts: [{ text: message }] }
      ]
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ 
      error: "Error processing chat message", 
      details: error.message,
      simulated: true,
      text: language === "hi" 
        ? "मुझे आपका सिग्नल मिल रहा है, लेकिन नेटवर्क में थोड़ी गिरावट आ रही है। मुझे निकटतम सुरक्षा बिंदु पर आपका मार्गदर्शन करने दें: सेंट मैरी लेवल 1 ट्रॉमा सेंटर 1.2 किमी दूर है। कृपया अपनी स्थिति बनाए रखें, और मैं तत्काल चिकित्सा सहायता भेजूंगा।"
        : "I am receiving your signal, but experiencing minor network degradation. Let me guide you to the nearest safety point: St. Mary's Level 1 Trauma Center is 1.2km away. Please maintain your position, and I will dispatch immediate medical aid."
    });
  }
});

// AI Emergency Coordination Endpoint
app.post("/api/gemini/coordinate", async (req, res) => {
  try {
    const { emergencyType, userLocation, message, bloodType } = req.body;
    
    const ai = getGeminiClient();
    if (!ai) {
      return simulateCoordinateResponse(emergencyType, userLocation, message, res);
    }

    const prompt = `Formulate a rapid Emergency Coordination and Response plan for the following event:
Emergency Type: ${emergencyType || "Unspecified Distress"}
User Current Location: ${userLocation || "Mumbai, IN"}
User Blood Type: ${bloodType || "O+"}
Distress Message: ${message || "SOS alert triggered via Sahara button"}

Provide a structured response in valid JSON with these fields:
1. severity: ("HIGH", "CRITICAL", or "MEDIUM")
2. dispatchVehicle: (e.g. "Ambulance 402", "Trauma Unit B")
3. estimatedEta: (integer representing minutes, e.g. 4)
4. actionSteps: (array of strings outlining first aid or protective actions)
5. responderInstruction: (string showing what instructions have been sent to the responder)
6. blockchainProofPayload: (string summary of data hash to prove record creation on ledger)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: { type: Type.STRING },
            dispatchVehicle: { type: Type.STRING },
            estimatedEta: { type: Type.INTEGER },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            responderInstruction: { type: Type.STRING },
            blockchainProofPayload: { type: Type.STRING }
          },
          required: ["severity", "dispatchVehicle", "estimatedEta", "actionSteps", "responderInstruction", "blockchainProofPayload"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Coordinate Error:", error);
    res.status(500).json({ 
      error: "Error coordinating emergency", 
      details: error.message,
      simulated: true,
      severity: "HIGH",
      dispatchVehicle: "Ambulance 402",
      estimatedEta: 4,
      actionSteps: [
        "Sit upright and try to regulate your breathing.",
        "Keep your phone active; emergency dispatch is tracking your exact beacon signal.",
        "A volunteer from the Sahara Mesh network has been notified and is heading to your coordinates."
      ],
      responderInstruction: "Urgent response: dispatch Level-1 Trauma team to current coordinates. Patient Blood Type: O+.",
      blockchainProofPayload: "0x" + Math.random().toString(16).substr(2, 32)
    });
  }
});

// Simulated fallbacks for presenters
function simulateChatResponse(message: string, language: string, res: any) {
  const isHindi = language === "hi";
  const msgLower = message.toLowerCase();
  let responseText = "";

  if (msgLower.includes("pulse") || msgLower.includes("heart") || msgLower.includes("health")) {
    responseText = isHindi 
      ? "आपकी स्वास्थ्य निगरानी लॉग एक विश्राम हृदय गति 114 बीपीएम इंगित करता है। प्रतिक्रिया एड्रेनालाईन के कारण यह ऊंचा है, लेकिन आपका श्वसन स्थिर दिखता है। कृपया 3 गहरी, धीमी सांसें लें। मैंने सक्रिय उत्तरदाता के साथ आपके मेडिकल कार्ड को सिंक्रनाइज़ किया है।"
      : "Your health monitoring log indicates a resting heart rate of 114 BPM. This is elevated due to response adrenaline, but your respiration looks stable. Please take 3 deep, slow breaths. I have synchronized your medical card with the active responder.";
  } else if (msgLower.includes("pharmacy") || msgLower.includes("store") || msgLower.includes("medicine")) {
    responseText = isHindi
      ? "निकटतम 24 घंटे की फार्मेसी आपके जीपीएस क्षेत्र में 400 मीटर की दूरी पर स्थित है। यदि आप दर्द का अनुभव कर रहे हैं, तो दिशा-निर्देश प्राप्त करें। यदि यह एक आपात स्थिति है, तो 5 सेकंड के लिए एसओएस बटन दबाए रखें।"
      : "The nearest 24h pharmacy is located 400m away in your GPS sector. If you need pain management, request directions. If this is an emergency, press and hold the SOS button for 5 seconds.";
  } else if (msgLower.includes("location") || msgLower.includes("where am i")) {
    responseText = isHindi
      ? "मैंने आपके सटीक उपग्रह बीकन को लॉक कर दिया है। आपका जीपीएस सिग्नल सत्यापित है। हमारा मेश सिग्नल इंगित करता है कि सेलुलर टावर विफल होने पर नेटवर्क ट्रैफ़िक को पाटने के लिए पास के सक्रिय नोड्स तैयार हैं।"
      : "I have locked your precise satellite beacon to your current GPS coordinates. Our mesh signal indicates nearby active nodes ready to bridge network traffic if cellular towers fail.";
  } else {
    responseText = isHindi
      ? "समझा। मैं सहारा एआई हूँ, आपके पर्यावरण की निगरानी कर रहा हूँ। मैंने अपने स्थानीय आपातकालीन मेश और आपके तत्काल क्षेत्र में सत्यापित उत्तरदाताओं को सतर्क किया है। यदि आपको किसी विशिष्ट प्राथमिक चिकित्सा गाइड या सुरक्षित मार्ग नेविगेशन की आवश्यकता है, तो बस पूछें।"
      : "Understood. I am SAHARA AI, monitoring your environment. I have primed our local emergency mesh and verified responders in your immediate sector. If you need a specific first aid guide or safe route navigation, just ask.";
  }

  return res.json({ text: responseText });
}

function simulateCoordinateResponse(emergencyType: string, userLocation: string, message: string, res: any) {
  const type = (emergencyType || "medical").toLowerCase();
  
  let severity = "CRITICAL";
  let dispatchVehicle = "Ambulance 402";
  let estimatedEta = 4;
  let actionSteps: string[] = [];
  let responderInstruction = "";
  let reasoning = {
    detectedType: "Medical Distress",
    indicators: ["High heart rate telemetry", "Vocal urgency detected", "Medical emergency pattern matched"],
    dispatching: ["Level-1 ICU Ambulance", "Nearest Hospital Emergency Ward", "First-responder Volunteer"]
  };

  if (type.includes("medical") || type.includes("heart") || type.includes("accident") || type.includes("bites") || type.includes("poison") || type.includes("fracture") || type.includes("stroke") || type.includes("injury")) {
    severity = "CRITICAL";
    dispatchVehicle = "ICU Ambulance 402";
    estimatedEta = 3;
    actionSteps = [
      "Keep the patient lying down and monitor breathing.",
      "Sahara has shared your emergency medical profile with the nearest hospital.",
      "A nearby volunteer with medical first-aid kit has been dispatched.",
      "Critical Care doctor is on standby on voice channel."
    ];
    responderInstruction = "URGENT dispatch: Cardiac ICU Ambulance en route. Clear secure routing to GPS coordinates.";
    reasoning = {
      detectedType: "Critical Medical Emergency",
      indicators: ["Medical keyword / distress detected", "No fire or threat markers present", "High priority triage level 1"],
      dispatching: ["ICU Ambulance Unit", "Emergency Care Ward", "Community First Responder"]
    };
  } else if (type.includes("police") || type.includes("assault") || type.includes("robbery") || type.includes("threat") || type.includes("security") || type.includes("violence") || type.includes("crime") || type.includes("harassment") || type.includes("kidnap") || type.includes("shooter") || type.includes("trespass") || type.includes("domestic")) {
    severity = "CRITICAL";
    dispatchVehicle = "Police Patrol Unit 108";
    estimatedEta = 5;
    actionSteps = [
      "Find a secure, locked space or high-activity public area if possible.",
      "Keep device screen dark; silent audio feed is streaming to local police room.",
      "Control room has dispatched police intercept unit.",
      "Emergency SMS and live beacon broadcast sent to your emergency contacts."
    ];
    responderInstruction = "Active threat/crime alert: immediate Police intercept required. Approaching silently. Telemetry streaming live.";
    reasoning = {
      detectedType: "Security Threat / Assault",
      indicators: ["Threat pattern matched", "Silent recording mode triggered", "High urgency response required"],
      dispatching: ["Rapid Patrol Unit 108", "Police Intercept Control", "Emergency Contact Network"]
    };
  } else if (type.includes("fire") || type.includes("gas") || type.includes("explosion") || type.includes("smoke") || type.includes("electrical")) {
    severity = "CRITICAL";
    dispatchVehicle = "Fire Tender Engine 55";
    estimatedEta = 6;
    actionSteps = [
      "Evacuate the structure immediately. Stay close to the ground to avoid smoke.",
      "Do not use elevators. Head to open space.",
      "Engine 55 and rescue response team dispatched from sector fire station.",
      "Local gas mains shutdown protocol triggered automatically."
    ];
    responderInstruction = "Fire/hazmat alert: full crew and water tender dispatched. Local hydrant mesh active. Search and rescue prioritized.";
    reasoning = {
      detectedType: "Fire & Hazard Alert",
      indicators: ["Smoke/Fire hazard reported", "Evacuation protocol required", "Sector station alert raised"],
      dispatching: ["Fire Engine Tender 55", "Hazard Relief Squad", "Utility Mains Controller"]
    };
  } else if (type.includes("women") || type.includes("companion") || type.includes("abuse") || type.includes("stalking") || type.includes("eve-teasing") || type.includes("unsafe")) {
    severity = "HIGH";
    dispatchVehicle = "Women Safety Intercept Patrol & Escort";
    estimatedEta = 4;
    actionSteps = [
      "Stay on a public, well-lit street. Do not enter isolated pathways.",
      "Live location tracking active: emergency contacts and nearest verified female volunteers notified.",
      "Special Women Protection unit is intercepting your coordinates.",
      "Direct live audio and camera recording enabled and sealed to decentralized vault."
    ];
    responderInstruction = "Safety escort required: target companion mode activated. Special Intercept moving to secure coordinates. Maintain active voice.";
    reasoning = {
      detectedType: "Women Safety & Stalking Hazard",
      indicators: ["Unsafe path / harassment reported", "Live audio recording enabled", "Companion escort requested"],
      dispatching: ["Rapid Women Safety Squad", "Verified Female Volunteers", "Vault Incident Logger"]
    };
  } else if (type.includes("farmer") || type.includes("agro") || type.includes("snake") || type.includes("crop") || type.includes("well") || type.includes("rural") || type.includes("veterinary") || type.includes("cattle") || type.includes("pesticide") || type.includes("tractor")) {
    severity = "HIGH";
    dispatchVehicle = "Rural Agri-Medic Team & Anti-Venom Unit";
    estimatedEta = 8;
    actionSteps = [
      "If snake bite: remain completely still, immobilize the limb. Do not apply a tight tourniquet.",
      "Local agri volunteer group notified via mesh network.",
      "Ambulance carrying anti-venom and crop-hazard response team dispatched.",
      "Nearby farmer mesh validators coordinating path bypass."
    ];
    responderInstruction = "Rural/farmer emergency: Dispatch anti-venom specialist and local volunteers. High bypass routing needed due to terrain.";
    reasoning = {
      detectedType: "Agricultural / Snake Bite Emergency",
      indicators: ["Rural / Agro emergency pattern", "Anti-venom protocol triggered", "Mesh relay notified"],
      dispatching: ["Rural Anti-Venom Squad", "Agri First Responder", "Local Volunteer Mesh"]
    };
  } else if (type.includes("flood") || type.includes("disaster") || type.includes("storm") || type.includes("cyclone") || type.includes("landslide") || type.includes("rain") || type.includes("drowning") || type.includes("earthquake") || type.includes("tsunami")) {
    severity = "CRITICAL";
    dispatchVehicle = "Disaster Response Rescue Boat & Relief Unit";
    estimatedEta = 12;
    actionSteps = [
      "Move to the highest stable level of the structure. Do NOT enter moving water.",
      "Disaster response force notified with your live coordinates.",
      "Decentralized boat rescue team dispatched to your sector.",
      "Nearby temporary shelter coordinates and emergency supply unlocked."
    ];
    responderInstruction = "Flood rescue active: boat unit and relief supply coordinated. Telemetry broadcast on disaster beacon frequencies.";
    reasoning = {
      detectedType: "Natural Disaster / Flood Emergency",
      indicators: ["Severe weather hazard detected", "Water level / shelter warning", "High priority evacuation"],
      dispatching: ["Disaster Rescue Boat Unit", "Relief Supply Squad", "Emergency Shelter Network"]
    };
  } else {
    // Default fallback
    severity = "CRITICAL";
    dispatchVehicle = "Emergency Response Vehicle 20";
    estimatedEta = 4;
    actionSteps = [
      "Please stay calm and keep this application open.",
      "Decentralized mesh broadcast is active and sharing telemetry.",
      "Emergency responder has been notified and coordinates locked."
    ];
    responderInstruction = `Distress alert triggered: ${emergencyType || "Distress"}. Coordinate lock established. Prepare response protocols.`;
  }

  const timeSeed = Date.now().toString(16);
  const typeSeed = Array.from(type).reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16);

  return res.json({
    severity,
    dispatchVehicle,
    estimatedEta,
    actionSteps,
    responderInstruction,
    reasoning,
    blockchainProofPayload: `0x7d6f${typeSeed}a31b${timeSeed}`
  });
}

// Helper to mathematically calculate moon phase based on a date
function getMoonPhase(date: Date): { name: string; icon: string } {
  const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const synodicPeriod = 29.530588853;
  const diffDays = (date.getTime() - knownNewMoon) / msPerDay;
  const phase = (diffDays / synodicPeriod) % 1;
  const normalizedPhase = phase < 0 ? phase + 1 : phase;
  
  if (normalizedPhase < 0.03 || normalizedPhase > 0.97) return { name: "New Moon", icon: "🌑" };
  if (normalizedPhase < 0.22) return { name: "Waxing Crescent", icon: "🌒" };
  if (normalizedPhase < 0.28) return { name: "First Quarter", icon: "🌓" };
  if (normalizedPhase < 0.47) return { name: "Waxing Gibbous", icon: "🌔" };
  if (normalizedPhase < 0.53) return { name: "Full Moon", icon: "🌕" };
  if (normalizedPhase < 0.72) return { name: "Waning Gibbous", icon: "🌖" };
  if (normalizedPhase < 0.78) return { name: "Last Quarter", icon: "🌗" };
  return { name: "Waning Crescent", icon: "🌘" };
}

// Weather Forecasting System Endpoint
app.get("/api/weather", async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : null;

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "Latitude and Longitude query parameters are required." });
    }

    // 1. Reverse geocoding using Nominatim (OpenStreetMap)
    let locationName = {
      village: "",
      city: "",
      district: "",
      state: "",
      country: ""
    };

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "SaharaEmergencyPlatform/1.0 (contact: tanusamadhiya9@gmail.com)"
          }
        }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const address = geoData.address || {};
        locationName = {
          village: address.village || address.hamlet || address.suburb || address.neighbourhood || address.city_district || address.town || address.road || "",
          city: address.city || address.town || address.city_district || address.municipality || "",
          district: address.county || address.district || address.state_district || address.city || "",
          state: address.state || "",
          country: address.country || ""
        };
      }
    } catch (err) {
      console.error("Reverse geocoding failed, using coordinates:", err);
    }

    // If reverse geocoding is empty, provide coordinate fallbacks
    if (!locationName.village && !locationName.city) {
      locationName.village = `GPS Point (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
      locationName.city = "Unknown Area";
      locationName.district = "Unknown District";
    }

    // 2. Fetch from Open-Meteo Weather API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_max&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo API returned status ${weatherRes.status}`);
    }
    const weatherData = await weatherRes.json();

    // 3. Fetch from Open-Meteo Air Quality API
    let aqIndex = 42; // default safe value in case AQI is offline
    try {
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
      const aqRes = await fetch(aqUrl);
      if (aqRes.ok) {
        const aqData = await aqRes.json();
        if (aqData.current && aqData.current.us_aqi !== undefined) {
          aqIndex = Math.round(aqData.current.us_aqi);
        }
      }
    } catch (err) {
      console.error("Air Quality API failed:", err);
    }

    // Process current weather variables
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};
    const hourly = weatherData.hourly || {};

    const temp = current.temperature_2m ?? 27.5;
    const feelsLike = current.apparent_temperature ?? temp;
    const humidity = current.relative_humidity_2m ?? 65;
    const windSpeed = current.wind_speed_10m ?? 12.4;
    const windDirection = current.wind_direction_10m ?? 180;
    const visibility = (current.visibility ?? 10000) / 1000; // convert to km
    const pressure = current.pressure_msl ?? 1013;
    const uvIndex = current.uv_index ?? 3.5;
    const cloudCoverage = current.cloud_cover ?? 40;
    const weatherCode = current.weather_code ?? 0;

    // Dew point calculation: Td = T - ((100 - RH)/5)
    const dewPoint = parseFloat((temp - ((100 - humidity) / 5)).toFixed(1));

    // Sunrise and sunset strings
    const sunriseISO = daily.sunrise?.[0] || new Date().toISOString();
    const sunsetISO = daily.sunset?.[0] || new Date().toISOString();
    const formatSunTime = (isoStr: string) => {
      try {
        const date = new Date(isoStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return "06:00 AM";
      }
    };
    const sunrise = formatSunTime(sunriseISO);
    const sunset = formatSunTime(sunsetISO);

    // Weather code to text dictionary
    const codeMap: { [key: number]: { text: string; icon: string } } = {
      0: { text: "Clear Sky", icon: "☀" },
      1: { text: "Mainly Clear", icon: "🌤" },
      2: { text: "Partly Cloudy", icon: "⛅" },
      3: { text: "Overcast", icon: "☁" },
      45: { text: "Foggy", icon: "🌫" },
      48: { text: "Depositing Rime Fog", icon: "🌫" },
      51: { text: "Light Drizzle", icon: "🌧" },
      53: { text: "Moderate Drizzle", icon: "🌧" },
      55: { text: "Dense Drizzle", icon: "🌧" },
      56: { text: "Light Freezing Drizzle", icon: "🌧" },
      57: { text: "Dense Freezing Drizzle", icon: "🌧" },
      61: { text: "Slight Rain", icon: "🌧" },
      63: { text: "Moderate Rain", icon: "🌧" },
      65: { text: "Heavy Rain", icon: "🌧" },
      66: { text: "Light Freezing Rain", icon: "🌧" },
      67: { text: "Heavy Freezing Rain", icon: "🌧" },
      71: { text: "Slight Snow Fall", icon: "❄" },
      73: { text: "Moderate Snow Fall", icon: "❄" },
      75: { text: "Heavy Snow Fall", icon: "❄" },
      77: { text: "Snow Grains", icon: "❄" },
      80: { text: "Slight Rain Showers", icon: "🌧" },
      81: { text: "Moderate Rain Showers", icon: "🌧" },
      82: { text: "Violent Rain Showers / Cloudburst", icon: "⛈" },
      85: { text: "Slight Snow Showers", icon: "❄" },
      86: { text: "Heavy Snow Showers", icon: "❄" },
      95: { text: "Thunderstorm", icon: "⛈" },
      96: { text: "Thunderstorm with Slight Hail", icon: "⛈" },
      99: { text: "Thunderstorm with Heavy Hail", icon: "⛈" }
    };

    const condition = codeMap[weatherCode] || { text: "Partly Cloudy", icon: "⛅" };

    // Calculate Moon Phase
    const moonPhaseInfo = getMoonPhase(new Date());

    // Generate Hourly Forecast (Next 24 hours)
    const hourlyForecast = [];
    if (hourly.time) {
      for (let i = 0; i < 24; i++) {
        const timeIndex = i;
        if (hourly.time[timeIndex]) {
          const forecastTime = new Date(hourly.time[timeIndex]);
          let timeLabel = forecastTime.toLocaleTimeString([], { hour: '2-digit' });
          
          hourlyForecast.push({
            time: timeLabel,
            temp: hourly.temperature_2m?.[timeIndex] ?? temp,
            rainChance: hourly.precipitation_probability?.[timeIndex] ?? 0,
            humidity: hourly.relative_humidity_2m?.[timeIndex] ?? humidity,
            windSpeed: hourly.wind_speed_10m?.[timeIndex] ?? windSpeed,
            conditionCode: hourly.weather_code?.[timeIndex] ?? 0,
            conditionText: (codeMap[hourly.weather_code?.[timeIndex] ?? 0] || { text: "Clear", icon: "☀" }).text,
            conditionIcon: (codeMap[hourly.weather_code?.[timeIndex] ?? 0] || { text: "Clear", icon: "☀" }).icon
          });
        }
      }
    }

    // Generate 7-Day Forecast
    const dailyForecast = [];
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (daily.time) {
      for (let i = 0; i < 7; i++) {
        if (daily.time[i]) {
          const fDate = new Date(daily.time[i]);
          const dayName = i === 0 ? "Today" : daysOfWeek[fDate.getDay()];
          dailyForecast.push({
            day: dayName,
            maxTemp: daily.temperature_2m_max?.[i] ?? temp,
            minTemp: daily.temperature_2m_min?.[i] ?? temp - 5,
            rainChance: daily.precipitation_probability_max?.[i] ?? 0,
            conditionCode: daily.weather_code?.[i] ?? 0,
            conditionText: (codeMap[daily.weather_code?.[i] ?? 0] || { text: "Clear", icon: "☀" }).text,
            conditionIcon: (codeMap[daily.weather_code?.[i] ?? 0] || { text: "Clear", icon: "☀" }).icon,
            windSpeed: daily.wind_speed_10m_max?.[i] ?? windSpeed,
            humidity: daily.relative_humidity_2m_max?.[i] ?? humidity,
            sunrise: formatSunTime(daily.sunrise?.[i]),
            sunset: formatSunTime(daily.sunset?.[i])
          });
        }
      }
    }

    // Analyze Rainfall Probability & Prediction Messages
    let rainPrediction = "☀ No rainfall expected today.";
    let rainChanceToday = daily.precipitation_probability_max?.[0] ?? 0;
    
    // Check next 12 hours for rain
    let rainInNextHours = false;
    let rainHourIndex = -1;
    for (let i = 0; i < 12; i++) {
      if (hourlyForecast[i] && hourlyForecast[i].rainChance > 40) {
        rainInNextHours = true;
        rainHourIndex = i;
        break;
      }
    }

    if (rainInNextHours && rainHourIndex !== -1) {
      const chance = hourlyForecast[rainHourIndex].rainChance;
      const hourLabel = hourlyForecast[rainHourIndex].time;
      if (chance > 75) {
        rainPrediction = `⛈ Heavy rainfall expected around ${hourLabel} (${chance}% probability).`;
      } else if (chance > 50) {
        rainPrediction = `🌧 Rain expected within the next 2 hours, starting around ${hourLabel} (${chance}% probability).`;
      } else {
        rainPrediction = `🌧 Light rain expected after ${hourLabel} (${chance}% probability).`;
      }
    } else if (rainChanceToday > 30) {
      rainPrediction = `🌦 Scattered rain showers likely today (${rainChanceToday}% chance).`;
    }

    // Severe Weather Alert Engine
    const alerts = [];
    
    if ([65, 81, 82].includes(weatherCode)) {
      alerts.push({
        type: "Heavy Rain",
        severity: "CRITICAL",
        icon: "🌧",
        description: "Intense torrential downpour active in your sector. High probability of localized flooding, poor visibility, and waterlogging.",
        recommendation: "Seek shelter on high ground. Avoid low-lying paths, underpasses, and drainage channels. Move agricultural produce to dry spots."
      });
    }

    if (weatherCode === 82) {
      alerts.push({
        type: "Cloudburst Warning",
        severity: "CRITICAL",
        icon: "⛈",
        description: "Catastrophic, rapid flash-rain event detected near your exact GPS coordinates. Severe flash flooding imminent.",
        recommendation: "URGENT: Evacuate from valley beds, riverbanks, and unstable hill slopes immediately. Climb to higher structures."
      });
    }

    if ([95, 96, 99].includes(weatherCode)) {
      alerts.push({
        type: "Severe Thunderstorm & Lightning",
        severity: "CRITICAL",
        icon: "⛈",
        description: "Violent electric thunderstorm with active cloud-to-ground lightning bolts registered within your micro-sector.",
        recommendation: "Stay indoors. Disconnect electrical appliances. Do NOT seek shelter under isolated trees, metal sheds, or near water wells."
      });
    }

    if (windSpeed > 35) {
      alerts.push({
        type: "Strong Winds Advisory",
        severity: "HIGH",
        icon: "💨",
        description: `Dangerous gusting winds reaching up to ${windSpeed.toFixed(1)} km/h. Structural hazards and tree fall risks are elevated.`,
        recommendation: "Avoid standing near weak structures, high billboards, or old power-line posts. Secure loose rooftop objects."
      });
    }

    if (temp > 40) {
      alerts.push({
        type: "Extreme Heatwave Warning",
        severity: "CRITICAL",
        icon: "🥵",
        description: `Dangerous ambient thermal spike of ${temp.toFixed(1)}°C. High risk of hyperthermia, heatstroke, and severe crop dehydration.`,
        recommendation: "Drink saline-infused water or ORS. Keep cattle in shade. Do not engage in heavy manual field work between 11:00 AM and 04:00 PM."
      });
    }

    if (temp < 10) {
      alerts.push({
        type: "Cold Wave Alert",
        severity: "HIGH",
        icon: "🥶",
        description: `Uncharacteristic rapid temperature drop down to ${temp.toFixed(1)}°C. Elevated risk of frost damage to winter crops and hypothermia for livestock.`,
        recommendation: "Cover nursery beds with mulch. Use jute sacks to insulate cattle beds. Keep warm, dry clothing on standby."
      });
    }

    if (weatherCode === 45 || weatherCode === 48 || visibility < 1) {
      alerts.push({
        type: "Dense Fog & Low Visibility",
        severity: "HIGH",
        icon: "🌫",
        description: "Thick fog layer restricting visibility below 1 kilometer. Immediate travel and driving hazard.",
        recommendation: "Avoid driving unless urgent. Use low-beam fog lights and hazards."
      });
    }

    if (windSpeed > 60 && [65, 81, 82, 95].includes(weatherCode)) {
      alerts.push({
        type: "Cyclone Warning",
        severity: "CRITICAL",
        icon: "🌀",
        description: "Extremely violent wind cyclonic rotation accompanied by torrential cloudburst. Maximum hazard to life and property.",
        recommendation: "URGENT: Evacuate immediately to designated RCC cyclone concrete shelters. Shut off domestic gas and main electric lines."
      });
    }

    if ([65, 82].includes(weatherCode)) {
      alerts.push({
        type: "Flood & Landslide Risk",
        severity: "CRITICAL",
        icon: "⚠️",
        description: "Heavy rain saturation has reached critical soil thresholds. High risk of landslide on slope faces and village bank breaching.",
        recommendation: "Avoid traveling along mountain roads. Report any bubbling earth or crack lines in clay slopes to Sahara emergency desk."
      });
    }

    // Farmer Weather Mode Specific Advisories
    const farmerAdvisories = [];
    
    if (rainInNextHours) {
      farmerAdvisories.push({
        topic: "Irrigation Scheduling",
        status: "AVOID",
        severity: "WARNING",
        message: "Rain is expected in your village within the next 12 hours. Suspend active canal/well irrigation to prevent crop root-rot and water wastage."
      });
    } else {
      farmerAdvisories.push({
        topic: "Irrigation Scheduling",
        status: "SAFE",
        severity: "SAFE",
        message: "No rain expected for 24h. Ideal window for scheduled drip and surface irrigation. Target early morning hours."
      });
    }

    if (rainInNextHours) {
      farmerAdvisories.push({
        topic: "Pesticide Spraying",
        status: "SUSPEND",
        severity: "DANGER",
        message: "Expected rainfall will wash away sprayed chemicals. Postpone pesticide/fertilizer applications for 24-48 hours to save costs."
      });
    } else if (windSpeed > 20) {
      farmerAdvisories.push({
        topic: "Pesticide Spraying",
        status: "DELAY",
        severity: "WARNING",
        message: `High wind speed of ${windSpeed.toFixed(1)} km/h will cause chemical spray drift. Avoid spraying today to protect nearby crops.`
      });
    } else {
      farmerAdvisories.push({
        topic: "Pesticide Spraying",
        status: "SUITABLE",
        severity: "SAFE",
        message: "Low wind and sunny/clear forecast. Highly favorable conditions for fertilizer and pesticide spraying."
      });
    }

    if ([65, 82, 95].includes(weatherCode)) {
      farmerAdvisories.push({
        topic: "Harvesting & Storage",
        status: "EMERGENCY",
        severity: "DANGER",
        message: "Severe downpour imminent. Harvest matured grains/fruits immediately and move them to elevated concrete storages with moisture proof tarps."
      });
    } else {
      farmerAdvisories.push({
        topic: "Harvesting & Crop Care",
        status: "OPTIMAL",
        severity: "SAFE",
        message: "Favorable dry weather. Great window for harvesting winter rabi crops or sun-drying seeds."
      });
    }

    // Disaster Risk Matrix (Low / Moderate / High / Critical)
    const disasterRisks = {
      flood: "Low",
      lightning: "Low",
      storm: "Low",
      heatwave: "Low",
      wind: "Low"
    };

    if ([65, 82].includes(weatherCode)) disasterRisks.flood = "Critical";
    else if ([63, 81].includes(weatherCode)) disasterRisks.flood = "High";
    else if ([61, 55, 80].includes(weatherCode)) disasterRisks.flood = "Moderate";

    if ([96, 99].includes(weatherCode)) disasterRisks.lightning = "Critical";
    else if (weatherCode === 95) disasterRisks.lightning = "High";
    else if (cloudCoverage > 75) disasterRisks.lightning = "Moderate";

    if (windSpeed > 50) disasterRisks.storm = "Critical";
    else if (windSpeed > 35 || [95, 96, 99].includes(weatherCode)) disasterRisks.storm = "High";
    else if (windSpeed > 20) disasterRisks.storm = "Moderate";

    if (temp > 42) disasterRisks.heatwave = "Critical";
    else if (temp > 38) disasterRisks.heatwave = "High";
    else if (temp > 33) disasterRisks.heatwave = "Moderate";

    if (windSpeed > 45) disasterRisks.wind = "Critical";
    else if (windSpeed > 30) disasterRisks.wind = "High";
    else if (windSpeed > 15) disasterRisks.wind = "Moderate";

    const consolidatedWeather = {
      location: locationName,
      coordinates: { lat, lon },
      current: {
        temp: parseFloat(temp.toFixed(1)),
        feelsLike: parseFloat(feelsLike.toFixed(1)),
        conditionText: condition.text,
        conditionIcon: condition.icon,
        conditionCode: weatherCode,
        humidity,
        windSpeed: parseFloat(windSpeed.toFixed(1)),
        windDirection,
        visibility: parseFloat(visibility.toFixed(1)),
        pressure,
        uvIndex,
        aqi: aqIndex,
        dewPoint,
        cloudCoverage,
        sunrise,
        sunset,
        moonPhase: moonPhaseInfo,
        lastUpdated: new Date().toISOString()
      },
      hourly: hourlyForecast,
      daily: dailyForecast,
      rainPrediction,
      alerts,
      farmerAdvisories,
      disasterRisks
    };

    res.json(consolidatedWeather);

  } catch (error: any) {
    console.error("Weather Service Error:", error);
    res.status(500).json({ error: "Failed to fetch weather data from real-time sources.", details: error.message });
  }
});

// Vite integration middleware & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
