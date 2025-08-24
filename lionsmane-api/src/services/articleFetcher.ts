import { parseFeed } from "@rowanmanning/feed-parser";
import { isAfter, sub, subMonths } from "date-fns";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { v7 } from "uuid";
import { db } from "@/db";
import { articles } from "@/db/schema/core";

interface Article {
	id: string;
	title: string;
	url: string;
	authors: string[];
	categories: string[];
	description: string | null;
	rawContent: string | null;
	readableContent: string;
	image: string | null;
	media: string[];
	published: Date;
	updated: Date | null;
}

export async function parseArticlesFromFeed(
	feedUrl: string,
): Promise<Article[]> {
	try {
		const feedXML = await fetch(feedUrl).then((res) => res.text());
		const feed = parseFeed(feedXML);
		if (!feed || !feed.items) {
			throw new Error("No items found in the feed");
		}

		const feedProcess = feed.items
			.filter((i) => {
				return isAfter(
					feed.updated || subMonths(new Date(), 1),
					i.published || new Date(),
				);
			})
			.map(async (item) => {
				if (!item.title || !item.url || !item.published) {
					throw new Error("Item is missing required fields");
				}
				const readableContent = await readablity(item.url);
				return {
					id: v7(),
					title: item.title,
					url: item.url,
					authors: item.authors.map((i) => `${i.name} <${i.email}>`) || [],
					categories: item.categories.map((i) => i.term) || [],
					description: item.description || null,
					rawContent: item.content || null,
					readableContent,
					image: item.image ? item.image.url : null,
					media: item.media.map((media) => media.url) || [],
					published: item.published,
					updated: item.updated || null,
				};
			});
		const arts = await Promise.all(feedProcess).then((articles) => {
			return articles;
		});
		if (arts.length === 0) {
			console.log("No new articles to add");
			return [];
		}
		await db.insert(articles).values(arts);
		return arts;
	} catch (error) {
		console.error("Error parsing feed:", error);
		throw new Error("Failed to parse feed");
	}
}

export async function readablity(url: string): Promise<string> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch URL: ${response.statusText}`);
		}
		const text = await response.text();

		const window = new JSDOM("").window;
		const purify = DOMPurify(window);
		const clean = purify.sanitize(text);
		return clean;
	} catch (error) {
		console.error("Error fetching URL:", error);
		throw new Error("Failed to fetch URL");
	}
}
