export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: string;
  healthId: string;
  allergies: string[];
  medications: string[];
  insuranceProvider: string;
  policyNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  safetyScore: number;
  avatar: string;
  language: 'en' | 'hi';
  theme: 'light' | 'dark';
  credits: number;
  villageScore: number;
  username?: string;
  city?: string;
  state?: string;
  gender?: string;
  age?: number;
  medicalConditions?: string[];
  disabilities?: string[];
  address?: string;
  district?: string;
  village?: string;
  emergencyContacts?: { name: string; relation: string; phone: string }[];
  healthNotes?: string;
}

export interface SOSRequest {
  id: string;
  userPhone: string;
  userName: string;
  userLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'medical' | 'police' | 'fire' | 'women_safety' | 'farmer';
  status: 'sent' | 'accepted' | 'en_route' | 'arrived';
  responderName: string;
  responderVehicle: string;
  responderLat: number;
  responderLng: number;
  eta: number; // in minutes
  distance: number; // in km
  timestamp: string;
  blockchainTxId?: string;
}

export interface NearbyService {
  id: string;
  name: string;
  type: 'hospital' | 'blood_bank' | 'police' | 'fire_station';
  distance: number;
  eta: number;
  details: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  status: 'safe' | 'alert';
  lat: number;
  lng: number;
  lastSeen: string;
}

export interface DisasterAlert {
  id: string;
  title: string;
  type: 'flood' | 'storm' | 'fire' | 'earthquake';
  severity: 'high' | 'medium' | 'low';
  region: string;
  message: string;
  predictedTime: string;
  probability: number;
}

export interface Volunteer {
  id: string;
  name: string;
  skills: string[];
  bloodType: string;
  status: 'active' | 'inactive';
  phone: string;
  creditsEarned: number;
  tasksCompleted: number;
  lat: number;
  lng: number;
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodType: string;
  phone: string;
  distance: number;
  status: 'available' | 'donated_recently';
  lastDonated: string;
}
