import { selector, selectorFamily } from 'recoil';
import { apiKeyState } from './apiKey';
import { get as fetchGet, genericListResponse } from './fetch';

export const accountsQuery = selector<Array<any>>({
  key: 'accounts',
  get: async ({ get }) => {
    const json = await fetchGet<genericListResponse>({
      apiKey: get(apiKeyState),
      url: 'https://api.up.com.au/api/v1/accounts',
      errorMessage: 'Error retrieving a list of accounts:',
    });
    return json.data;
  },
});

export const accountNameQuery = selectorFamily<string | null, string>({
  key: 'accountName',
  get:
    (accountId) =>
    ({ get }) => {
      if (accountId === null) {
        return null;
      }
      const accounts = get(accountsQuery);
      const match = accounts.find((account) => account.id === accountId);
      if (match === undefined) {
        return 'UNKNOWN';
      }
      return match.attributes.displayName;
    },
});
