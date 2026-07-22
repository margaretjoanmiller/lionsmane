import { it, expect } from "vitest";
import { parseArticlesRss } from ".";
import { subMonths } from "date-fns";

describe("Testing the parse and normalization functions", () => {
  it("Tests how the parseRssFeed handles invalid feeds", () => {
    expect(
      parseArticlesRss([], subMonths(new Date(), 3), "019f8b15-d620-73ef-af32-b9008f90049b"),
    ).toStrictEqual([]);
  });
});
