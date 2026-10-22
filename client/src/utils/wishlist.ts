// client/src/utils/wishlist.ts
export const getWishlistKey = () => {
  const userStr = localStorage.getItem("aj_jewellers_user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return `aj_wishlist_${user._id}`;
    } catch(e) {}
  }
  return "aj_wishlist_guest";
};

export const getWishlistItems = (): string[] => {
  return JSON.parse(localStorage.getItem(getWishlistKey()) || "[]");
};

export const saveWishlistItems = (items: string[]) => {
  localStorage.setItem(getWishlistKey(), JSON.stringify(items));
};
