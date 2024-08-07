import type { DirectiveSpec, GenericNode } from 'myst-common';

export const genIndexDirective: DirectiveSpec = {
  name: 'genindex',
  arg: {
    type: 'myst',
    doc: 'Heading to be included in index block',
  },
  run(data): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      const parsedArg = data.arg as GenericNode[];
      if (parsedArg[0]?.type === 'heading') {
        children.push(...parsedArg);
      } else {
        children.push({
          type: 'heading',
          depth: 1,
          children: parsedArg,
        });
      }
    }

    return [{ type: 'genindex', children }];
  },
};
