import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { fromXml } from 'xast-util-from-xml';
import { selectAll } from 'unist-util-select';
import type { AutoModule } from './types.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GenericParent } from 'myst-common';
import { docutilsToMDAST } from './nodes.js';

const SPHINX_CONF_PY = `
import sys, os

sys.path.insert(0, os.getcwd())
extensions = ["sphinx.ext.autodoc", "sphinx.ext.napoleon"]
`;

function buildAutoModuleRST(node: AutoModule) {
  const bodyArgs = [];
  for (const arg of ['members', 'undoc-members', 'special-members', 'private-members']) {
    if (node[arg] !== undefined) {
      bodyArgs.push(`   :${arg}: ${node[arg]}`);
    }
  }
  const body = bodyArgs.join('\n');
  return `
.. automodule:: ${node.module}
${body}
`;
}

/**
 * Prepare Sphinx and run a build
 * @param opts transform options
 */
export function autodocPlugin() {
  return (mdast: GenericParent) => autodocTransform(mdast);
}


export async function autodocTransform(mdast: GenericParent) {
    // TODO handle options
    const automoduleNodes = selectAll('sphinx-automodule', mdast) as AutoModule[];
    const generatedDirectives = automoduleNodes.map(buildAutoModuleRST);
    if (!automoduleNodes.length) {
      return;
    }

    // Copy to temp
    const dst = await fs.mkdtemp(join(tmpdir(), 'autodoc-'));
    // Write config
    await fs.writeFile(join(dst, 'conf.py'), SPHINX_CONF_PY, {
      encoding: 'utf-8',
    });

    // Spit out index.rst
    await fs.writeFile(join(dst, 'index.rst'), generatedDirectives.join('\n'), {
      encoding: 'utf-8',
    });

    // Run Sphinx build
    const subprocess = spawn('sphinx-build', ['-b', 'xml', dst, join(dst, 'xml')]);
    await new Promise((resolve) => {
      subprocess.on('close', resolve);
    });

    console.info(`🐈 Running Sphinx in ${dst}.`);

    // Parse the resulting XML
    const result = fromXml(await fs.readFile(join(dst, 'xml', 'index.xml')))
    const tree = docutilsToMDAST(result);

    // The actual data follows the target. We want something like target + text + desc as a selector, but I don't know how robust that is.
    const descNodes = selectAll('desc', tree);

    console.log(JSON.stringify(descNodes, null, 2))
    // Group `desc` nodes by module
    const moduleToDesc = new Map();
    descNodes.forEach((node) => {
      // Parse `module-XXX` ID as `XXX`
      const refID = (node as any).data?.ids ?? ''; // TODO: is this plural, i.e separated somehow? Assume not.
      const [_, module] = refID.match(/module-(.*)/);

      // Append desc node to those grouped by module
      if (moduleToDesc.has(module)) {
        moduleToDesc.get(module).push(node);
      } else {
        moduleToDesc.set(module, [node]);
      }
    });

    // Now process each node
    automoduleNodes.forEach((node) => {
      const moduleDescNodes = moduleToDesc.get(node.module);
      if (moduleDescNodes !== undefined) {
        node.children = moduleDescNodes;
      } else {
        console.debug("No autodoc descriptions found. Did you document the correct module?");
      };
    });
  };
