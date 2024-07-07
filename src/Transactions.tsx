import { accountNameQuery } from './data/accounts';
import {
  loadMoreTransactions,
  paginatedTransactionsState,
} from './data/transactions';
import { categoryLookupQuery } from './data/categories';
import { filteredTransactionsQuery } from './data/filters';
import { selectedTransactionsState } from './data/selectedTransactions';
import { useRecoilValue, useRecoilState } from 'recoil';
import React, { useState, useCallback, useMemo } from 'react';
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

const Transaction = React.memo(
  ({
    transaction,
    selected,
    onSelectChange,
  }: {
    transaction: any;
    selected: boolean;
    onSelectChange: (
      transactionId: string,
      event: React.ChangeEvent<HTMLInputElement>,
    ) => void;
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

    const coverAccountId =
      transaction.coverTransaction &&
      transaction.coverTransaction.relationships.transferAccount.data
        ? transaction.coverTransaction.relationships.transferAccount.data.id
        : null;
    const coverAccountName = useRecoilValue(accountNameQuery(coverAccountId));
    const coverEmoji = coverAccountName && coverAccountName.split(' ')[0];

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
    };
    const time = new Date(createdAt).toLocaleTimeString('en-AU', timeOptions);

    const positiveAmount = value > 0;
    const amountOptions = {
      style: 'currency',
      currency: 'AUD',
      trailingZeroDisplay: 'stripIfInteger',
    };
    const formattedAmount = new Intl.NumberFormat(
      'en-AU',
      amountOptions,
    ).format(Math.abs(value));

    return (
      <div
        className={classnames('transaction', { disabled: !isCategorizable })}
      >
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
          <p className={classnames('price', { positive: positiveAmount })}>
            {positiveAmount ? `+${formattedAmount}` : formattedAmount}
          </p>
          {transaction.coverTransaction && (
            <p className="covered">
              {positiveAmount ? 'Forwarded ->' : '<- Covered'}
            </p>
          )}
        </div>
      </div>
    );
  },
);

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
    (action: { transactionIds: Array<string>; selected: boolean }) => {
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
    [setSelectedTransactions],
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
    [filteredTransactions, selectedTransactionsDispatch],
  );

  const transactionsByDate = useMemo(() => {
    const transactionsByDateMap = filteredTransactions
      .filter((transaction: any) => !transaction.originalTransactionId)
      .reduce((acc: Map<string, any>, transaction: any) => {
        // const options: Intl.DateTimeFormatOptions = {
        //   hour: 'numeric',
        //   minute: 'numeric',
        // };
        // const time = new Date(createdAt).toLocaleTimeString('en-AU', options);
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        };
        const formattedDate = new Date(
          transaction.attributes.createdAt,
        ).toLocaleDateString('en-AU', options);

        if (!acc.has(formattedDate)) {
          acc.set(formattedDate, []);
        }

        acc.get(formattedDate).push(transaction);

        return acc;
      }, new Map());
    const transactionsByDateEntries: [string, any[]][] = Array.from(
      transactionsByDateMap.entries(),
    );
    return transactionsByDateEntries
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([formattedDate, transactions]) => {
        transactions.sort(
          (a, b) =>
            new Date(b.attributes.createdAt).getTime() -
            new Date(a.attributes.createdAt).getTime(),
        );
        return { formattedDate, transactions };
      });
  }, [filteredTransactions]);
  return (
    <div className="transactions">
      {transactionsByDate.map(
        ({
          formattedDate,
          transactions,
        }: {
          formattedDate: string;
          transactions: any;
        }) => (
          <div key={formattedDate}>
            <p className="date">{formattedDate}</p>
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
