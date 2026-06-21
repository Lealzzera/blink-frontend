import type { RegisterClinicObject } from '@/app/types/types';

export type RegisterPayload = {
  userFullName: string;
  userEmail: string;
  password: string;
  clinicName: string;
  clinicType: string;
  address: string;
  postalCode: string;
  city: string;
  state: string;
  additionalInformation?: string;
  planId: string;
  workingHours: {
    weekday: string;
    startTime: string;
    endTime: string;
  }[];
  services: {
    name: string;
    durationMinutes: number;
    priceCents: number;
  }[];
  settings: {
    chargesEvaluation: boolean;
    evaluationPriceCents: number;
    maxAppointmentsPerSlot: number;
    appointmentDurationMinutes: number;
    aiAgentName: string;
  };
};

/**
 * Converte o RegisterClinicObject interno (que inclui estado da UI como
 * confirmPassword, phone, name/lastName separados) no shape que o backend
 * Node.js espera receber para criar uma nova clínica.
 */
export function buildRegisterPayload(obj: RegisterClinicObject): RegisterPayload {
  return {
    userFullName: `${obj.name} ${obj.lastName}`.trim(),
    userEmail: obj.userEmail.trim(),
    password: obj.password,
    clinicName: obj.clinicName.trim(),
    clinicType: obj.clinicType,
    address: `${obj.address.trim()}, ${obj.addressNumber.trim()}`,
    postalCode: obj.postalCode.replace(/\D/g, ''),
    city: obj.city.trim(),
    state: obj.state.trim(),
    additionalInformation: obj.additionalInformation.trim(),
    planId: obj.selectedPlan.planId,
    workingHours: obj.workingHours.map((workingHour) => ({
      weekday: workingHour.weekday,
      startTime: workingHour.startTime,
      endTime: workingHour.endTime,
    })),
    services: obj.services.map((service) => ({
      name: service.name,
      durationMinutes: Number(service.durationMinutes) || 0,
      priceCents: service.priceCents,
    })),
    settings: {
      chargesEvaluation: obj.settings.chargesEvaluation,
      evaluationPriceCents: obj.settings.evaluationPriceCents,
      maxAppointmentsPerSlot: 1,
      appointmentDurationMinutes: 60,
      aiAgentName: 'Blink',
    },
  };
}
