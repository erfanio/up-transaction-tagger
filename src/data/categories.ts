import { selector, selectorFamily } from 'recoil';
import { apiKeyState } from './apiKey';
import { get as fetchGet, genericListResponse } from './fetch';

type ChildCategory = {
  id: string;
  relationships: any;
  attributes: { name: string };
};
type Category = {
  id: string;
  relationships: any;
  attributes: { name: string };
  childCategories: Array<ChildCategory>;
};
const makeCategoryTree = (categories: Array<Category>): Array<Category> => {
  const tree = new Map<string, any>();
  // First pass get all the parent categories
  for (const category of categories) {
    if (category.relationships.parent.data == null) {
      tree.set(category.id, { ...category, childCategories: [] });
    }
  }
  // Second pass add children
  for (const category of categories) {
    if (category.relationships.parent.data != null) {
      const parentId = category.relationships.parent.data.id;
      tree.get(parentId)?.childCategories.push(category);
    }
  }
  return Array.from(tree.values());
};
export const categoriesQuery = selector<Array<Category>>({
  key: 'categories',
  get: async ({ get }) => {
    const json = await fetchGet<genericListResponse>({
      apiKey: get(apiKeyState),
      url: 'https://api.up.com.au/api/v1/categories',
      errorMessage: 'Error retrieving a list of categories:',
    });
    return makeCategoryTree(json.data);
  },
});

export const categoryLookupQuery = selectorFamily<any | null, string>({
  key: 'category-lookup',
  get:
    (categoryId) =>
    ({ get }) => {
      const categoryTree = get(categoriesQuery);
      for (const parentCategory of categoryTree) {
        for (const category of parentCategory.childCategories) {
          if (category.id === categoryId) {
            return category;
          }
        }
      }
      return null;
    },
});
