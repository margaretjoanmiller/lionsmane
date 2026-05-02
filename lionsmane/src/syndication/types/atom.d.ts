export type Person = {
  name?: string | undefined;
  uri?: string | undefined;
  email?: string | undefined;
};

export type Category = {
  term?: string;
  scheme?: string;
  label?: string;
};

export type InReplyTo = {
  ref: string;
  href?: string;
  type?: string;
  source?: string;
};

export type Link<TDate extends DateLike> = {
  count?: number;
  updated?: TDate;
};

export type ThreadItem = {
  total?: number;
  inReplyTos?: Array<InReplyTo>;
};
