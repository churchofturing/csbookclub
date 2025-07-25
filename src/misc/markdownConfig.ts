// TODO: Come back and type check this.
// I don't even remember writing it, I'm not sure I did, it looks horrendous.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const rendererRule = (tokens, idx, options) => options.replace(tokens[idx].content);

const coreRuler = (state, options) => {
  for (let i = 0; i < state.tokens.length; i += 1) {
    if (state.tokens[i].type !== 'inline') {
      continue;
    }
    let tokens = state.tokens[i].children;
    for (let j = tokens.length - 1; j >= 0; j -= 1) {
      const token = tokens[j];
      if (token.type === 'text' && options.regex.test(token.content)) {
        const newTokens = token.content
          .split(options.regex)
          .map((item, index) => ({ type: index % 2 === 0 ? 'text' : options.name, content: item }))
          .filter((item) => item.content.length > 0)
          .map((item) => {
            const newToken = new state.Token(item.type, '', 0);
            newToken.content = item.content;
            return newToken;
          });

        state.tokens[i].children = tokens = [
          ...tokens.slice(0, j),
          ...newTokens,
          ...tokens.slice(j + 1),
        ];
      }
    }
  }
};

function blockquotePlugin(md) {
  md.core.ruler.push('blockquote', (state) => {
    const { tokens } = state;
    for (let i = 0; i < tokens.length; i += 1) {
      if (tokens[i].type === 'paragraph_open') {
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === 'inline') {
          const { children } = nextToken;
          if (children && children.length > 0) {
            const firstChild = children[0];
            if (
              firstChild.type === 'text' &&
              firstChild.content.startsWith('>') &&
              !firstChild.content.startsWith('>>')
            ) {
              const divOpenToken = new state.Token('div_open', 'div', 1);
              divOpenToken.attrs = [['class', 'textquote']];
              const divCloseToken = new state.Token('div_close', 'div', -1);
              tokens.splice(i, 0, divOpenToken);
              tokens.splice(i + 4, 0, divCloseToken);
              i += 2; // Move the index to skip the newly added tokens
            }
          }
        }
      }
    }
  });
}

const markdownItRegex = (md, options) => {
  md.renderer.rules[options.name] = (tokens, idx) => rendererRule(tokens, idx, options);

  md.core.ruler.push(options.name, (state) => {
    coreRuler(state, options);
  });
};

export { markdownItRegex, coreRuler, rendererRule, blockquotePlugin };
