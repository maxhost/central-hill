/**
 * `blog` page content schema (ADR 0012). Source-locale values only.
 *
 * Holds the blog copy that is not a post: today, the CTA at the bottom of every post's sticky
 * aside ("In this article" card, `mock/blog-post.html` `.aside-cta`). Its destination is fixed in
 * code (the visitor's locale `/owners`), like Home's owners CTA, so only the copy is editable. A
 * post with its own `cta_label`/`cta_url` replaces this button (blog slice).
 *
 * `defaultBlog` is the approved mock copy: the seed, the migration that creates the row and the
 * renderer fallback (no row, or a row that fails the schema).
 */
import { z } from "zod";
import { tStr, tStrOpt } from "@core/validation/primitives";

export const blogSchema = z.object({
  post_aside: z
    .object({
      eyebrow: tStrOpt({ max: 80 }),
      title: tStr({ max: 120 }),
      body: tStrOpt({ max: 280 }),
      cta_label: tStr({ max: 60 }),
    })
    .describe("Call to action under the table of contents of every post. The button goes to the Owners page."),
});
export type BlogContent = z.infer<typeof blogSchema>;

export const defaultBlog: BlogContent = {
  post_aside: {
    eyebrow: "Own a property in Lisbon?",
    title: "See what your apartment could earn",
    body: "A free, no-obligation estimate based on your neighbourhood, size and season.",
    cta_label: "Get a free estimate →",
  },
};
