## Byte-Pair Encoding Explainer: An Interactive Visualization for Understanding Subword Tokenization

Byte-Pair Encoding (BPE) is a subword tokenization technique used by most large language models. Iteratively merging the most frequent adjacent token pairs to build a vocabulary, BPE provides an intuitive way to understand how text is broken down into the units that models actually process. Originally described as a data compression algorithm by Gage (1994), it was adapted for neural machine translation by Sennrich et al. (2016) and later extended to byte-level tokenization in GPT-2 by Radford et al. (2019).

Byte-Pair Encoding Explainer offers an interactive, browser-based way to learn how BPE works. The tool visualizes the algorithm step by step: the training corpus is displayed as a sequence of tokens that visually merge as the algorithm progresses, while side panels show the frequency of token pairs and the growing vocabulary. Users can play, pause, and freely navigate through individual steps, hover over pairs to highlight all their occurrences, and switch between the original algorithm and its LLM-adapted variant with merge restrictions. Users may also provide their own training data to see how token formation depends on the input text. A validation mode lets users tokenize arbitrary text and inspect hierarchical merge trees that reveal how learned subwords are composed across levels.

The tool is accompanied by a blog post that introduces the background concepts needed to understand BPE, from the character-to-word tokenization design space to the out-of-vocabulary problem, and encourages readers to experiment with the visualization at each stage. The blog can be collapsed entirely, allowing the explainer to stand alone as a self-contained interactive demonstration suitable for integration into lectures and workshops on LLMs. The tool requires no installation, runs entirely client-side in the browser.

Our open-sourced tool and blog post is available at:
- **Main:** https://philipmueller.dev/bpe-explainer/
- **GitHub Mirror:** https://muelphil.github.io/bpe-explainer/

This repository holds the source code for the blog post and the tool.

## Tech Stack

- **Vue 3** — composition API, `<script setup>`
- **TypeScript** — strict mode
- **Vite** — build tool and dev server

## How to Run

```bash
npm install
npm run dev        # Vite dev server
npm run build      # Production build
```