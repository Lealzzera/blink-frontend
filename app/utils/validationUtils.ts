export const validateWorkDays = (days: any[]): string | null => {
  for (const day of days) {
    if (!day.open || !day.close) {
      return "Todos os dias de trabalho precisam ter horários de abertura e fechamento preenchidos.";
    }

    const openHour = parseInt(day.open.split(':')[0]);
    const openMinute = parseInt(day.open.split(':')[1]);
    const closeHour = parseInt(day.close.split(':')[0]);
    const closeMinute = parseInt(day.close.split(':')[1]);

    if (openHour > closeHour || (openHour === closeHour && openMinute >= closeMinute)) {
      return `Horário de fechamento deve ser após o horário de abertura no dia ${day.week_day}`;
    }

    if (day.break_start && day.break_end) {
      const breakStartHour = parseInt(day.break_start.split(':')[0]);
      const breakStartMinute = parseInt(day.break_start.split(':')[1]);
      const breakEndHour = parseInt(day.break_end.split(':')[0]);
      const breakEndMinute = parseInt(day.break_end.split(':')[1]);

      if (breakStartHour > breakEndHour || (breakStartHour === breakEndHour && breakStartMinute >= breakEndMinute)) {
        return `Horário de fim do almoço deve ser após o horário de início no dia ${day.week_day}`;
      }

      if (breakStartHour < openHour || (breakStartHour === openHour && breakStartMinute < openMinute)) {
        return `Horário de almoço não pode ser antes da abertura no dia ${day.week_day}`;
      }

      if (breakEndHour > closeHour || (breakEndHour === closeHour && breakEndMinute > closeMinute)) {
        return `Horário de almoço não pode ser após o fechamento no dia ${day.week_day}`;
      }
    }
  }
  return null;
};

export const validateExceptions = (exceptions: any[]): string | null => {
  for (const exception of exceptions) {
    if (exception.isOpen) {
      if (!exception.start || !exception.end) {
        return "Para exceções abertas, os horários de abertura e fechamento são obrigatórios.";
      }

      const openHour = parseInt(exception.start.split(':')[0]);
      const openMinute = parseInt(exception.start.split(':')[1]);
      const closeHour = parseInt(exception.end.split(':')[0]);
      const closeMinute = parseInt(exception.end.split(':')[1]);

      if (openHour > closeHour || (openHour === closeHour && openMinute >= closeMinute)) {
        return `Horário de fechamento deve ser após o horário de abertura na exceção de ${exception.date}`;
      }

      if (exception.lunchStart || exception.lunchEnd) {
        if (!exception.lunchStart || !exception.lunchEnd) {
          return "Se definir horário de almoço, ambos início e fim devem ser preenchidos.";
        }

        const lunchStartHour = parseInt(exception.lunchStart.split(':')[0]);
        const lunchStartMinute = parseInt(exception.lunchStart.split(':')[1]);
        const lunchEndHour = parseInt(exception.lunchEnd.split(':')[0]);
        const lunchEndMinute = parseInt(exception.lunchEnd.split(':')[1]);

        if (lunchStartHour > lunchEndHour || (lunchStartHour === lunchEndHour && lunchStartMinute >= lunchEndMinute)) {
          return `Horário de fim do almoço deve ser após o horário de início na exceção de ${exception.date}`;
        }

        if (lunchStartHour < openHour || (lunchStartHour === openHour && lunchStartMinute < openMinute)) {
          return `Horário de almoço não pode ser antes da abertura na exceção de ${exception.date}`;
        }

        if (lunchEndHour > closeHour || (lunchEndHour === closeHour && lunchEndMinute > closeMinute)) {
          return `Horário de almoço não pode ser após o fechamento na exceção de ${exception.date}`;
        }
      }
    }
  }
  return null;
};