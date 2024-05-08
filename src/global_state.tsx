import { atom, selector, selectorFamily, waitForAll } from 'recoil';
import {
  accountsQuery,
  categoriesQuery,
  paginatedTransactionsState,
} from './api_client';

export const UNCATEGORIZED_ID = 'uncategorized';
export const NOT_COVERED_ID = 'none';

type Filters = {
  [key: string]: { [key: string]: boolean };
};
export const filtersState = atom<Filters>({
  key: 'applied-filters',
  default: selector({
    key: 'applied-filter/default',
    get: ({ get }) => {
      const allFilters: Filters = {
        categories: { [UNCATEGORIZED_ID]: true },
        coverAccounts: { [NOT_COVERED_ID]: true },
      };

      const parentCategories = get(categoriesQuery);
      for (const category of parentCategories) {
        for (const childCategory of category.childCategories) {
          allFilters.categories[childCategory.id] = true;
        }
      }

      const accounts = get(accountsQuery);
      for (const account of accounts) {
        allFilters.coverAccounts[account.id] = true;
      }

      return allFilters;
    },
  }),
});

export const searchState = atom<string>({
  key: 'search',
  default: '',
});

export const filteredTransactionsQuery = selectorFamily<any, string>({
  key: 'filtered-transactions',
  get:
    (accountId) =>
    ({ get }) => {
      const transactions = get(paginatedTransactionsState(accountId));
      const { categories, coverAccounts } = get(filtersState);
      const search = get(searchState);

      const filtered = transactions.list.filter((transaction) => {
        const transactionCategory = transaction.relationships.category.data;
        const categoryMatch =
          (transactionCategory && categories[transactionCategory.id]) ||
          categories[UNCATEGORIZED_ID];

        const coveredAccount =
          transaction.coverTransaction &&
          transaction.coverTransaction.relationships.transferAccount.data;
        const coverMatch =
          (coveredAccount && coverAccounts[coveredAccount.id]) ||
          coverAccounts[NOT_COVERED_ID];

        const searchMatch =
          (transaction.attributes.description &&
            transaction.attributes.description
              .toLowerCase()
              .indexOf(search.toLowerCase()) != -1) ||
          (transaction.attributes.rawText &&
            transaction.attributes.rawText
              .toLowerCase()
              .indexOf(search.toLowerCase()) != -1);

        return categoryMatch && coverMatch && searchMatch;
      });

      return filtered;
    },
});

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
