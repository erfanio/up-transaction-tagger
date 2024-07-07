import { atom, selector, waitForAll } from 'recoil';
import { accountsQuery } from './accounts';
import { filteredTransactionsQuery } from './filters';

export const selectedTransactionsState = atom<Set<string>>({
  key: 'selected-transactions',
  default: new Set(),
});

export const selectedTransactionsQuery = selector<Array<any>>({
  key: 'selected-transactions-query',
  get: async ({ get }) => {
    const accounts = await get(accountsQuery);
    const accountsTransactionLists = get(
      waitForAll(
        accounts.map((account) => filteredTransactionsQuery(account.id)),
      ),
    );
    const transactions = [];
    for (const accountTransactionList of accountsTransactionLists) {
      transactions.push(...accountTransactionList);
    }

    const selectedTransactionIds = get(selectedTransactionsState);
    return transactions.filter((t) => selectedTransactionIds.has(t.id));
  },
});
