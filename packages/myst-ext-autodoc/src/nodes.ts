import type { GenericNode, GenericParent } from 'myst-common';
import { visit, CONTINUE } from 'unist-util-visit';

const parentNames = [
  'inline',
  'paragraph',
  'bullet_list',
  'list_item',
  'literal_emphasis',
  'literal_strong',

  'field',
  'field_name',
  'field_body',
  'field_list',

  'desc',
  'desc_addname',
  'desc_annotation',
  'desc_classes_injector',
  'desc_content',
  'desc_inline',
  'desc_name',
  'desc_optional',
  'desc_parameter',
  'desc_parameterlist',
  'desc_returns',
  'desc_sig_element',
  'desc_sig_keyword',
  'desc_sig_keyword_type',
  'desc_sig_literal_char',
  'desc_sig_literal_number',
  'desc_sig_literal_string',
  'desc_sig_name',
  'desc_signature',
  'desc_signature_line',
  'desc_sig_operator',
  'desc_sig_punctuation',
  'desc_sig_space',
  'desc_type',
  'desc_type_parameter',
];

function assign(target: Record<string, any>, value: Record<string, any>): Record<string, any> {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });

  Object.assign(target, value);
  return target;
}

export function docutilsToMDAST(node: GenericNode): GenericNode {
  visit(node, (node: GenericNode, index: number | null, parent: GenericNode | undefined) => {
    if (node.type !== 'element') {
      console.log(`Non-XML node ${node.type}`);
      return CONTINUE;
    }

    if (
      [
        'attention',
        'caution',
        'danger',
        'error',
        'hint',
        'important',
        'note',
        'seealso',
        'tip',
        'warning',
      ].includes(node.name)
    ) {
      assign(node, {
        type: 'admonition',
        kind: node.name,
        children: node.children,
        data: node.attributes,
        class: node.attributes.classes,
      });
      return CONTINUE;
    }

    if (parentNames.includes(node.name)) {
      assign(node, {
        type: node.name,
        children: node.children,
        data: node.attributes,
      });
      return CONTINUE;
    } else {
      console.log(`Non-XML node ${node.type}`);
      return CONTINUE;
      throw new Error(`unknown node name ${node.name}!`);
    }
  });
  return node;
}
