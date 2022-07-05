import {
  selectedTransactionsState,
  selectedTransactionsQuery,
} from './global_state';
import { tagsQuery, tagTransactions } from './api_client';
import { useRecoilValue } from 'recoil';
import React, { useState } from 'react';

function AddTag({ closePopup }) {
  const selectedTransactionIds = useRecoilValue(selectedTransactionsState);
  const selectedTransactions = useRecoilValue(selectedTransactionsQuery);
  const tags = useRecoilValue(tagsQuery);
  const [selectedTag, setSelectedTag] = useState('');
  const handleSelectTag = ({ target }) => {
    setSelectedTag(target.value);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    tagTransactions(Array.from(selectedTransactionIds), selectedTag);
  };

  console.log(selectedTransactions);
  return (
    <div className="AddTag">
      <div className="popup-content">
        <button onClick={closePopup}>Close</button>
        <form onSubmit={handleSubmit}>
          <select onChange={handleSelectTag}>
            <option id="" selected={selectedTag === ''}></option>
            {tags.map((tag) => (
              <option id={tag.id} selected={selectedTag === tag.id}>
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
                  transaction.relationships.tags.data.map((tag) => (
                    <span id={tag.id}>{tag.id}</span>
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
  const selectedTransactions = useRecoilValue(selectedTransactionsState);
  const [tagPopup, setTagPopup] = useState(false);
  const changeTagPopup = (open: boolean) => () => setTagPopup(open);

  if (selectedTransactions.size === 0) return null;
  return (
    <>
      <div className="ActionBar">
        <p>Selected {selectedTransactions.size} transactions</p>
        <button onClick={changeTagPopup(true)}>Add Tag</button>
      </div>
      {tagPopup && <AddTag closePopup={changeTagPopup(false)} />}
    </>
  );
}
