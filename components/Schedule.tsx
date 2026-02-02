import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Appointment, Stylist, Client } from '../types';
import { TIME_SLOTS, SALON_SERVICES } from '../constants';
import { Clock, Scissors, Plus, X, CalendarCheck, User, Calendar as CalendarIcon, ChevronRight, ChevronLeft, Ban, Clock as ClockIcon, Phone, Mail, MapPin, FlaskConical, StickyNote, Edit2, Search, Check, ChevronDown, AlignLeft, AlertCircle, Trash2, Send } from 'lucide-react';

interface ScheduleProps {
  stylists: Stylist[];
  appointments: Appointment[];
  clients: Client[];
  currentUser: Stylist | 'OWNER';
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'price'> & { price?: number, status?: 'confirmed' | 'blocked' }) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onUpsertClient: (client: Partial<Client>) => void;
  onDeleteAppointment: (id: string) => void;
}

// Helper to convert time string (7:30 AM) to minutes from midnight
const getMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

const getEndTime = (startTime: string, durationMinutes: number): string => {
    const startMins = getMinutes(startTime);
    const endMins = startMins + durationMinutes;
    let h = Math.floor(endMins / 60);
    const m = endMins % 60;
    const period = h >= 12 && h < 24 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    if (h > 12) h -= 12; // Handle case where it goes into next day 24+ roughly for display
    return `${h}:${m.toString().padStart(2, '0')} ${period}`;
};

// Check if two appointments overlap
const areOverlapping = (a: Appointment, b: Appointment) => {
    const startA = getMinutes(a.startTime);
    const endA = startA + a.durationMinutes;
    const startB = getMinutes(b.startTime);
    const endB = startB + b.durationMinutes;
    return startA < endB && endA > startB;
};

const Schedule: React.FC<ScheduleProps> = ({ stylists, appointments, clients, currentUser, onAddAppointment, onUpdateAppointment, onUpsertClient, onDeleteAppointment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{stylistId: string, time: string, date: string} | null>(null);
  
  // Navigation State
  const [baseDate, setBaseDate] = useState(new Date());
  const [isBlockingMode, setIsBlockingMode] = useState(false);
  
  // Default View is now WEEKLY for everyone initially per requirements
  const [ownerViewMode, setOwnerViewMode] = useState<'TEAM' | 'WEEKLY'>('WEEKLY');
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Week Alignment State (Rolling vs Fixed Start Day)
  const [weekStartDay, setWeekStartDay] = useState<number | 'rolling'>('rolling');

  // Blocking State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockNote, setBlockNote] = useState('');
  const [blockDuration, setBlockDuration] = useState(60);
  
  // New Appointment Modal Form State
  const [clientSearchName, setClientSearchName] = useState('');
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [newApptTime, setNewApptTime] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  
  // New Client Fields (Required for Clients Tab)
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  // Notes State
  const [clientNotes, setClientNotes] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const notesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [showClientSearch, setShowClientSearch] = useState(false);

  // Appointment Interaction State
  const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  
  // Editable View State
  const [editForm, setEditForm] = useState<{
      date: string;
      startTime: string;
      service: string;
      duration: number;
      status: Appointment['status'];
  }>({
      date: '',
      startTime: '',
      service: '',
      duration: 0,
      status: 'confirmed'
  });

  const [dragState, setDragState] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    appt: Appointment;
  } | null>(null);

  // Helper for phone formatting
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setNewPhone(formatted);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update edit form when viewing an appointment
  useEffect(() => {
      if (viewAppointment) {
          setEditForm({
              date: viewAppointment.date,
              startTime: viewAppointment.startTime,
              service: viewAppointment.service,
              duration: viewAppointment.durationMinutes,
              status: viewAppointment.status
          });
      }
  }, [viewAppointment]);

  // Pointer Event Listeners for Dragging
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
        setDragState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    };

    const handlePointerUp = (e: PointerEvent) => {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const slotElement = elements.find(el => el.hasAttribute('data-slot-time'));
        
        if (slotElement && dragState) {
             const time = slotElement.getAttribute('data-slot-time');
             const date = slotElement.getAttribute('data-slot-date');
             const stylistId = slotElement.getAttribute('data-slot-stylist');
             
             if (time && date && stylistId) {
                 onUpdateAppointment({
                     ...dragState.appt,
                     startTime: time,
                     date: date,
                     stylistId: stylistId
                 });
             }
        }
        
        setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, onUpdateAppointment]);

  // Determine View Logic
  const isOwner = currentUser === 'OWNER';
  const showWeeklyView = !isOwner || (isOwner && ownerViewMode === 'WEEKLY');

  // Generate dates for the view
  const columns = useMemo(() => {
    if (!showWeeklyView) {
        return stylists;
    } else {
        const dates = [];
        let startDay = new Date(baseDate);

        if (weekStartDay !== 'rolling') {
            const currentDay = startDay.getDay();
            const distance = (weekStartDay as number) - currentDay;
            let diff = distance;
            if (diff > 0) diff -= 7; 
            startDay.setDate(startDay.getDate() + diff);
        }

        for(let i=0; i<7; i++) {
            const d = new Date(startDay);
            d.setDate(startDay.getDate() + i);
            dates.push(d);
        }
        return dates;
    }
  }, [baseDate, stylists, showWeeklyView, weekStartDay]);

  const handlePrevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };
  
  const handleMonthChange = (offset: number) => {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + offset);
      setBaseDate(d);
  };
  
  const handleToday = () => {
      setBaseDate(new Date());
  };

  // Correct Local Time Date String Generation
  const toDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };
  
  const todayStr = toDateStr(new Date());

  const getColumnAppointments = (colItem: Stylist | Date) => {
      let stylistId: string;
      let dateStr: string;

      if (!showWeeklyView) {
          stylistId = (colItem as Stylist).id;
          dateStr = toDateStr(baseDate);
      } else {
          stylistId = isOwner ? '1' : (currentUser as Stylist).id;
          dateStr = toDateStr(colItem as Date);
      }

      return appointments.filter(a => 
          a.stylistId === stylistId && 
          (a.date === dateStr || (!a.date && dateStr === todayStr))
      );
  };

  const calculateLayout = (colAppts: Appointment[]) => {
      const layoutMap = new Map<string, { left: string, width: string }>();
      
      const sorted = [...colAppts].sort((a, b) => {
          const startA = getMinutes(a.startTime);
          const startB = getMinutes(b.startTime);
          if (startA === startB) return b.durationMinutes - a.durationMinutes;
          return startA - startB;
      });

      const clusters: Appointment[][] = [];
      let currentCluster: Appointment[] = [];

      sorted.forEach((appt) => {
          if (currentCluster.length === 0) {
              currentCluster.push(appt);
          } else {
              const overlapsCluster = currentCluster.some(c => areOverlapping(c, appt));
              if (overlapsCluster) {
                  currentCluster.push(appt);
              } else {
                  clusters.push(currentCluster);
                  currentCluster = [appt];
              }
          }
      });
      if (currentCluster.length > 0) clusters.push(currentCluster);

      clusters.forEach(cluster => {
          const columns: Appointment[][] = [];
          
          cluster.forEach(appt => {
              let placed = false;
              for(let i=0; i<columns.length; i++) {
                  const col = columns[i];
                  const collision = col.some(existing => areOverlapping(existing, appt));
                  if (!collision) {
                      col.push(appt);
                      placed = true;
                      break;
                  }
              }
              if (!placed) {
                  columns.push([appt]);
              }
          });

          const totalCols = columns.length;
          const colWidth = 100 / totalCols;

          cluster.forEach(appt => {
              const colIndex = columns.findIndex(col => col.includes(appt));
              layoutMap.set(appt.id, {
                  left: `${colIndex * colWidth}%`,
                  width: `${colWidth}%`
              });
          });
      });

      return layoutMap;
  };

  const getAppointmentStyle = (appt: Appointment) => {
      if (appt.status === 'blocked') return 'bg-stone-800 border-stone-600 text-stone-300';
      if (appt.status === 'cancelled') return 'bg-red-100 border-red-500 text-red-900'; // Red for cancelled
      if (appt.status === 'confirmed') return 'bg-emerald-100 border-emerald-500 text-emerald-900'; // Green for confirmed
      if (appt.status === 'pending') return 'bg-stone-200 border-stone-400 text-stone-700'; // Grey for pending
      if (appt.status === 'completed') return 'bg-stone-100 border-stone-300 text-stone-500 line-through decoration-stone-400';
      return 'bg-emerald-100 border-emerald-500 text-emerald-900';
  };

  const handleSlotClick = (stylistId: string, time: string, date: string) => {
      setSelectedSlot({ stylistId, time, date });
      
      if (isBlockingMode) {
          setBlockNote('');
          setBlockDuration(60); 
          setIsBlockModalOpen(true);
      } else {
          setClientSearchName('');
          setClientId(undefined);
          setNewFirstName('');
          setNewLastName('');
          setNewPhone('');
          setClientNotes('');
          setNewNoteInput('');
          setSelectedServiceIndex(0);
          
          // Initialize modal state
          setNewApptTime(time);
          setNewApptDate(date);
          
          setIsModalOpen(true);
      }
  };

  const handleApptPointerDown = (e: React.PointerEvent, appt: Appointment) => {
      e.stopPropagation();
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      setDragState({
          id: appt.id,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
          x: e.clientX,
          y: e.clientY,
          width: rect.width,
          height: rect.height,
          appt: appt
      });
  };

  const handleAppointmentClick = (e: React.MouseEvent, appt: Appointment) => {
      e.stopPropagation();
      if (dragState) return;
      setViewAppointment(appt);
  };

  const handleSaveChanges = () => {
      if (!viewAppointment) return;

      const updatedAppt: Appointment = {
          ...viewAppointment,
          date: editForm.date,
          startTime: editForm.startTime,
          service: editForm.service,
          durationMinutes: editForm.duration,
          status: editForm.status,
          // Update price if service changed (optional, but good UX)
          price: editForm.service !== viewAppointment.service 
            ? (SALON_SERVICES.find(s => s.name === editForm.service)?.price || viewAppointment.price)
            : viewAppointment.price
      };

      onUpdateAppointment(updatedAppt);
      setViewAppointment(null);
  };

  const handleAddNote = () => {
      if (!newNoteInput.trim()) return;

      const timestamp = new Date().toLocaleString('en-US', { 
          month: 'numeric', day: 'numeric', year: '2-digit', 
          hour: 'numeric', minute: '2-digit' 
      });
      
      const noteEntry = `[${timestamp}] ${newNoteInput.trim()}`;
      const updatedNotes = clientNotes 
          ? `${clientNotes}\n${noteEntry}`
          : noteEntry;
      
      setClientNotes(updatedNotes);
      setNewNoteInput('');
      
      setTimeout(() => {
          notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
  };

  const handleCreateAppointment = () => {
    if (!selectedSlot) return;
    
    const service = SALON_SERVICES[selectedServiceIndex];
    let finalClientId = clientId;
    let finalClientName = clientSearchName;

    // Creating a new client
    if (!clientId) {
         if (!newFirstName || !newLastName || !newPhone) return; // Validation check

         finalClientName = `${newFirstName} ${newLastName}`;
         const newId = Math.random().toString(36).substr(2, 9);
         
         onUpsertClient({
             id: newId,
             firstName: newFirstName,
             lastName: newLastName,
             phone: newPhone,
             email: '',
             address: '',
             notes: clientNotes
         });
         finalClientId = newId;
    } else {
        // Existing Client - Update notes if they were edited in the modal
        onUpsertClient({
            id: clientId,
            notes: clientNotes // Save whatever is in the text area (pulled in + edited)
        });
    }
    
    onAddAppointment({
        stylistId: selectedSlot.stylistId,
        clientName: finalClientName,
        clientId: finalClientId,
        service: service.name,
        startTime: newApptTime,
        durationMinutes: service.duration,
        date: newApptDate,
        price: service.price,
        status: 'confirmed'
    });
    
    setIsModalOpen(false);
    setClientSearchName('');
    setClientId(undefined);
    setNewFirstName('');
    setNewLastName('');
    setNewPhone('');
    setClientNotes('');
    setNewNoteInput('');
    setSelectedServiceIndex(0);
    setNewApptTime('');
    setNewApptDate('');
  };

  const handleSaveBlock = () => {
      if (!selectedSlot) return;

      onAddAppointment({
          stylistId: selectedSlot.stylistId,
          clientName: blockNote || 'Blocked Time', 
          service: 'Blocked',
          startTime: selectedSlot.time,
          durationMinutes: blockDuration,
          date: selectedSlot.date,
          price: 0,
          status: 'blocked'
      });
      
      setIsBlockModalOpen(false);
  };

  const handleDeleteClick = () => {
      setIsDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
      if (viewAppointment) {
          onDeleteAppointment(viewAppointment.id);
          setViewAppointment(null);
          setIsDeleteConfirmationOpen(false);
      }
  };

  const filteredClients = useMemo(() => {
      if (!clientSearchName) return [];
      const search = clientSearchName.toLowerCase();
      return clients.filter(c => 
          c.firstName.toLowerCase().includes(search) || 
          c.lastName.toLowerCase().includes(search) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(search)
      ).slice(0, 5);
  }, [clientSearchName, clients]);

  const getBlockDurationOptions = () => {
      if (!selectedSlot) return [];
      
      const startIndex = TIME_SLOTS.indexOf(selectedSlot.time);
      if (startIndex === -1) return [];

      const remainingSlots = TIME_SLOTS.length - startIndex;
      const options = [];
      
      for(let i = 1; i < remainingSlots; i++) {
          const minutes = i * 15;
          options.push(minutes);
      }
      if (remainingSlots > 0) options.push(remainingSlots * 15);

      return options;
  };

  const getClientProfile = (name: string, id?: string) => {
      return clients.find(c => c.id === id || `${c.firstName} ${c.lastName}`.toLowerCase() === name.toLowerCase());
  };

  // Helper validation for button
  const isFormValid = clientId ? true : (newFirstName && newLastName && newPhone);

  return (
    <div className="bg-white border border-stone-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full relative select-none">
        {/* Drag Ghost Element */}
        {dragState && (
            <div 
                className="fixed z-[9999] pointer-events-none rounded-md p-2 shadow-xl border-l-4 text-xs overflow-hidden bg-emerald-100 border-emerald-500 text-emerald-900 opacity-90"
                style={{
                    left: dragState.x - dragState.offsetX,
                    top: dragState.y - dragState.offsetY,
                    width: dragState.width,
                    height: dragState.height,
                    transform: 'scale(1.05)',
                }}
            >
                <div className="font-bold">{dragState.appt.clientName}</div>
                <div>{dragState.appt.service}</div>
            </div>
        )}

        {/* Controls Header */}
        <div className="p-4 border-b border-stone-200 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white z-20">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center justify-between w-full sm:w-auto bg-stone-100 rounded-lg p-1">
                    <button onClick={handlePrevWeek} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft className="w-5 h-5 text-stone-600" /></button>
                    <div className="px-4 font-semibold text-stone-800 flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowMiniCalendar(!showMiniCalendar)}>
                        <CalendarIcon className="w-4 h-4 text-emerald-600" />
                        {showWeeklyView ? (
                            <span>{baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        ) : (
                            <span>{baseDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                        )}
                    </div>
                    <button onClick={handleNextWeek} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight className="w-5 h-5 text-stone-600" /></button>
                </div>
                
                {/* Mobile Specific Controls */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:hidden">
                    <button 
                        onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showMiniCalendar ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Monthly View
                    </button>
                    <button 
                        onClick={handleToday}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-stone-100 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-200"
                    >
                        <CalendarCheck className="w-4 h-4" />
                        Today
                    </button>
                </div>
                
                {/* Desktop Today Button */}
                <button 
                    onClick={handleToday} 
                    className="hidden sm:block px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 border border-stone-200 rounded hover:bg-stone-50 transition-colors"
                >
                    Today
                </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                 {isOwner && (
                     <div className="flex bg-stone-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setOwnerViewMode('TEAM')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${ownerViewMode === 'TEAM' ? 'bg-white shadow text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            Team View
                        </button>
                        <button 
                            onClick={() => setOwnerViewMode('WEEKLY')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${ownerViewMode === 'WEEKLY' ? 'bg-white shadow text-emerald-600' : 'text-stone-500 hover:text-stone-700'}`}
                        >
                            My Week
                        </button>
                     </div>
                 )}
                 <button 
                    onClick={() => setIsBlockingMode(!isBlockingMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isBlockingMode ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                 >
                    <Ban className="w-4 h-4" />
                    {isBlockingMode ? 'Done' : 'Block'}
                 </button>
            </div>
        </div>

        {/* Mini Calendar Popup */}
        {showMiniCalendar && (
           <div ref={calendarRef} className="absolute top-[80px] sm:top-[70px] left-4 right-4 sm:left-20 sm:right-auto sm:w-72 bg-white shadow-xl rounded-lg border border-stone-200 p-4 z-50 animate-in fade-in zoom-in-95">
               {/* Calendar implementation */}
                <div className="flex justify-between items-center mb-4">
                   <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-stone-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                   <span className="font-bold text-sm">{baseDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                   <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-stone-100 rounded"><ChevronRight className="w-4 h-4" /></button>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-bold text-stone-400">{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-1 text-center">
                   {(() => {
                       const year = baseDate.getFullYear();
                       const month = baseDate.getMonth();
                       const firstDay = new Date(year, month, 1);
                       const lastDay = new Date(year, month + 1, 0);
                       const daysInMonth = lastDay.getDate();
                       const startDay = firstDay.getDay();
                       const days = [];
                       
                       // Add empty slots for days before the 1st of the month
                       for(let i=0; i<startDay; i++) {
                           days.push(<div key={`empty-${i}`} className="h-8"></div>);
                       }
                       
                       // Add days of the month
                       for(let i=1; i<=daysInMonth; i++) {
                           const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                           const isSelected = i === baseDate.getDate();
                           
                           days.push(
                               <button 
                                   key={i} 
                                   onClick={() => { const newDate = new Date(baseDate); newDate.setDate(i); setBaseDate(newDate); setShowMiniCalendar(false); }}
                                   className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs transition-colors ${isToday ? 'bg-emerald-100 text-emerald-700 font-bold' : isSelected ? 'bg-stone-900 text-white font-bold' : 'hover:bg-stone-100 text-stone-700'}`}
                               >
                                   {i}
                               </button>
                           );
                       }
                       return days;
                   })()}
               </div>
           </div>
        )}

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto relative touch-pan-x touch-pan-y">
            <div className="min-w-[800px] flex">
                <div className="w-20 flex-shrink-0 bg-white border-r border-stone-200 sticky left-0 z-10">
                    <div className="h-10 border-b border-stone-200 bg-stone-50"></div> 
                    {TIME_SLOTS.map((time, index) => (
                        <div key={time} className={`h-[48px] border-b border-stone-100 flex items-start justify-center pt-1 text-xs text-black font-bold ${index % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}>
                            {time}
                        </div>
                    ))}
                </div>

                <div className="flex flex-1">
                    {columns.map((colItem, colIndex) => {
                         const isDate = colItem instanceof Date;
                         const headerTitle = isDate ? (colItem as Date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }) : (colItem as Stylist).name;
                         const colDate = isDate ? toDateStr(colItem as Date) : toDateStr(baseDate);
                         const colStylistId = isDate ? (currentUser === 'OWNER' ? '1' : currentUser.id) : (colItem as Stylist).id;
                         const colAppts = getColumnAppointments(colItem);
                         const layoutMap = calculateLayout(colAppts);

                         return (
                            <div key={colIndex} className="flex-1 min-w-[140px] border-r border-stone-200 last:border-none bg-stone-50/30">
                                <div className={`h-10 border-b border-stone-200 flex flex-col items-center justify-center sticky top-0 z-10 ${isDate && toDateStr(colItem as Date) === todayStr ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-50 text-stone-600'}`}>
                                    <span className="text-sm font-bold">{headerTitle}</span>
                                </div>
                                <div className="relative">
                                    {TIME_SLOTS.map((time, index) => (
                                        <div 
                                            key={time}
                                            data-slot-time={time}
                                            data-slot-date={colDate}
                                            data-slot-stylist={colStylistId}
                                            onClick={() => handleSlotClick(colStylistId, time, colDate)}
                                            className={`h-[48px] border-b border-stone-100 hover:bg-emerald-50 transition-colors cursor-pointer group relative ${index % 2 === 0 ? 'bg-white' : 'bg-stone-50'}`}
                                        >
                                           {isBlockingMode && (
                                               <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-stone-900/10 z-0">
                                                   <Plus className="w-4 h-4 text-stone-600" />
                                               </div>
                                           )}
                                        </div>
                                    ))}
                                    {colAppts.map(appt => {
                                        const startIndex = TIME_SLOTS.indexOf(appt.startTime);
                                        const height = (appt.durationMinutes / 15) * 3; 
                                        const top = startIndex * 48; 
                                        const heightPx = (appt.durationMinutes / 15) * 48;
                                        const isBlocked = appt.status === 'blocked';
                                        const isDragging = dragState?.id === appt.id;
                                        const layout = layoutMap.get(appt.id) || { left: '0%', width: '100%' };

                                        return (
                                            <div 
                                                key={appt.id}
                                                onPointerDown={(e) => handleApptPointerDown(e, appt)}
                                                onClick={(e) => handleAppointmentClick(e, appt)}
                                                className={`absolute rounded-md p-2 shadow-sm border-l-4 text-xs overflow-hidden cursor-pointer hover:z-30 touch-none transition-all ${getAppointmentStyle(appt)} ${isDragging ? 'opacity-30 z-50' : 'hover:scale-[1.02]'}`}
                                                style={{ 
                                                    top: `${top}px`, 
                                                    height: `${heightPx - 2}px`,
                                                    left: `calc(${layout.left} + 2px)`,
                                                    width: `calc(${layout.width} - 4px)` 
                                                }}
                                            >
                                                <div className="font-bold flex flex-col justify-between pointer-events-none h-full">
                                                    <div className="flex justify-between w-full">
                                                        <span className="truncate">{isBlocked ? (appt.clientName || 'Blocked') : appt.clientName}</span>
                                                        {!isBlocked && <span className="ml-1">${appt.price}</span>}
                                                    </div>
                                                    <div className="flex justify-between items-end opacity-90 mt-auto">
                                                        <span className="truncate max-w-[60%]">{appt.service}</span>
                                                        <span className="text-[10px] font-mono opacity-80 whitespace-nowrap">
                                                            {appt.startTime} - {getEndTime(appt.startTime, appt.durationMinutes)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                         );
                    })}
                </div>
            </div>
        </div>
        
        {/* ... Rest of the file (Modals) remains identical ... */}
        
        {/* View / Edit Appointment Modal */}
        {viewAppointment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-white border-b border-stone-100 p-6 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                             {/* Initials Avatar */}
                            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl shadow-inner">
                                {viewAppointment.clientName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-900">{viewAppointment.clientName}</h3>
                                {viewAppointment.status === 'blocked' && <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded mt-1 inline-block">Time Blocked</span>}
                            </div>
                        </div>
                        <button onClick={() => setViewAppointment(null)} className="text-stone-400 hover:text-stone-600 transition-colors p-1">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                         {/* Editable Fields */}
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Date</label>
                                 <input 
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Time</label>
                                 <select 
                                    value={editForm.startTime}
                                    onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                 >
                                     {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Service</label>
                                 <select 
                                    value={editForm.service}
                                    onChange={(e) => setEditForm({...editForm, service: e.target.value})}
                                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                 >
                                     {SALON_SERVICES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                     {editForm.service === 'Blocked' && <option value="Blocked">Blocked</option>}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Duration (Min)</label>
                                 <input 
                                    type="number"
                                    step="15"
                                    min="15"
                                    value={editForm.duration}
                                    onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value) || 15})}
                                    className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                 />
                             </div>
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Status</label>
                             <div className="relative">
                                 <select 
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                                    className={`w-full p-2 pl-9 border rounded-lg text-sm font-medium outline-none appearance-none cursor-pointer
                                        ${editForm.status === 'confirmed' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : ''}
                                        ${editForm.status === 'pending' ? 'bg-stone-100 border-stone-300 text-stone-600' : ''}
                                        ${editForm.status === 'cancelled' ? 'bg-red-50 border-red-300 text-red-800' : ''}
                                    `}
                                 >
                                     <option value="confirmed">Confirmed</option>
                                     <option value="pending">Pending</option>
                                     <option value="cancelled">Cancelled</option>
                                 </select>
                                 <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                     {editForm.status === 'confirmed' && <CalendarCheck className="w-4 h-4 text-emerald-600" />}
                                     {editForm.status === 'pending' && <Clock className="w-4 h-4 text-stone-500" />}
                                     {editForm.status === 'cancelled' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                 </div>
                                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                             </div>
                         </div>

                        {/* Client Profile Snippet */}
                        {(() => {
                            const client = getClientProfile(viewAppointment.clientName, viewAppointment.clientId);
                            if (client && viewAppointment.status !== 'blocked') {
                                return (
                                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 mt-2">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-500 uppercase">
                                            <User className="w-3 h-3" /> Client Details
                                        </div>
                                        <div className="text-sm space-y-1 text-stone-700">
                                            {client.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-stone-400"/> {client.phone}</div>}
                                            {client.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-stone-400"/> {client.email}</div>}
                                        </div>
                                        {(client.notes || client.formulas) && (
                                            <div className="mt-3 pt-3 border-t border-stone-200 grid grid-cols-2 gap-2">
                                                {client.formulas && (
                                                    <div className="text-xs bg-white p-2 rounded border border-stone-200">
                                                        <span className="font-bold block text-purple-600 mb-1">Formulas</span>
                                                        {client.formulas}
                                                    </div>
                                                )}
                                                {client.notes && (
                                                    <div className="text-xs bg-white p-2 rounded border border-stone-200">
                                                        <span className="font-bold block text-blue-600 mb-1">Notes</span>
                                                        {client.notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end gap-3">
                        <button 
                            onClick={handleDeleteClick}
                            className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors flex items-center justify-center"
                            title="Delete Appointment"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white font-bold rounded-lg hover:bg-black transition-colors shadow-lg"
                        >
                            <Check className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmationOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Delete Appointment?</h3>
                    <p className="text-stone-500 text-sm mb-6">Are you sure you want to delete this appointment?</p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsDeleteConfirmationOpen(false)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-xl transition-colors"
                        >
                            No
                        </button>
                        <button 
                            onClick={handleConfirmDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Yes
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* New Appointment Modal */}
        {isModalOpen && selectedSlot && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={() => setShowClientSearch(false)}>
                    <div className="bg-emerald-950 p-4 flex justify-between items-center">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5" />
                            New Appointment
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-emerald-300 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-sm flex justify-between items-end">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-stone-500 uppercase font-bold">Time</span>
                                <select 
                                    value={newApptTime}
                                    onChange={(e) => setNewApptTime(e.target.value)}
                                    className="bg-white border border-stone-300 rounded px-2 py-1 font-semibold text-stone-800 text-sm outline-none focus:border-emerald-500"
                                >
                                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col text-right gap-1">
                                <span className="text-xs text-stone-500 uppercase font-bold">Date</span>
                                <input 
                                    type="date"
                                    value={newApptDate}
                                    onChange={(e) => setNewApptDate(e.target.value)}
                                    className="bg-white border border-stone-300 rounded px-2 py-1 font-semibold text-stone-800 text-sm outline-none focus:border-emerald-500 text-right"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-stone-700 mb-1">Search Client</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-stone-900" 
                                    placeholder="Start typing to search..."
                                    value={clientId ? `${newFirstName} ${newLastName}` : clientSearchName}
                                    onChange={e => {
                                        setClientSearchName(e.target.value);
                                        setShowClientSearch(true);
                                        // Reset fields if user clears search or types new
                                        setClientId(undefined);
                                        setNewFirstName('');
                                        setNewLastName('');
                                        setNewPhone('');
                                        setClientNotes('');
                                        setNewNoteInput('');
                                    }}
                                    onFocus={() => setShowClientSearch(true)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowClientSearch(true);
                                    }}
                                />
                                {clientId && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Autocomplete Dropdown */}
                            {showClientSearch && clientSearchName && !clientId && filteredClients.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {filteredClients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setClientId(client.id);
                                                setNewFirstName(client.firstName);
                                                setNewLastName(client.lastName);
                                                setNewPhone(client.phone);
                                                setClientNotes(client.notes || '');
                                                setNewNoteInput('');
                                                setShowClientSearch(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between border-b border-stone-50 last:border-none"
                                        >
                                            <span className="font-medium text-stone-800">{client.firstName} {client.lastName}</span>
                                            {client.phone && <span className="text-xs text-stone-400">{client.phone}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* New Client Form - Shows if no client ID is selected and user is typing */}
                        {!clientId && (
                             <div className="bg-white p-3 rounded-lg border border-stone-300 space-y-3 animate-in fade-in">
                                 <div className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> New Client Details
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <input 
                                        placeholder="First Name *"
                                        value={newFirstName}
                                        onChange={e => setNewFirstName(e.target.value)}
                                        className="w-full p-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-stone-900 bg-white"
                                     />
                                     <input 
                                        placeholder="Last Name *"
                                        value={newLastName}
                                        onChange={e => setNewLastName(e.target.value)}
                                        className="w-full p-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-stone-900 bg-white"
                                     />
                                 </div>
                                 <input 
                                     placeholder="Phone Number *"
                                     type="tel"
                                     value={newPhone}
                                     onChange={handlePhoneChange}
                                     className="w-full p-2 text-sm border border-stone-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-stone-900 bg-white"
                                 />
                             </div>
                        )}

                        <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 flex flex-col h-48">
                            <label className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-1">
                                <StickyNote className="w-3 h-3" /> Client Notes
                            </label>
                            
                            <div className="flex-1 bg-white border border-stone-200 rounded-lg p-2 overflow-y-auto mb-2 text-xs font-mono text-stone-600 whitespace-pre-wrap shadow-inner">
                                {clientNotes ? clientNotes : <span className="text-stone-300 italic">No notes yet...</span>}
                                <div ref={notesEndRef} />
                            </div>

                            <div className="flex gap-2">
                                <input 
                                    value={newNoteInput}
                                    onChange={e => setNewNoteInput(e.target.value)}
                                    onKeyDown={e => {
                                        if(e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddNote();
                                        }
                                    }}
                                    placeholder="Type note..."
                                    className="flex-1 px-2 py-1.5 border border-stone-300 rounded-md focus:ring-2 focus:ring-yellow-400 outline-none text-xs bg-white text-stone-900"
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddNote}
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1.5 rounded-md transition-colors"
                                >
                                    <Send className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Service</label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                {SALON_SERVICES.map((s, idx) => (
                                    <button 
                                        key={s.name}
                                        onClick={() => setSelectedServiceIndex(idx)}
                                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${selectedServiceIndex === idx ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-stone-200 hover:border-emerald-300'}`}
                                    >
                                        <div>
                                            <div className="font-bold text-sm text-stone-800">{s.name}</div>
                                            <div className="text-xs text-stone-500">{s.duration} mins</div>
                                        </div>
                                        <div className="text-sm font-semibold text-emerald-700">${s.price}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateAppointment}
                            disabled={!isFormValid}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all mt-2"
                        >
                            Book Appointment
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Block Time Modal */}
        {isBlockModalOpen && selectedSlot && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-stone-800">
                    <div className="bg-stone-900 p-4 flex justify-between items-center">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Ban className="w-5 h-5 text-red-500" />
                            Block Time Off
                        </h3>
                        <button onClick={() => setIsBlockModalOpen(false)} className="text-stone-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-stone-400" />
                            <div>
                                <span className="text-xs text-stone-500 font-bold uppercase block">Starting At</span>
                                <span className="font-semibold text-stone-800 text-lg">{selectedSlot.time}</span>
                            </div>
                            <div className="h-8 w-px bg-stone-200 mx-2"></div>
                            <div>
                                <span className="text-xs text-stone-500 font-bold uppercase block">Date</span>
                                <span className="font-semibold text-stone-800 text-sm">{new Date(selectedSlot.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-2">Duration</label>
                            <div className="relative">
                                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                <select
                                    value={blockDuration}
                                    onChange={(e) => setBlockDuration(Number(e.target.value))}
                                    className="w-full pl-9 pr-8 py-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-500 outline-none appearance-none font-medium"
                                >
                                    {getBlockDurationOptions().map(min => {
                                        const hours = Math.floor(min / 60);
                                        const mins = min % 60;
                                        const label = hours > 0 
                                            ? `${hours} hr ${mins > 0 ? `${mins} min` : ''}`
                                            : `${mins} min`;
                                        return <option key={min} value={min}>{label}</option>;
                                    })}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
                            </div>
                            <p className="text-xs text-stone-400 mt-1 pl-1">Select time until end of day (8:00 PM)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-2">Reason for Blocking</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 text-stone-400 w-4 h-4" />
                                <textarea
                                    value={blockNote}
                                    onChange={(e) => setBlockNote(e.target.value)}
                                    placeholder="e.g. Lunch break, Personal appointment, Clean up..."
                                    className="w-full pl-9 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-500 outline-none min-h-[100px] resize-none"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveBlock}
                            className="w-full bg-stone-900 hover:bg-black text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Ban className="w-4 h-4" />
                            Confirm Block
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Schedule;