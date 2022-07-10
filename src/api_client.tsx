import {
  atom,
  selector,
  atomFamily,
  selectorFamily,
  SetterOrUpdater,
} from 'recoil';

const LOCALSTORAGE_KEY = 'up-tagger-api-key';

export const apiKeyState = atom<string | null>({
  key: 'api-key',
  default: window.localStorage.getItem(LOCALSTORAGE_KEY),
  effects: [
    ({ onSet }) => {
      onSet((apiKey) => window.localStorage.setItem(LOCALSTORAGE_KEY, apiKey!));
    },
  ],
});

export const accountsQuery = selector<Array<any>>({
  key: 'accounts',
  get: async ({ get }) => {
    const resp = await fetch('https://api.up.com.au/api/v1/accounts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${get(apiKeyState)}`,
      },
    });
    const json: { data: Array<any> } = await resp.json();
    return json.data;
  },
});

export const accountNameQuery = selectorFamily<string | null, string>({
  key: 'accountName',
  get:
    (accountId) =>
    ({ get }) => {
      if (accountId === null) return null;
      const accounts = get(accountsQuery);
      const match = accounts.find((account) => account.id === accountId);
      if (match === undefined) return 'UNKNOWN';
      return match.attributes.displayName;
    },
});

const findCovers = (transactions: Array<any>) => {
  const covers = new Map<number, Array<any>>();
  const newTransactions = [];
  for (let transaction of transactions) {
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
  nextUrl: string | null;
};
export const paginatedTransactionsState = atomFamily<
  PaginatedTransactions,
  string
>({
  key: 'paginated-transactions',
  default: async (accountId) => {
    const apiKey = window.localStorage.getItem(LOCALSTORAGE_KEY);
    const resp = await fetch(
      `https://api.up.com.au/api/v1/accounts/${accountId}/transactions?page[size]=100`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const json = await resp.json();
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
  if (!paginatedTransactions.nextUrl) return paginatedTransactions;

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
  pageSize: number,
) => {
  const apiKey = window.localStorage.getItem(LOCALSTORAGE_KEY);
  const resp = await fetch(
    `https://api.up.com.au/api/v1/accounts/${accountId}/transactions?page[size]=${pageSize}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  const json = await resp.json();
  const withCoverMetadata = findCovers(json.data);
  return {
    list: withCoverMetadata,
    nextUrl: json.links.next,
  };
};

type ChildCategory = {
  id: string;
  relationships: any;
  attributes: { name: string };
};
type Category = {
  id: string;
  relationships: any;
  attributes: { name: string };
  childCategories: Array<Category>;
};
const makeCategoryTree = (categories: Array<Category>): Array<Category> => {
  const tree = new Map<string, any>();
  // First pass get all the parent categories
  for (let category of categories) {
    if (category.relationships.parent.data == null) {
      tree.set(category.id, { ...category, childCategories: [] });
    }
  }
  // Second pass add children
  for (let category of categories) {
    if (category.relationships.parent.data != null) {
      const parentId = category.relationships.parent.data.id;
      tree.get(parentId)?.childCategories.push(category);
    }
  }
  return Array.from(tree.values());
};
export const categoriesQuery = selector<Array<Category>>({
  key: 'categories',
  get: async ({ get }) => {
    const resp = await fetch('https://api.up.com.au/api/v1/categories', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${get(apiKeyState)}`,
      },
    });
    const json: { data: Array<any> } = await resp.json();
    return makeCategoryTree(json.data);
  },
});

export const categoryNameQuery = selectorFamily<string, string>({
  key: 'category-name',
  get:
    (categoryId) =>
    ({ get }) => {
      const categoryTree = get(categoriesQuery);
      for (let parentCategory of categoryTree) {
        for (let category of parentCategory.childCategories) {
          if (category.id === categoryId) {
            return category.attributes.name;
          }
        }
      }
      return 'Uncategorized';
    },
});

export const tagsQuery = selector<Array<any>>({
  key: 'tags',
  get: async ({ get }) => {
    const resp = await fetch('https://api.up.com.au/api/v1/tags', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${get(apiKeyState)}`,
      },
    });
    const json: { data: Array<any> } = await resp.json();
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

  return Promise.all(requests)
    .then((done) => console.log(done))
    .catch((e) => console.error(e));
};
