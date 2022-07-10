import { accountsQuery, categoriesQuery } from './api_client';
import { filtersState, NOT_COVERED_ID, UNCATEGORIZED_ID } from './global_state';
import { useRecoilState, useRecoilValue } from 'recoil';
import React, { useState } from 'react';

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
    for (let item of group.items!) {
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
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
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
