import {
  loadMoreTransactions,
  accountNameQuery,
  paginatedTransactionsState,
  apiKeyState,
  categoryNameQuery,
} from './api_client';
import {
  filteredTransactionsQuery,
  selectedTransactionsState,
} from './global_state';
import { useRecoilValue, useRecoilState } from 'recoil';
import React, { useState, useReducer } from 'react';
import classnames from 'classnames';

function CoverTransaction({ transaction }: { transaction: any }) {
  const {
    description,
    amount: { value },
  } = transaction.attributes;
  return (
    <p>
      &nbsp;└ {description} ({value})
    </p>
  );
}

function Transaction({
  transaction,
  selected,
  onSelectChange,
}: {
  transaction: any;
  selected: boolean;
  onSelectChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const {
    description,
    amount: { value },
    isCategorizable,
  } = transaction.attributes;
  const transferAccountId = transaction.relationships.transferAccount.data
    ? transaction.relationships.transferAccount.data.id
    : null;
  const transferAccountName = useRecoilValue(
    accountNameQuery(transferAccountId),
  );
  const categoryName = useRecoilValue(
    categoryNameQuery(transaction.relationships.category.data?.id),
  );

  return (
    <div className={classnames('Transaction', { disabled: !isCategorizable })}>
      <p>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelectChange}
          disabled={!isCategorizable}
        />
        {description} <span>({value})</span>
        {transferAccountName != null && (
          <span> (from {transferAccountName})</span>
        )}
        <span> in {categoryName}</span>
      </p>
      <p className="tags">
        {transaction.relationships.tags.data &&
          transaction.relationships.tags.data.map((tag: any) => (
            <span key={tag.id}>{tag.id}</span>
          ))}
      </p>
      {transaction.coverTransaction && (
        <CoverTransaction transaction={transaction.coverTransaction} />
      )}
    </div>
  );
}

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
      return <p>Loading more....</p>;
    } else {
      return <p onClick={handleMore}>Load more!</p>;
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
  const selectedTransactionsDispatch = (action: { transactionIds: Array<string>, selected: boolean }) => {
    const { transactionIds, selected } = action;
    setSelectedTransactions((currentSelection) => {
      if (selected) {
        transactionIds.forEach((id) => currentSelection.add(id));
      } else {
        transactionIds.forEach((id) => currentSelection.delete(id));
      }
      return new Set(currentSelection);
    });
  };

  const handleSelect =
    (transactionId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const pos = filteredTransactions.findIndex((t: any) => t.id === transactionId);
      if (event.nativeEvent.shiftKey) {
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
    };

  return (
    <>
      {filteredTransactions
        .filter((transaction: any) => !transaction.originalTransactionId)
        .map((transaction: any) => (
          <Transaction
            key={transaction.id}
            transaction={transaction}
            selected={selectedTransactions.has(transaction.id)}
            onSelectChange={handleSelect(transaction.id)}
          />
        ))}
      <LoadMoreButton accountId={accountId} />
    </>
  );
}
