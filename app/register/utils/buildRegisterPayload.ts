import type { RegisterClinicObject } from '../page';

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
    address: obj.address.trim(),
    postalCode: obj.postalCode.replace(/\D/g, ''),
    city: obj.city.trim(),
    state: obj.state.trim(),
    planId: obj.planId,
    workingHours: obj.workingHours.map((wh) => ({
      weekday: wh.weekday,
      startTime: wh.startTime,
      endTime: wh.endTime,
    })),
    services: obj.services.map((s) => ({
      name: s.name,
      durationMinutes: Number(s.durationMinutes) || 0,
      priceCents: s.priceCents,
    })),
    settings: {
      chargesEvaluation: obj.settings.chargesEvaluation,
      evaluationPriceCents: obj.settings.evaluationPriceCents,
      maxAppointmentsPerSlot: obj.settings.maxAppointmentsPerSlot,
      appointmentDurationMinutes: obj.settings.appointmentDurationMinutes,
      aiAgentName: obj.settings.aiAgentName,
    },
  };
}
