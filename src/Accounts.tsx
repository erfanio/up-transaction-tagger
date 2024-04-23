import { accountsQuery } from './api_client';
import { useRecoilValue } from 'recoil';
import React, { useState } from 'react';
import Transactions from './Transactions';

import './Accounts.css';

const TRIANGLE_DOWN = '▾';
const TRIANGLE_RIGHT = '▸';

function Account({ account }: { account: any }) {
  const [expanded, setExpanded] = useState(false);
  const handleClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="account">
      <p className="name" onClick={handleClick}>
        {expanded ? (
          <span>{TRIANGLE_DOWN}&nbsp;&nbsp;</span>
        ) : (
          <span>{TRIANGLE_RIGHT}&nbsp;&nbsp;</span>
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
      {accounts.map((account) => (
        <Account key={account.id} account={account} />
      ))}
    </>
  );
}
