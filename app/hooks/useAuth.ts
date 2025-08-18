import { useState, useCallback } from 'react';
import { createClient } from '@/lib/client';

export const useAuth = () => {
  const supabase = createClient();

  const getAuthToken = useCallback(async () => {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        throw new Error('Session error');
      }

      if (!sessionData.session) {
        console.error('No active session');
        throw new Error('No active session');
      }

      const token = sessionData.session.access_token;
      
      // Check if token is expired (basic check)
      if (sessionData.session.expires_at && sessionData.session.expires_at * 1000 < Date.now()) {
        console.warn('Token appears to be expired, attempting refresh...');
        
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Token refresh failed');
        }
        
        return refreshData.session.access_token;
      }

      return token;
    } catch (error) {
      console.error('Auth token error:', error);
      throw error;
    }
  }, [supabase]);

  return { getAuthToken };
};