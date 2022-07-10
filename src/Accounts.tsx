import { accountsQuery } from './api_client';
import { filteredTransactionsQuery } from './global_state';
import { useRecoilValue, useRecoilValueLoadable } from 'recoil';
import React, { useState } from 'react';
import Transactions from './Transactions';

const TRIANGLE_DOWN = '▾';
const TRIANGLE_RIGHT = '▸';

function Account({ account }: { account: any }) {
  const [expanded, setExpanded] = useState(false);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setExpanded(!expanded);
  };

  const transactionsLoadable = useRecoilValueLoadable(
    filteredTransactionsQuery(account.id),
  );

  return (
    <div className="Account">
      <p className="name" onClick={handleClick}>
        {expanded ? (
          <span>{TRIANGLE_DOWN}&nbsp;</span>
        ) : (
          <span>{TRIANGLE_RIGHT}&nbsp;</span>
        )}
        {account.attributes.displayName}
      </p>
      <React.Suspense fallback={<p>Loading transactions...</p>}>
        {expanded && <Transactions accountId={account.id} />}
      </React.Suspense>
    </div>
  );
}

export default function Accounts() {
  const accounts = useRecoilValue(accountsQuery);

  return (
    <>
      <hr />
      <p>Accounts</p>
      {accounts.map((account) => (
        <Account key={account.id} account={account} />
      ))}
    </>
  );
}
