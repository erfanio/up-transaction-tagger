import { atomFamily } from 'recoil';
import { LOCALSTORAGE_KEY } from './apiKey';
import { get as fetchGet, genericListResponse } from './fetch';

const findCovers = (transactions: Array<any>) => {
  const covers = new Map<number, Array<any>>();
  const newTransactions = [];
  for (const transaction of transactions) {
    const { description, amount, isCategorizable } = transaction.attributes;
    const newTransaction = { ...transaction };
    // Ignore already matched transactions
    if (transaction.coverTransaction || transaction.originalTransactionId) {
      newTransactions.push(transaction);
    } else if (
      description.indexOf('Cover from') === 0 ||
      description.indexOf('Forward to') === 0
    ) {
      const normalisedAmount = Math.ceil(amount.valueInBaseUnits / 100);
      // if is a cover transaction
      if (covers.has(normalisedAmount)) {
        covers.get(normalisedAmount)!.push(newTransaction);
      } else {
        covers.set(normalisedAmount, [newTransaction]);
      }
      newTransactions.push(newTransaction);
    } else if (isCategorizable) {
      const normalisedAmount = Math.ceil(-amount.valueInBaseUnits / 100);
      // if is a normal transaction
      if (covers.has(normalisedAmount)) {
        // if there is a matching cover transaction
        const matchedCovers = covers.get(normalisedAmount);
        const poppedCover = matchedCovers!.shift();
        if (matchedCovers!.length === 0) {
          covers.delete(normalisedAmount);
        }

        // To prevent cyclic references, only store the ID in the cover, but
        // store a reference in the orignal for easy access
        Object.assign(poppedCover, { originalTransactionId: transaction.id });
        newTransactions.push(
          Object.assign(newTransaction, { coverTransaction: poppedCover }),
        );
      } else {
        // if no matching cover transaction
        newTransactions.push(newTransaction);
      }
    } else {
      // if neither a cover or a normal transaction
      newTransactions.push(newTransaction);
    }
  }

  return newTransactions;
};

type PaginatedTransactions = {
  list: Array<any>;
  nextUrl?: string;
};
export const paginatedTransactionsState = atomFamily<
  PaginatedTransactions,
  string
>({
  key: 'paginated-transactions',
  default: async (accountId) => {
    const apiKey = window.localStorage.getItem(LOCALSTORAGE_KEY) || '';
    const json = await fetchGet<genericListResponse>({
      apiKey: apiKey,
      url: `https://api.up.com.au/api/v1/accounts/${accountId}/transactions?page[size]=100`,
      errorMessage: 'Error retrieving a list of tags:',
    });
    const withCoverMetadata = findCovers(json.data);
    return {
      list: withCoverMetadata,
      nextUrl: json.links.next,
    };
  },
});

export const loadMoreTransactions = async (
  paginatedTransactions: PaginatedTransactions,
): Promise<PaginatedTransactions> => {
  if (!paginatedTransactions.nextUrl) {
    return paginatedTransactions;
  }

  const apiKey = window.localStorage.getItem(LOCALSTORAGE_KEY);
  const resp = await fetch(paginatedTransactions.nextUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const json = await resp.json();
  const withCoverMetadata = findCovers([
    ...paginatedTransactions.list,
    ...json.data,
  ]);
  return {
    list: withCoverMetadata,
    nextUrl: json.links.next,
  };
};

export const refreshTransactions = async (
  accountId: string,
  transactionsToLoad: number,
) => {
  const apiKey = window.localStorage.getItem(LOCALSTORAGE_KEY);
  let allTransactions: Array<any> = [];
  let nextUrl = `https://api.up.com.au/api/v1/accounts/${accountId}/transactions?page[size]=100`;
  while (transactionsToLoad > 0) {
    transactionsToLoad -= 100;
    const resp = await fetch(nextUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const json = await resp.json();
    allTransactions = [...allTransactions, ...json.data];
    nextUrl = json.links.next;
  }
  const withCoverMetadata = findCovers(allTransactions);
  return {
    list: withCoverMetadata,
    nextUrl,
  };
};
