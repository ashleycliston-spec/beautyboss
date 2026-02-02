import { StateTaxInfo, Stylist } from "./types";

export const US_STATES: StateTaxInfo[] = [
  { name: "Alabama", rate: 4.0 }, { name: "Alaska", rate: 0.0 }, { name: "Arizona", rate: 5.6 },
  { name: "Arkansas", rate: 6.5 }, { name: "California", rate: 7.25 }, { name: "Colorado", rate: 2.9 },
  { name: "Connecticut", rate: 6.35 }, { name: "Delaware", rate: 0.0 }, { name: "Florida", rate: 6.0 },
  { name: "Georgia", rate: 4.0 }, { name: "Hawaii", rate: 4.0 }, { name: "Idaho", rate: 6.0 },
  { name: "Illinois", rate: 6.25 }, { name: "Indiana", rate: 7.0 }, { name: "Iowa", rate: 6.0 },
  { name: "Kansas", rate: 6.5 }, { name: "Kentucky", rate: 6.0 }, { name: "Louisiana", rate: 4.45 },
  { name: "Maine", rate: 5.5 }, { name: "Maryland", rate: 6.0 }, { name: "Massachusetts", rate: 6.25 },
  { name: "Michigan", rate: 6.0 }, { name: "Minnesota", rate: 6.88 }, { name: "Mississippi", rate: 7.0 },
  { name: "Missouri", rate: 4.23 }, { name: "Montana", rate: 0.0 }, { name: "Nebraska", rate: 5.5 },
  { name: "Nevada", rate: 6.85 }, { name: "New Hampshire", rate: 0.0 }, { name: "New Jersey", rate: 6.63 },
  { name: "New Mexico", rate: 5.13 }, { name: "New York", rate: 4.0 }, { name: "North Carolina", rate: 4.75 },
  { name: "North Dakota", rate: 5.0 }, { name: "Ohio", rate: 5.75 }, { name: "Oklahoma", rate: 4.5 },
  { name: "Oregon", rate: 0.0 }, { name: "Pennsylvania", rate: 6.0 }, { name: "Rhode Island", rate: 7.0 },
  { name: "South Carolina", rate: 6.0 }, { name: "South Dakota", rate: 4.5 }, { name: "Tennessee", rate: 7.0 },
  { name: "Texas", rate: 6.25 }, { name: "Utah", rate: 6.1 }, { name: "Vermont", rate: 6.0 },
  { name: "Virginia", rate: 5.3 }, { name: "Washington", rate: 6.5 }, { name: "West Virginia", rate: 6.0 },
  { name: "Wisconsin", rate: 5.0 }, { name: "Wyoming", rate: 4.0 }
];

export const MOCK_STYLISTS: Stylist[] = [
  { 
      id: '1', 
      name: 'Owner', 
      email: 'owner@salon.com', 
      specialty: 'Master Stylist', 
      avatar: 'https://ui-avatars.com/api/?name=Owner&background=0D9488&color=fff',
      password: 'admin' 
  },
];

export const SALON_SERVICES = [
  { name: 'Haircut', price: 65, duration: 45 },
  { name: 'Color', price: 120, duration: 90 },
  { name: 'Blowout', price: 45, duration: 30 },
  { name: 'Highlights', price: 150, duration: 120 },
  { name: 'Balayage', price: 180, duration: 150 },
  { name: 'Beard Trim', price: 30, duration: 15 },
];

// Generate 15 minute increments from 7:30 AM to 8:00 PM
export const TIME_SLOTS: string[] = [];
let hour = 7;
let minute = 30;
const endHour = 20; // 8 PM
const endMinute = 0;

while (hour < endHour || (hour === endHour && minute <= endMinute)) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  TIME_SLOTS.push(timeString);
  
  minute += 15;
  if (minute === 60) {
    minute = 0;
    hour += 1;
  }
}

export const MOCK_CATALOG: { id: string; name: string; brand: string; category: string; price: number; imageUrl?: string }[] = [
  // Existing Mock Items
  { id: 'cat-1', name: 'No. 3 Hair Perfector', brand: 'Olaplex', category: 'Treatment', price: 30.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Olaplex+No.3' },
  { id: 'cat-2', name: 'No. 4 Bond Maintenance Shampoo', brand: 'Olaplex', category: 'Shampoo', price: 30.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Olaplex+No.4' },
  { id: 'cat-3', name: 'No. 5 Bond Maintenance Conditioner', brand: 'Olaplex', category: 'Conditioner', price: 30.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Olaplex+No.5' },
  { id: 'cat-4', name: 'All Soft Shampoo', brand: 'Redken', category: 'Shampoo', price: 24.00 },
  { id: 'cat-5', name: 'All Soft Conditioner', brand: 'Redken', category: 'Conditioner', price: 24.00 },
  { id: 'cat-6', name: 'Moroccanoil Treatment', brand: 'Moroccanoil', category: 'Treatment', price: 48.00 },
  { id: 'cat-7', name: 'Hydrating Styling Cream', brand: 'Moroccanoil', category: 'Styling', price: 36.00 },
  { id: 'cat-8', name: 'Angel Wash', brand: 'Kevin Murphy', category: 'Shampoo', price: 35.00 },
  { id: 'cat-9', name: 'Angel Rinse', brand: 'Kevin Murphy', category: 'Conditioner', price: 35.00 },
  { id: 'cat-10', name: 'Bedroom Hair', brand: 'Kevin Murphy', category: 'Styling', price: 32.00 },
  
  // Milbon Product List
  { id: 'mil-1', name: 'Smooth Smoothing Shampoo', brand: 'Milbon', category: 'Shampoo', price: 32.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Smoothing+Shampoo' },
  { id: 'mil-2', name: 'Smooth Smoothing Treatment', brand: 'Milbon', category: 'Conditioner', price: 42.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Smoothing+Treatment' },
  { id: 'mil-3', name: 'Moisture Replenishing Shampoo', brand: 'Milbon', category: 'Shampoo', price: 32.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Moisture+Shampoo' },
  { id: 'mil-4', name: 'Moisture Replenishing Treatment', brand: 'Milbon', category: 'Conditioner', price: 42.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Moisture+Treatment' },
  { id: 'mil-5', name: 'Repair Restorative Shampoo', brand: 'Milbon', category: 'Shampoo', price: 38.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Restorative+Shampoo' },
  { id: 'mil-6', name: 'Repair Restorative Treatment', brand: 'Milbon', category: 'Conditioner', price: 50.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Restorative+Treatment' },
  { id: 'mil-7', name: 'Scalp Purifying Gel Shampoo', brand: 'Milbon', category: 'Shampoo', price: 34.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Purifying+Gel' },
  { id: 'mil-8', name: 'Anti-Frizz Defrizzing Shampoo', brand: 'Milbon', category: 'Shampoo', price: 32.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Defrizzing+Shampoo' },
  { id: 'mil-9', name: 'Volume Volumizing Shampoo', brand: 'Milbon', category: 'Shampoo', price: 32.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Volumizing+Shampoo' },
  { id: 'mil-10', name: 'Plarmia Hairserum Shampoo', brand: 'Milbon', category: 'Shampoo', price: 46.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Plarmia+Shampoo' },
  { id: 'mil-11', name: 'Plarmia Hairserum Treatment', brand: 'Milbon', category: 'Conditioner', price: 58.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Plarmia+Treatment' },
  { id: 'mil-12', name: 'Creative Style Texturizing Sea Mist 3', brand: 'Milbon', category: 'Styling', price: 28.00, imageUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Sea+Mist' },
];

export const SUPPLIERS = [
  { name: 'SalonCentric', logo: 'SC' },
  { name: 'Cosmo Prof', logo: 'CP' },
  { name: 'Direct from Brand', logo: 'DB' }
];