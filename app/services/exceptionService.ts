import { apiEndpoints, createApiHeaders } from './api';

export interface Exception {
  id: number;
  clinic_id?: number;
  exception_day: string;
  is_working_day: boolean;
  open: string | null;
  close: string | null;
  lunch_start_time?: string | null;
  lunch_end_time?: string | null;
  break_start?: string | null;
  break_end?: string | null;
}

export interface ExceptionFormData {
  clinic_id: number;
  exception_day: string;
  is_working_day: boolean;
  open: string | null;
  close: string | null;
  break_start: string | null;
  break_end: string | null;
}

export const exceptionService = {
  async getExceptions(token: string): Promise<Exception[]> {
    const response = await fetch(apiEndpoints.exceptions, {
      headers: createApiHeaders(token)
    });


    if (!response.ok) {
      console.warn(`Aviso ao carregar exceções: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(data)
    return Array.isArray(data) ? data : [];
  },

  async createException(token: string, exception: ExceptionFormData): Promise<Exception> {
    const response = await fetch(apiEndpoints.exceptionsConfig, {
      method: "POST",
      headers: createApiHeaders(token),
      body: JSON.stringify(exception),
    });
 
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    return response.json();
  },

  async deleteException(token: string, id: number): Promise<void> {
    console.log('Attempting to delete exception with ID:', id);
    console.log('Using token (first 20 chars):', token?.substring(0, 20) + '...');
    console.log('Making DELETE request to:', `${apiEndpoints.exceptionsConfig}/${id}`);

    const response = await fetch(`${apiEndpoints.exceptionsConfig}/${id}`, {
      method: "DELETE",
      headers: createApiHeaders(token),
    });
    
    console.log('DELETE response status:', response.status);
    console.log('DELETE response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        console.log('Error response body:', errorBody);
        errorDetails = errorBody ? ` - ${errorBody}` : '';
      } catch (e) {
        console.log('Could not parse error response body');
      }
      
      if (response.status === 401) {
        console.error('Authentication failed. Token may be invalid or expired.');
        throw new Error('Erro de autenticação. Faça login novamente.');
      }
      
      throw new Error(`Erro HTTP: ${response.status}${errorDetails}`);
    }

    console.log('Exception deleted successfully');
  }
};