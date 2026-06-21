import { serverApi } from './serverApi';

export default async function getUserEmail(email: string) {
  return await serverApi({
    method: 'GET',
    url: `/user/check-email?email=${email}`,
  });
}
