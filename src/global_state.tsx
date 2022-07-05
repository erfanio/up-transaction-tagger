import {
  atom,
  selector,
  selectorFamily,
  useRecoilTransaction_UNSTABLE,
} from 'recoil';
import {
  accountsQuery,
  categoriesQuery,
  paginaedTransactionsState,
} from './api_client';

export const UNCATEGORIZED_ID = 'uncategorized';
export const NOT_COVERED_ID = 'none';

export const filtersState = atom({
  key: 'applied-filters',
  default: selector({
    key: 'applied-filter/default',
    get: ({ get }) => {
      const allFilters = {
        categories: { [UNCATEGORIZED_ID]: true },
        coverAccounts: { [NOT_COVERED_ID]: true },
      };

      const parentCategories = get(categoriesQuery);
      for (let category of parentCategories) {
        for (let childCategory of category.childCategories) {
          allFilters.categories[childCategory.id] = true;
        }
      }

      const accounts = get(accountsQuery);
      for (let account of accounts) {
        allFilters.coverAccounts[account.id] = true;
      }

      return allFilters;
    },
  }),
});

export const filteredTransactionsQuery = selectorFamily<any, string>({
  key: 'filtered-transactions',
  get: (accountId) => ({ get }) => {
    const transactions = get(paginaedTransactionsState(accountId));
    const { categories, coverAccounts } = get(filtersState);

    const filtered = transactions.list
      .filter((transaction) => {
        const transactionCategory = transaction.relationships.category.data;
        if (transactionCategory === null) return categories[UNCATEGORIZED_ID];
        return categories[transactionCategory.id];
      })
      .filter((transaction) => {
        if (!transaction.coverTransaction) return coverAccounts[NOT_COVERED_ID];
        const coveredAccount =
          transaction.coverTransaction.relationships.transferAccount.data;
        return coverAccounts[coveredAccount.id];
      });

    return filtered;
  },
});

export const selectedTransactionsState = atom({
  key: 'selected-transactions',
  default: new Set(),
});

export const selectedTransactionsQuery = selector({
  key: 'selected -transactions-query',
  get: async ({ get }) => {
    const accounts = await get(accountsQuery);
    const transactions = [];
    for (let account of accounts) {
      const accountTransactions = await get(
        filteredTransactionsQuery(account.id),
      );
      transactions.push(...accountTransactions);
    }

    const selectedTransactionIds = get(selectedTransactionsState);
    return transactions.filter((t) => selectedTransactionIds.has(t.id));
  },
});
