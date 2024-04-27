import { useRecoilState } from 'recoil';
import { searchState } from './global_state';
import React from 'react';

import { ReactComponent as SearchIcon } from './search.svg';

import './Search.css';

export default function Search() {
  const [search, setSearch] = useRecoilState(searchState);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  return (
    <div className="search">
      <SearchIcon />
      <input type="search" value={search} onChange={handleChange} />
    </div>
  );
}
