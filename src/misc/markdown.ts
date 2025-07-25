import MarkdownIt from 'markdown-it';
import mathjax3 from 'markdown-it-mathjax3';
import { markdownItRegex, blockquotePlugin } from './markdownConfig.js';

export const createMarkdownRenderer = (slug: string, threadSlug?: string, globalCount?: bigint) => {
  const md = MarkdownIt();

  /*
    On the topic of blockquoting.

    Blockquoting, using markdown-it at least, it a bit of a tricky thing for public-facing
    user input. For instance if someone entered a string such as ">>>>>>>>>>>>>>>", this
    would create 15 nested <blockquote> elements. The potential for abuse is obvious.
    There's no way to really set a limit on this other than manually checking whether someone's
    used N consecutive greater-than symbols.

    This isn't enough either, as the string "> > > > > > > > > > > > > > >"
    produces the same output.
    Blockquoting in markdown also interferes with using quotes in traditional textboard style.
    It renders ">implying" inside of block quotes, and it parses ">>2342" as
    "blockquote inside a blockquote with the text 2342".

    It's for these reasons we disable the blockquote, and implement our own version.
    Lines beginning with ">" are surrounded in a "quote" div, and words beginning with ">>"
    are replaced with links.

    Tl;dr - markdown blockquotes are annoying, so we disable it and implement our own.
  */

  md.disable(['blockquote', 'image', 'table']);
  md.use(mathjax3);
  md.use(blockquotePlugin);
  md.use(markdownItRegex, {
    name: 'reply_quote',
    regex: />>(\d+)/,
    replace: (match: string) => {
      if (threadSlug && globalCount) {
        return `<a href='/${slug}/${globalCount}/${threadSlug}#${match}'>>>${match}</a>`;
      } else {
        return `<a href='/${slug}/${match}'>>>${match}</a>`;
      }
    },
  });

  return md;
};

export default global.markdown;
