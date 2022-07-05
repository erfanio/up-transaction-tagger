import {
  loadMoreTransactions,
  accountNameQuery,
  paginaedTransactionsState,
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

function CoverTransaction({ transaction }) {
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

function Transaction({ transaction, selected, onSelectChange }) {
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
          transaction.relationships.tags.data.map((tag) => (
            <span id={tag.id}>{tag.id}</span>
          ))}
      </p>
      {transaction.coverTransaction && (
        <CoverTransaction transaction={transaction.coverTransaction} />
      )}
    </div>
  );
}

let lastSelectPos = 0;

export default function Transactions({ accountId }) {
  const filteredTransactions = useRecoilValue(
    filteredTransactionsQuery(accountId),
  );
  const [selectedTransactions, setSelectedTransactions] = useRecoilState(
    selectedTransactionsState,
  );
  const selectedTransactionsDispatch = (action) => {
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

  const handleSelect = (transactionId: string) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const pos = filteredTransactions.findIndex((t) => t.id === transactionId);
    if (event.nativeEvent.shiftKey) {
      const [first, last] =
        lastSelectPos < pos ? [lastSelectPos, pos] : [pos, lastSelectPos];
      const transactionIds = filteredTransactions
        .slice(first, last + 1)
        .filter((transaction) => transaction.attributes.isCategorizable)
        .map((transaction) => transaction.id);
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

  const [paginatedTransactions, setPaginatedTransactions] = useRecoilState(
    paginaedTransactionsState(accountId),
  );
  const apiKey = useRecoilValue(apiKeyState);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleMore = () => {
    setLoadingMore(true);
    loadMoreTransactions({
      paginatedTransactions,
      setPaginatedTransactions,
      apiKey: apiKey!,
    }).then(() => setLoadingMore(false));
  };

  return (
    <>
      {filteredTransactions
        .filter((transaction) => !transaction.originalTransactionId)
        .map((transaction) => (
          <Transaction
            key={transaction.id}
            transaction={transaction}
            selected={selectedTransactions.has(transaction.id)}
            onSelectChange={handleSelect(transaction.id)}
          />
        ))}
      {paginatedTransactions.nextUrl &&
        (!loadingMore ? (
          <p onClick={handleMore}>Load more!</p>
        ) : (
          <p>Loading more....</p>
        ))}
    </>
  );
}
