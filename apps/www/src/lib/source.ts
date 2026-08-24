import { type CollectionEntry, getCollection } from "astro:content";
import * as path from "node:path";
import { type StructuredData, structure } from "fumadocs-core/mdx-plugins";
import type { StaticSource } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";

export const source = loader({
  source: await createMySource(),
  baseUrl: "/docs",
});

export function getStructuredData(
  entry: CollectionEntry<"docs">,
): StructuredData {
  return structure(entry.body);
}

export function getPageImageUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "image.webp"];

  return `/${[page.locale, "og", "docs", ...segments].filter(Boolean).join("/")}`;
}

async function createMySource() {
  const out: StaticSource<{
    metaData: CollectionEntry<"meta">["data"];
    pageData: CollectionEntry<"docs">["data"] & {
      _raw: CollectionEntry<"docs">;
    };
  }> = {
    files: [],
  };

  for (const page of await getCollection("docs")) {
    if (!page.filePath) {
      throw new Error(`Docs entry "${page.id}" is missing a filePath`);
    }
    const virtualPath = path.relative("content/docs", page.filePath);

    out.files.push({
      type: "page",
      path: virtualPath,
      data: {
        ...page.data,
        _raw: page,
      },
    });
  }

  for (const meta of await getCollection("meta")) {
    if (!meta.filePath) {
      throw new Error(`Meta entry "${meta.id}" is missing a filePath`);
    }
    const virtualPath = path.relative("content/docs", meta.filePath);

    out.files.push({
      type: "meta",
      path: virtualPath,
      data: meta.data,
    });
  }

  return out;
}
