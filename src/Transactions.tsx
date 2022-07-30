import {
  loadMoreTransactions,
  accountNameQuery,
  paginatedTransactionsState,
  apiKeyState,
  categoryLookupQuery,
} from './api_client';
import {
  filteredTransactionsQuery,
  selectedTransactionsState,
} from './global_state';
import { useRecoilValue, useRecoilState } from 'recoil';
import React, { useState, useReducer, useCallback, useMemo } from 'react';
import classnames from 'classnames';

import './Transactions.css';

function Category({ category }: { category: any }) {
  const {
    attributes: { name },
    relationships: {
      parent: {
        data: { id: parentCategoryId },
      },
    },
  } = category;

  return (
    <span className={classnames('category', parentCategoryId)}>{name}</span>
  );
}

const Transaction = React.memo(({
  transaction,
  selected,
  onSelectChange,
}: {
  transaction: any;
  selected: boolean;
  onSelectChange: (transactionId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const {
    description,
    amount: { value },
    isCategorizable,
    createdAt,
  } = transaction.attributes;
  const category = useRecoilValue(
    categoryLookupQuery(transaction.relationships.category.data?.id),
  );

  const coverAccountId = transaction.coverTransaction
    ? transaction.coverTransaction.relationships.transferAccount.data.id
    : null;
  const coverAccountName = useRecoilValue(accountNameQuery(coverAccountId));
  const coverEmoji = coverAccountName && coverAccountName.split(' ')[0];

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
  };
  const time = new Date(createdAt).toLocaleTimeString('en-AU', options);

  return (
    <div className={classnames('Transaction', { disabled: !isCategorizable })}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(event) => onSelectChange(transaction.id, event)}
        disabled={!isCategorizable}
      />
      <div>
        <p className="time">{time}</p>
        <p>
          {description}
          {coverEmoji && <span className="cover-emoji">{coverEmoji}</span>}
        </p>
        <p className="category-tags">
          {category && <Category category={category} />}
          {transaction.relationships.tags.data &&
            transaction.relationships.tags.data.map((tag: any) => (
              <span key={tag.id} className="tag">
                {tag.id}
              </span>
            ))}
        </p>
      </div>
      <div className="left-side">
        <p className={classnames('price', { positive: value > 0 })}>
          {value < 0 ? `$${Math.abs(value)}` : `+$${value}`}
        </p>
        {transaction.coverTransaction && (
          <p className="covered">{value < 0 ? '<- Covered' : 'Forwarded ->'}</p>
        )}
      </div>
    </div>
  );
});

let lastSelectPos = 0;

function LoadMoreButton({ accountId }: { accountId: string }) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginatedTransactions, setPaginatedTransactions] = useRecoilState(
    paginatedTransactionsState(accountId),
  );

  const handleMore = async () => {
    setLoadingMore(true);
    setPaginatedTransactions(await loadMoreTransactions(paginatedTransactions));
    setLoadingMore(false);
  };

  if (paginatedTransactions.nextUrl) {
    if (loadingMore) {
      return (
        <button className="load-more" disabled>
          Loading more....
        </button>
      );
    } else {
      return (
        <button className="load-more" onClick={handleMore}>
          Load more!
        </button>
      );
    }
  }
  return null;
}

export default function Transactions({ accountId }: { accountId: string }) {
  const filteredTransactions = useRecoilValue(
    filteredTransactionsQuery(accountId),
  );
  const [selectedTransactions, setSelectedTransactions] = useRecoilState(
    selectedTransactionsState,
  );
  const selectedTransactionsDispatch = useCallback(
    (action: {
      transactionIds: Array<string>;
      selected: boolean;
    }) => {
      const { transactionIds, selected } = action;
      setSelectedTransactions((currentSelection) => {
        if (selected) {
          transactionIds.forEach((id) => currentSelection.add(id));
        } else {
          transactionIds.forEach((id) => currentSelection.delete(id));
        }
        return new Set(currentSelection);
      });
    },
    [setSelectedTransactions]
  );

  const handleSelect = useCallback(
    (transactionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const pos = filteredTransactions.findIndex(
        (t: any) => t.id === transactionId,
      );
      if ((event.nativeEvent as KeyboardEvent).shiftKey) {
        const [first, last] =
          lastSelectPos < pos ? [lastSelectPos, pos] : [pos, lastSelectPos];
        const transactionIds = filteredTransactions
          .slice(first, last + 1)
          .filter((transaction: any) => transaction.attributes.isCategorizable)
          .map((transaction: any) => transaction.id);
        selectedTransactionsDispatch({
          transactionIds,
          selected: event.target.checked,
        });
      } else {
        lastSelectPos = pos;
        selectedTransactionsDispatch({
          transactionIds: [transactionId],
          selected: event.target.checked,
        });
      }
    },
    [filteredTransactions,  selectedTransactionsDispatch]
  );

  const transactionsByDate = useMemo(
    () => {
      const transactionsByDateMap = filteredTransactions
        .filter((transaction: any) => !transaction.originalTransactionId)
        .reduce((acc: Map<string, any>, transaction: any) => {
          const d = new Date(transaction.attributes.createdAt);
          const dateString = `${d.getFullYear()}-${
            d.getMonth() + 1
          }-${d.getDate()}`;

          if (!acc.has(dateString)) {
            acc.set(dateString, []);
          }

          acc.get(dateString).push(transaction);

          return acc;
        }, new Map());
      const transactionsByDateEntries: [string, any[]][] = Array.from(
        transactionsByDateMap.entries(),
      );
      return transactionsByDateEntries
        .sort(([a, _], [b, __]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([dateString, transactions]) => {
          const options: Intl.DateTimeFormatOptions = {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          };
          const date = new Date(dateString).toLocaleDateString('en-AU', options);
          transactions.sort(
            (a, b) =>
              new Date(b.attributes.createdAt).getTime() -
              new Date(a.attributes.createdAt).getTime(),
          );
          return { date, transactions };
        });
    },
    [filteredTransactions]
  );
  return (
    <div className="Transactions">
      {transactionsByDate.map(
        ({ date, transactions }: { date: string; transactions: any }) => (
          <div key={date}>
            <p className="date">{date}</p>
            {transactions.map((transaction: any) => (
              <Transaction
                key={transaction.id}
                transaction={transaction}
                selected={selectedTransactions.has(transaction.id)}
                onSelectChange={handleSelect}
              />
            ))}
          </div>
        ),
      )}
      <LoadMoreButton accountId={accountId} />
    </div>
  );
}
