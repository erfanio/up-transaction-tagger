import {
  selectedTransactionsState,
  selectedTransactionsQuery,
} from './global_state';
import {
  tagsQuery,
  tagTransactions,
  accountsQuery,
  paginatedTransactionsState,
  refreshTransactions,
} from './api_client';
import { useRecoilValue, useRecoilCallback, useRecoilState } from 'recoil';
import React, { useState } from 'react';

function AddTag({ closePopup }: { closePopup: () => void }) {
  const selectedTransactionIds = useRecoilValue(selectedTransactionsState);
  const selectedTransactions = useRecoilValue(selectedTransactionsQuery);
  const tags = useRecoilValue(tagsQuery);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSelectTag = ({
    target,
  }: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTag(target.value);
  };
  const handleSubmit = useRecoilCallback(
    ({ snapshot, set }) =>
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        await tagTransactions(Array.from(selectedTransactionIds), selectedTag);

        const accounts = snapshot.getLoadable(accountsQuery).valueOrThrow();
        for (let account of accounts) {
          let transactionCount = snapshot
            .getLoadable(paginatedTransactionsState(account.id))
            .valueOrThrow().list.length;
          set(
            paginatedTransactionsState(account.id),
            await refreshTransactions(account.id, transactionCount),
          );
        }

        closePopup();
      },
  );

  if (loading) {
    return (
      <div className="AddTag">
        <div className="popup-content">
          Loading...
        </div>
      </div>
    );
  }
  return (
    <div className="AddTag">
      <div className="popup-content">
        <button onClick={closePopup}>Close</button>
        <form onSubmit={handleSubmit}>
          <select onChange={handleSelectTag} value={selectedTag}>
            <option id=""></option>
            {tags.map((tag) => (
              <option key={tag.id} id={tag.id}>
                {tag.id}
              </option>
            ))}
          </select>
          <input type="submit" value="Add Tag" disabled={selectedTag === ''} />
        </form>
        <p>
          <strong>Affected Transactions</strong>
        </p>
        <div className="affected-transactions">
          {selectedTransactions.map((transaction) => (
            <div key={transaction.id}>
              <p>{transaction.attributes.description}</p>
              <p className="tags">
                {transaction.relationships.tags.data &&
                  transaction.relationships.tags.data.map((tag: any) => (
                    <span key={tag.id}>{tag.id}</span>
                  ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ActionBar() {
  const [selectedTransactions, setSelectedTransactions] = useRecoilState(selectedTransactionsState);
  const [tagPopup, setTagPopup] = useState(false);
  const changeTagPopup = (open: boolean) => () => setTagPopup(open);
  const clearSelection = () => setSelectedTransactions(new Set());

  if (selectedTransactions.size === 0) return null;
  return (
    <>
      <div className="ActionBar">
        <p>Selected {selectedTransactions.size} transactions</p>
        <button onClick={changeTagPopup(true)}>Add Tag</button>
        <button onClick={clearSelection}>Clear Selection</button>
      </div>
      {tagPopup && <AddTag closePopup={changeTagPopup(false)} />}
    </>
  );
}
