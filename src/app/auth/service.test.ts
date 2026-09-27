import axios from 'axios';
import { generateApiKey } from './service';
jest.mock('axios');
test('preserves the email-only hook payload and propagates refusal', async () => {
  (axios.post as jest.Mock).mockResolvedValueOnce({});
  await generateApiKey('person+tag@example.com');
  expect(axios.post).toHaveBeenCalledWith(expect.any(String), {
    email: 'person+tag@example.com',
  });
  (axios.post as jest.Mock).mockRejectedValueOnce(new Error('hook refusal'));
  await expect(generateApiKey('person@example.com')).rejects.toThrow();
});
