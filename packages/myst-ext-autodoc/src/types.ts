import type { GenericParent } from 'myst-common';

export type AutoModule = GenericParent & {
  module: string;
  members?: string;
  undocMembers?: string;
  privateMembers?: string;
  specialMembers?: string;
};
