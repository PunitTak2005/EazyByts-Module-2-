/**
 * apiNormalizer.js
 * Reusable normalization layer for backend API responses.
 * Guarantees stable unique identifiers for React rendering keys.
 */

export const normalizeArray = (data, key = 'data') => {
  if (!data) return [];
  let arr = [];
  if (Array.isArray(data)) {
    arr = data;
  } else if (data[key] && Array.isArray(data[key])) {
    arr = data[key];
  } else if (data.data && Array.isArray(data.data)) {
    arr = data.data;
  }

  return arr.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const stableId = item._id || item.id || item.symbol || item.code || `item_${index}`;
      return {
        ...item,
        id: stableId,
        _id: item._id || stableId
      };
    }
    return item;
  });
};

export const normalizeObject = (data, defaults = {}, key = 'data') => {
  if (!data) return defaults;
  let target = data;
  if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
    target = data[key];
  } else if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    target = data.data;
  }
  return { ...defaults, ...target };
};
