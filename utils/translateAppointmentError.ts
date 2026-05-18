type ErrorTranslation = {
  match: string | RegExp;
  translate: (rawBackendMessage: string) => string;
};

const APPOINTMENT_ERROR_TRANSLATIONS: ErrorTranslation[] = [
  {
    match: 'Clinic not found',
    translate: () => 'Clínica não encontrada.',
  },
  {
    match: 'Appointment not found',
    translate: () => 'Agendamento não encontrado.',
  },
  {
    match: 'Cannot create an appointment in a past date',
    translate: () =>
      'Não é possível criar um agendamento em uma data ou horário no passado.',
  },
  {
    match: 'Cannot reschedule an appointment to a past date',
    translate: () =>
      'Não é possível remarcar um agendamento para uma data ou horário no passado.',
  },
  {
    match: 'Clinic does not work on this day.',
    translate: () => 'A clínica não atende neste dia da semana.',
  },
  {
    match: 'There is already an appointment scheduled for this time.',
    translate: () => 'Já existe um agendamento marcado para este horário.',
  },
  {
    match: /^Clinic will not operate on this day\.(?:\s*Reason:\s*(.+))?$/,
    translate: (rawBackendMessage) => {
      const reasonMatch = rawBackendMessage.match(
        /^Clinic will not operate on this day\.\s*Reason:\s*(.+)$/,
      );
      if (reasonMatch) {
        return `A clínica não funcionará neste dia. Motivo: ${reasonMatch[1]}`;
      }
      return 'A clínica não funcionará neste dia.';
    },
  },
  {
    match: 'Validation error',
    translate: () =>
      'Os dados enviados são inválidos. Verifique os campos e tente novamente.',
  },
  {
    match: 'Internal server error',
    translate: () =>
      'Erro interno no servidor. Tente novamente em alguns instantes.',
  },
];

export function translateAppointmentError(
  rawBackendMessage: string | undefined | null,
  fallbackMessage: string,
): string {
  if (!rawBackendMessage) {
    return fallbackMessage;
  }

  for (const translation of APPOINTMENT_ERROR_TRANSLATIONS) {
    const matched =
      typeof translation.match === 'string'
        ? rawBackendMessage === translation.match
        : translation.match.test(rawBackendMessage);

    if (matched) {
      return translation.translate(rawBackendMessage);
    }
  }

  return fallbackMessage;
}
