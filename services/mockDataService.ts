import { Appointment, Stylist, Transaction } from "../types";
import { TIME_SLOTS, SALON_SERVICES } from "../constants";

const clients = ['Alice M.', 'Bob D.', 'Charlie K.', 'Diana P.', 'Evan W.', 'Fiona G.', 'George H.', 'Hannah J.'];
const methods: ('Square' | 'PayPal' | 'Venmo' | 'Cash')[] = ['Square', 'PayPal', 'Venmo', 'Cash'];

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const generateAppointments = (stylists: Stylist[]): Appointment[] => {
  const apps: Appointment[] = [];
  const today = new Date();
  
  // Generate for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      const dateStr = formatDate(currentDate);

      stylists.forEach(stylist => {
        // Randomly skip some days for realism
        if (Math.random() > 0.7) return;

        // Generate 2-4 appointments per stylist per day
        const numApps = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < numApps; i++) {
          const randomSlotIndex = Math.floor(Math.random() * (TIME_SLOTS.length - 12));
          const randomService = SALON_SERVICES[Math.floor(Math.random() * SALON_SERVICES.length)];
          
          // Allow overlaps (double booking) for testing the new layout
          // We removed the 'existing' check that prevented overlaps
          
          const statusRandom = Math.random();
          let status: 'confirmed' | 'pending' | 'completed' = 'confirmed';
          if (statusRandom > 0.7) status = 'pending';
          else if (statusRandom < 0.2) status = 'completed';

          apps.push({
            id: `apt-${stylist.id}-${dayOffset}-${i}-${Math.random()}`,
            stylistId: stylist.id,
            clientName: clients[Math.floor(Math.random() * clients.length)],
            service: randomService.name,
            startTime: TIME_SLOTS[randomSlotIndex],
            durationMinutes: randomService.duration,
            price: randomService.price,
            date: dateStr,
            status: status
          });
        }
      });
  }
  return apps;
};

export const generateTransactions = (stylists: Stylist[]): Transaction[] => {
  const txs: Transaction[] = [];
  stylists.forEach(stylist => {
    // Generate transactions for the month
    const numTxs = Math.floor(Math.random() * 20) + 10;
    for (let i = 0; i < numTxs; i++) {
      const randomService = SALON_SERVICES[Math.floor(Math.random() * SALON_SERVICES.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      txs.push({
        id: `tx-${stylist.id}-${i}`,
        stylistId: stylist.id,
        amount: randomService.price, 
        tip: Math.floor(Math.random() * 15) + 5,
        date: new Date().toISOString(),
        method: methods[Math.floor(Math.random() * methods.length)],
        description: randomService.name,
        clientName: client
      });
    }
  });
  return txs;
};