
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { AutoModule } from './types.js';
/**
 * Interpret the parsed result of :foo: as an empty string, rather than "true"
 */
function coerceString(value: string | undefined): string | undefined {
  switch (value) {
    case "true":
      return "";
    default:
      return value;
  }
}


export const automoduleDirective: DirectiveSpec = {
  name: "automodule",
  doc: "Sphinx automodule connection.",
  arg: { type: String, doc: "The Python module name" },
  options: {
    members: { type: String },
    "undoc-members": { type: String },
    "private-members": { type: String },
    "special-members": { type: String },
  },
  run(data: DirectiveData): GenericNode[]  {
    const node: AutoModule = {
      type: "sphinx-automodule",
      module: data.arg as string,

      members: coerceString(data.options?.members as string | undefined),
      undocMembers: coerceString(data.options?.["undoc-members"] as string | undefined),
      privateMembers: coerceString(data.options?.["private-members"] as string | undefined),
      specialMembers: coerceString(data.options?.["special-members"] as string | undefined),

      children: [],
    };
    return [node];
  },
};
