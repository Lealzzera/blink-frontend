'use server';

import { AxiosError } from 'axios';
import { serverApi } from './serverApi';

type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword({ currentPassword, newPassword }: ChangePasswordRequest) {
  try {
    await serverApi({
      url: '/auth/change-password',
      method: 'PATCH',
      data: {
        currentPassword,
        newPassword,
      },
    });

    return { error: null };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        error: error.response?.data?.message ?? 'Nao foi possivel redefinir sua senha.',
      };
    }

    return { error: 'Nao foi possivel redefinir sua senha.' };
  }
}
