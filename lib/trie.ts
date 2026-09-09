class TrieNode {
  children = new Map<string, TrieNode>();
  // ids of every word that passes through this node, i.e. every id whose
  // word has the path-to-this-node as a prefix. Lets prefix search return
  // in O(prefix length) instead of walking the whole subtree.
  ids = new Set<string>();
}

export class WordTrie {
  private root = new TrieNode();

  insert(word: string, id: string) {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      next.ids.add(id);
      node = next;
    }
  }

  searchPrefix(prefix: string): Set<string> {
    let node = this.root;
    for (const ch of prefix) {
      const next = node.children.get(ch);
      if (!next) return new Set();
      node = next;
    }
    return node.ids;
  }
}

export function tokenize(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
