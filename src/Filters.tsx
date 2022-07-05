import { accountsQuery, categoriesQuery } from './api_client';
import { filtersState, NOT_COVERED_ID, UNCATEGORIZED_ID } from './global_state';
import { useRecoilState, useRecoilValue } from 'recoil';
import React, { useState } from 'react';

const TRIANGLE_DOWN = '▾';
const TRIANGLE_RIGHT = '▸';

function FilterListItem({ id, label, filterKey }) {
  const [filters, setFilters] = useRecoilState(filtersState);

  const handleChange = (id) => (event) => {
    setFilters((filters) => ({
      ...filters,
      [filterKey]: {
        ...filters[filterKey],
        [id]: event.target.checked,
      },
    }));
  };

  return (
    <li key={id}>
      <input
        type="checkbox"
        checked={filters[filterKey][id]}
        onChange={handleChange(id)}
      />{' '}
      {label}
    </li>
  );
}

function FilterListGroup({ groupId, groupLabel, filterKey, items }) {
  const [filters, setFilters] = useRecoilState(filtersState);

  const groupChecked = items.every((item) => filters[filterKey][item.id]);
  const groupHandleCheck = (event) => {
    const changedFilters = {};
    for (let item of items) {
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
        <input
          type="checkbox"
          checked={groupChecked}
          onChange={groupHandleCheck}
        />{' '}
        {groupLabel}
      </li>
      <ul>
        {items.map((item) => {
          const { id, label } = item;
          return (
            <FilterListItem
              key={id}
              id={id}
              label={label}
              filterKey={filterKey}
            />
          );
        })}
      </ul>
    </>
  );
}

function FilterList({ label, items, filterKey }) {
  const [expanded, setExpanded] = useState(false);
  const handleClick = (event) => {
    setExpanded(!expanded);
  };

  return (
    <div className="FilterList">
      <p className="name" onClick={handleClick}>
        {expanded ? (
          <span>{TRIANGLE_DOWN}&nbsp;</span>
        ) : (
          <span>{TRIANGLE_RIGHT}&nbsp;</span>
        )}
        {label}
      </p>
      {expanded && (
        <ul>
          {items.map((item) => {
            const { id, label, nestedItems } = item;
            if (nestedItems) {
              return (
                <FilterListGroup
                  key={id}
                  groupId={id}
                  groupLabel={label}
                  filterKey={filterKey}
                  items={nestedItems}
                />
              );
            } else {
              return (
                <FilterListItem
                  key={id}
                  id={id}
                  label={label}
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
  const categoryItems = categories.map((parentCategory) => {
    const {
      id,
      attributes: { name },
      childCategories,
    } = parentCategory;
    const nestedItems = childCategories.map((category) => ({
      id: category.id,
      label: category.attributes.name,
    }));
    return { id, label: name, nestedItems };
  });
  categoryItems.push({
    id: UNCATEGORIZED_ID,
    label: 'Uncategorized',
  });

  const accounts = useRecoilValue(accountsQuery);
  const coverAccountItems = accounts.map((account) => ({
    id: account.id,
    label: account.attributes.displayName,
  }));
  coverAccountItems.push({
    id: NOT_COVERED_ID,
    label: 'Not Covered',
  });

  return (
    <div className="filters">
      <p>Filters</p>
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
  );
}
