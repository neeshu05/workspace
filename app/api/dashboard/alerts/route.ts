import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { isAuthenticated } from "../../../../lib/auth";
import { formatRelativeAge } from "../../../../lib/time";
import { WordTrie, tokenize } from "../../../../lib/trie";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const SEARCH_SCAN_LIMIT = 500;

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";

  let page, hasMore, nextCursor;

  if (search) {
    // Build a word-prefix trie over the current alert set and use it to match:
    // a query word matches an alert if it's a prefix of one of that alert's words
    // (e.g. "dock" matches "Dock 04" and "Inbound dock nearing capacity").
    const rows = await prisma.alert.findMany({
      where: { closed: false },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: SEARCH_SCAN_LIMIT,
    });

    const trie = new WordTrie();
    for (const a of rows) {
      for (const word of tokenize(`${a.title} ${a.location}`)) trie.insert(word, a.id);
    }

    const queryWords = tokenize(search);
    let matchIds: Set<string> | undefined;
    for (const word of queryWords) {
      const idsForWord: Set<string> = trie.searchPrefix(word);
      const previous: Set<string> | undefined = matchIds;
      matchIds = previous === undefined ? idsForWord : new Set([...previous].filter((id) => idsForWord.has(id)));
    }

    const matches = matchIds === undefined ? rows : rows.filter((a) => matchIds.has(a.id));
    const startIndex = cursor ? matches.findIndex((a) => a.id === cursor) + 1 : 0;
    page = matches.slice(startIndex, startIndex + limit);
    hasMore = startIndex + limit < matches.length;
    nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
  } else {
    const rows = await prisma.alert.findMany({
      where: { closed: false },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    hasMore = rows.length > limit;
    page = hasMore ? rows.slice(0, limit) : rows;
    nextCursor = hasMore ? page[page.length - 1].id : null;
  }

  const alerts = page.map((a) => ({
    id: a.id,
    level: a.level,
    title: a.title,
    location: a.location,
    age: formatRelativeAge(a.createdAt),
  }));

  return NextResponse.json({ alerts, nextCursor, hasMore, updatedAt: new Date().toISOString() });
}
