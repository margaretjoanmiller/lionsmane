export const FilterAction = {
  BLUR: "blur",
  HIDE: "hide",
  MARKREAD: "markRead",
} as const;

export type TFilterAction = (typeof FilterAction)[keyof typeof FilterAction];
