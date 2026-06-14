export type AtypicalConfigurationObject = {
  clinic_id: number | null;
  exception_day: string;
  is_working_day: boolean;
  open: string;
  close: string;
  break_start: string;
  break_end: string;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  code: string;
  priceMonthly: number;
  maxUsers: number;
  trialDays: number;
  maxWhatsappSessions: number;
  maxMonthlyAppointments: number;
  stripePriceId: string;
};

export type SelectedPlan = {
  planId: string;
  planCode: string;
  planPrice: number;
};

export type RegisterClinicObject = {
  name: string;
  lastName: string;
  userEmail: string;
  password: string;
  confirmPassword: string;
  clinicName: string;
  clinicType: string;
  phone: string;
  address: string;
  addressNumber: string;
  city: string;
  postalCode: string;
  state: string;
  additionalInformation: string;
  selectedPlan: {
    planId: string;
    stripePriceId: string;
  };
  workingHours: WorkingHour[];
  services: ServiceType[];
  settings: SettingsObject;
};

export type WorkingHour = {
  weekday: string;
  startTime: string;
  endTime: string;
};

export type ServiceType = {
  name: string;
  durationMinutes: number;
  priceCents: number;
};

export type SettingsObject = {
  chargesEvaluation: boolean;
  evaluationPriceCents: number;
};

export type IWorkingHourInput = {
  weekday: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
};

export type IServiceInput = {
  name: string;
  durationMinutes: number;
  priceCents?: number;
};

export type ISettingsInput = {
  chargesEvaluation?: boolean;
  evaluationPriceCents?: number;
};

export type SignupDraftData = {
  clinicName: string;
  clinicType: 'MEDICAL' | 'DENTAL' | 'OTHER' | 'PSYCHOLOGY' | 'AESTHETICAL';
  phone: string;
  address: string;
  addressNumber: string;
  postalCode: string;
  city: string;
  state: string;
  additionalInformation?: string;
  planId: string;
  workingHours: IWorkingHourInput[];
  services: IServiceInput[];
  settings: ISettingsInput;
};

export type ChatListItem = {
  ai_answer: boolean;
  contactName: string;
  id: string;
  phoneNumber: string;
  contactPicture: string;
  unreadCount?: number;
  lastMessage: {
    hasMedia: boolean;
    message: string;
    sentAt: string;
    ack?: number | null;
    fromMe?: boolean;
  };
};

export type ClinicInfoType = {
  clinicId: string;
  userRole: string;
  clinicType: string;
  clinicSlug: string;
  clinicStatus: string;
};

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELED_BY_PATIENT'
  | 'CANCELED_BY_CLINIC'
  | 'COMPLETED'
  | 'NOT_ATTENDED';
