import Overlay from './Overlay';
import { useState } from 'react';
import { apiKeyState } from './data/apiKey';
import { useSetRecoilState } from 'recoil';
import { ReactComponent as MenuIcon } from './svg/menu.svg';
import './HeaderNav.css';

export default function HeaderNav() {
  const setApiKey = useSetRecoilState(apiKeyState);
  const [menuOpen, setMenuOpen] = useState(false);
  const handleForget = () => {
    setApiKey('');
    // Refresh window to make sure recoil state is cleared.
    window.history.go();
  };
  return (
    <>
      <div className="header-nav">
        <button onClick={() => setMenuOpen(true)}>
          <MenuIcon />
        </button>
        <h1>Up Bank Transactions</h1>
      </div>
      <Overlay open={menuOpen} setOpen={(open) => setMenuOpen(open)}>
        <div className="header-menu">
          <h2>Account</h2>
          <div className="header-menu-item" onClick={handleForget}>
            <h3>Log out</h3>
            <p>Forget my personal access token and go back to home page.</p>
          </div>
          <h2>About</h2>
          <a
            className="header-menu-item"
            href="https://github.com/erfanio/up-transaction-tagger"
            target="_blank"
          >
            <h3>GitHub Repo</h3>
            <p>Totally free and open source!</p>
          </a>
        </div>
      </Overlay>
    </>
  );
}
