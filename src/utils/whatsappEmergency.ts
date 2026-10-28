import { FamilyContact, UserProfile } from "../types";

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  // If 10 digits without country code, assume India (+91)
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

export function getSampleFamilyContacts(): FamilyContact[] {
  return [
    { id: "f1", name: "Siddharth Dev", relation: "Brother", phone: "+91 98123 45678", status: "safe", lat: 19.0790, lng: 72.8790, lastSeen: "5 mins ago via Mesh" },
    { id: "f2", name: "Kiran Dev", relation: "Mother", phone: "+91 98123 45679", status: "safe", lat: 19.0720, lng: 72.8750, lastSeen: "12 mins ago via SMS" },
    { id: "f3", name: "Rajesh Dev", relation: "Father", phone: "+91 98123 45680", status: "alert", lat: 19.0810, lng: 72.8830, lastSeen: "1 min ago via Voice IVR" },
  ];
}

export function getStoredFamilyContacts(userProfile?: UserProfile): FamilyContact[] {
  try {
    const saved = localStorage.getItem("sahara_family_contacts");
    if (saved) {
      const parsed: FamilyContact[] = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load family contacts from storage:", e);
  }

  // If user profile has emergency contacts, return them
  if (userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0) {
    return userProfile.emergencyContacts.map((ec, idx) => ({
      id: `ec-${idx}`,
      name: ec.name,
      relation: ec.relation || "Family",
      phone: ec.phone,
      status: "safe",
      lat: 19.0760,
      lng: 72.8777,
      lastSeen: "Registered in Profile"
    }));
  }

  return [];
}

export function generateEmergencyWhatsAppMessage(
  userName: string,
  locationAddress: string,
  lat: number,
  lng: number,
  emergencyType: string = "Critical Medical / SOS Alert"
): string {
  const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;
  const timeStr = new Date().toLocaleString();

  return (
    `🚨 *EMERGENCY SOS ALERT - SAHARA SECURITY MESH* 🚨\n\n` +
    `*User:* ${userName || 'Emergency User'}\n` +
    `*Alert Type:* ${emergencyType}\n` +
    `*Location:* ${locationAddress || 'Current GPS Beacon Locked'}\n` +
    `*Live GPS Link:* ${mapsUrl}\n` +
    `*Timestamp:* ${timeStr}\n\n` +
    `⚠️ *URGENT:* I have activated my emergency button. Please check my location on Google Maps or contact local emergency services immediately!`
  );
}

export function getWhatsAppDirectUrl(phone: string, message: string): string {
  const cleanNum = cleanPhoneNumber(phone);
  if (!cleanNum) {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppBroadcastUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppContact(phone: string, message: string): void {
  const url = getWhatsAppDirectUrl(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openWhatsAppBroadcast(message: string): void {
  const url = getWhatsAppBroadcastUrl(message);
  window.open(url, "_blank", "noopener,noreferrer");
}
