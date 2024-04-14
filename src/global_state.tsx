import {
  atom,
  selector,
  selectorFamily,
  useRecoilTransaction_UNSTABLE,
  waitForAll,
} from 'recoil';
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

export const filteredTransactionsQuery = selectorFamily<any, string>({
  key: 'filtered-transactions',
  get:
    (accountId) =>
    ({ get }) => {
      const transactions = get(paginatedTransactionsState(accountId));
      const { categories, coverAccounts } = get(filtersState);

      const filtered = transactions.list
        .filter((transaction) => {
          const transactionCategory = transaction.relationships.category.data;
          if (transactionCategory === null) {
            return categories[UNCATEGORIZED_ID];
          }
          return categories[transactionCategory.id];
        })
        .filter((transaction) => {
          if (!transaction.coverTransaction) {
            return coverAccounts[NOT_COVERED_ID];
          }
          const coveredAccount =
            transaction.coverTransaction.relationships.transferAccount.data;
          if (!coveredAccount) {
            return coverAccounts[NOT_COVERED_ID];
          }
          return coverAccounts[coveredAccount.id];
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
