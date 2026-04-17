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
};

export type SelectedPlan = {
  planId: string;
  planCode: string;
  planPrice: number;
};
