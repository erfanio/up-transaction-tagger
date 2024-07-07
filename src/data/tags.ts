import { selector } from 'recoil';
import { LOCALSTORAGE_KEY, apiKeyState } from './apiKey';
import { get as fetchGet, genericListResponse } from './fetch';

export const tagsQuery = selector<Array<any>>({
  key: 'tags',
  get: async ({ get }) => {
    const json = await fetchGet<genericListResponse>({
      apiKey: get(apiKeyState),
      url: 'https://api.up.com.au/api/v1/tags',
      errorMessage: 'Error retrieving a list of tags:',
    });
    return json.data;
  },
});

export const tagTransactions = (
  transactionIds: Array<string>,
  tagId: string,
) => {
  const apiKey = window.localStorage.getItem(LOCALSTORAGE_KEY);
  const requests = transactionIds.map((tid) => {
    return fetch(
      `https://api.up.com.au/api/v1/transactions/${tid}/relationships/tags`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [{ type: 'tags', id: tagId }] }),
      },
    );
  });

  return Promise.all(requests);
};
