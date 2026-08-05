export const profileKeys = {
  all: ["profile"] as const,
  admin: () => [...profileKeys.all, "admin"] as const,
};
