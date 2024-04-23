import { accountsQuery, categoriesQuery } from './api_client';
import { filtersState, NOT_COVERED_ID, UNCATEGORIZED_ID } from './global_state';
import { useRecoilState, useRecoilValue } from 'recoil';
import React, { useState } from 'react';
import { ReactComponent as CloseIcon } from './close.svg';

import './Filters.css';

const TRIANGLE_DOWN = '▾';
const TRIANGLE_RIGHT = '▸';

type FilterListItemType = {
  id: string;
  label: string;
  items?: Array<FilterListItemType>;
};

function FilterListItem({
  item,
  filterKey,
}: {
  item: FilterListItemType;
  filterKey: string;
}) {
  const [filters, setFilters] = useRecoilState(filtersState);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((filters) => ({
      ...filters,
      [filterKey]: {
        ...filters[filterKey],
        [item.id]: event.target.checked,
      },
    }));
  };

  return (
    <li>
      <input
        type="checkbox"
        checked={filters[filterKey][item.id]}
        onChange={handleChange}
      />{' '}
      {item.label}
    </li>
  );
}

function FilterListGroup({
  group,
  filterKey,
}: {
  group: FilterListItemType;
  filterKey: string;
}) {
  const [filters, setFilters] = useRecoilState(filtersState);

  const checked = group.items!.every((item) => filters[filterKey][item.id]);
  const handleCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
    const changedFilters: { [key: string]: boolean } = {};
    for (const item of group.items!) {
      changedFilters[item.id] = event.target.checked;
    }
    setFilters((filters) => ({
      ...filters,
      [filterKey]: {
        ...filters[filterKey],
        ...changedFilters,
      },
    }));
  };

  return (
    <>
      <li className="group-option">
        <input type="checkbox" checked={checked} onChange={handleCheck} />{' '}
        {group.label}
      </li>
      <ul>
        {group.items!.map((item) => {
          return (
            <FilterListItem key={item.id} item={item} filterKey={filterKey} />
          );
        })}
      </ul>
    </>
  );
}

function FilterList({
  label,
  items,
  filterKey,
}: {
  label: string;
  items: Array<FilterListItemType>;
  filterKey: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const handleClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="filter-list">
      <p className="name" onClick={handleClick}>
        {expanded ? (
          <span>{TRIANGLE_DOWN}&nbsp;&nbsp;</span>
        ) : (
          <span>{TRIANGLE_RIGHT}&nbsp;&nbsp;</span>
        )}
        {label}
      </p>
      {expanded && (
        <ul>
          {items.map((item) => {
            if (item.items) {
              return (
                <FilterListGroup
                  key={item.id}
                  group={item}
                  filterKey={filterKey}
                />
              );
            } else {
              return (
                <FilterListItem
                  key={item.id}
                  item={item}
                  filterKey={filterKey}
                />
              );
            }
          })}
        </ul>
      )}
    </div>
  );
}

export default function Filters() {
  const categories = useRecoilValue(categoriesQuery);
  const categoryItems: Array<FilterListItemType> = categories.map(
    (parentCategory) => {
      const {
        id,
        attributes: { name },
        childCategories,
      } = parentCategory;
      const items = childCategories.map((category) => ({
        id: category.id,
        label: category.attributes.name,
      }));
      return { id, label: name, items };
    },
  );
  categoryItems.push({
    id: UNCATEGORIZED_ID,
    label: 'Uncategorized',
  });

  const accounts = useRecoilValue(accountsQuery);
  const coverAccountItems: Array<FilterListItemType> = accounts.map(
    (account) => ({
      id: account.id,
      label: account.attributes.displayName,
    }),
  );
  coverAccountItems.push({
    id: NOT_COVERED_ID,
    label: 'Not Covered',
  });

  const [openFilters, setOpenFilters] = useState(false);

  return (
    <>
      <button
        className="filter-button"
        onClick={() => setOpenFilters(!openFilters)}
      >
        Open Filters
      </button>
      {openFilters && (
        <div className="overlay">
          <button
            className="close-overlay-button"
            onClick={() => setOpenFilters(false)}
          >
            <CloseIcon fill="#fff"></CloseIcon>
          </button>
          <div className="filters">
            <h2>Filters</h2>
            <FilterList
              label="Categories"
              filterKey="categories"
              items={categoryItems}
            />
            <FilterList
              label="Cover Accounts"
              filterKey="coverAccounts"
              items={coverAccountItems}
            />
          </div>
        </div>
      )}
    </>
  );
}
