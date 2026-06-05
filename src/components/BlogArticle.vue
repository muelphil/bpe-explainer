<script setup lang="ts">
</script>

<template>
  <!-- Main blog article container -->
  <article class="blog-article h-full overflow-y-auto">
    <div class="blog-article__inner px-6 py-6">

      <!-- Title -->
      <header class="blog-article__header mb-8">
        <h1 class="blog-article__title text-2xl font-bold leading-tight" style="color: var(--text-primary)">
          Byte-Pair Encoding Explained: The Algorithm Powering Modern LLM Tokenization
        </h1>
        <p class="blog-article__subtitle text-sm mt-2 leading-relaxed" style="color: var(--text-secondary)">
          How does a tokenizer actually learn which subwords to put in its vocabulary? This article covers
          Byte-Pair Encoding: the compression algorithm from 1994 that was repurposed for modern LLMs,
          how it was adapted for neural language model training, how byte-level and character-level
          variants differ, and why tokenizer vocabularies contain strange-looking characters like
          <span class="blog-article__char">Ġ</span> and <span class="blog-article__char">▁</span>.
        </p>
        <p class="blog-article__meta text-xs mt-3" style="color: var(--text-tertiary)">
          Philip Müller &middot; Mar 8, 2026 &middot; 10 minute read
        </p>
      </header>

      <!-- Introduction -->
      <section class="blog-article__section mb-8">
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          In the previous post, we worked through the design space of tokenization vocabularies, going
          from character-level extremes to word-level pitfalls, arriving at subword tokenization as the
          principled middle ground. But we left open the question of how a tokenizer actually learns
          which subwords belong in its vocabulary. Good subwords are not handpicked. They emerge from
          a statistical process that runs over the training corpus before any language model training begins.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          This post covers one of the most widely used algorithms behind that process:
          <strong>Byte-Pair Encoding</strong>, or BPE. Among the several approaches that exist (such as
          WordPiece and Unigram Language Models), BPE-based tokenizers are the most common in modern
          LLMs today. We will look at where the algorithm came from, how it was adapted for language
          model training, and what those strange-looking characters in tokenizer vocabularies actually mean.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          To make the algorithm as concrete as possible, an interactive demo of the training process is
          built into this application. By default, it shows a version that closely resembles the algorithm
          as it is implemented in modern GPT-style tokenizers, but you can switch to the original
          compression version in the settings.
        </p>
      </section>

      <!-- The Original Byte-Pair Encoding -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          The Original Byte-Pair Encoding
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          BPE was first described in 1994 by Philip Gage, not as a tokenization strategy, but as a
          method for <strong>compressing bytes</strong>. The goal was to optimize the byte-level storage
          size of text by replacing frequently recurring byte combinations with shorter representations,
          building a translation table in the process.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The algorithm works iteratively. Starting from individual bytes, it scans the input for the
          most frequently occurring pair of adjacent tokens and merges them into a single new token.
          This new token is added to the vocabulary, all occurrences of the pair in the text are
          replaced, and the process repeats. Each merge reduces the total number of tokens in the text
          by one unit — the two most common neighbors collapse into one.
        </p>

        <!-- Animation figure - references /merging_animation.avif from public/ -->
        <figure class="blog-article__figure mt-6 mb-6">
          <img
            src="/merging_animation.avif"
            alt="Animation showing how a tokenizer builds its vocabulary based on frequencies in the training data"
            class="blog-article__image"
          >
          <figcaption class="blog-article__caption text-xs leading-relaxed mt-2" style="color: var(--text-tertiary)">
            Animation of the Byte-Pair Encoding Visualizer showing how a tokenizer builds its vocabulary
            based on frequencies in the training data. Because the training data contains many words
            ending in "ation," the algorithm repeatedly merges tokens until "ation" emerges as a
            subword-token in the vocabulary.
          </figcaption>
        </figure>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The algorithm continues until no pair of tokens appears more than once in the text (the
          natural break condition of the compression use case), or until a target compression rate is
          reached. The result is a vocabulary encoded as a translation table of all the merges applied,
          alongside the original sequence compressed into a sequence of token IDs. To reconstruct the
          original text, the receiver needs the vocabulary once, then the token IDs.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          It is a simple and elegant algorithm, and that simplicity turns out to be one of the main
          reasons it has held up so well.
        </p>
      </section>

      <!-- Adapting BPE for LLM Tokenization -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          Adapting BPE for LLM Tokenization
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          BPE was originally designed to minimize storage size. When Sennrich et al. (2016) proposed
          repurposing it for neural machine translation, the <strong>goal shifted</strong>: instead of
          compressing text as far as possible, the aim is to produce a fixed-size vocabulary that
          efficiently represents the language. The model needs enough tokens to understand and generate
          text fluently, but not so many that memory and computation become unmanageable.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The algorithm is largely the same, but a few key adjustments make it work well for this new
          purpose:
        </p>

        <ul class="blog-article__list text-sm leading-relaxed mt-3 space-y-2" style="color: var(--text-secondary)">
          <li>
            <strong>Stop condition.</strong> Instead of merging until no pair occurs more than once,
            training stops once the vocabulary reaches a <strong>target size</strong>. This is the
            primary design knob: a larger vocabulary means fewer tokens per sequence, but more memory
            and output-layer computation.
          </li>
          <li>
            <strong>Base units.</strong> Depending on the tokenizer variant, training starts from
            <strong>bytes or characters</strong>. This choice has significant downstream consequences
            for vocabulary coverage and readability, as we will see in the variants below.
          </li>
          <li>
            <strong>Whitespace and control symbols.</strong> Spaces, newlines, and non-printable
            characters need special handling so that merge rules remain unambiguous. More on this below.
          </li>
          <li>
            <strong>Special tokens.</strong> Special control tokens representing end-of-text markers,
            user and system message delimiters and tool call boundaries are added <strong>after
            training</strong> is complete. They are not part of the learned merge list and therefore
            can never be produced by tokenizing ordinary user input — an important security and
            correctness property.
          </li>
        </ul>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Despite these adjustments, the core BPE behavior carries over directly. Merges are applied
          greedily in the order they were learned. Common sequences tend to become single tokens, and
          rare sequences are split into smaller, more frequent subwords. The frequency-aware compression
          that made the original algorithm effective is exactly what makes it useful for language model
          tokenization: the vocabulary naturally mirrors the statistics of the training corpus.
        </p>
      </section>

      <!-- Byte-Level BPE (GPT-2) -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Byte-Level BPE (GPT-2)
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The variant introduced by Radford et al. (2019) for <strong>GPT-2</strong> takes byte-level
          BPE further by starting from all 256 possible byte values as the base alphabet. Before any
          merges are applied, the input text is converted to its UTF-8 byte representation.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          This has one crucial advantage: <strong>universal coverage</strong>. Any string — emojis,
          rare scripts, novel words, deliberate typos — can always be tokenized, because every possible
          input ultimately decomposes into bytes, all of which are in the vocabulary. There is no
          out-of-vocabulary problem.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          GPT-style byte-level BPE remains conceptually simple and scales cleanly to large corpora.
          It is the foundation of the tokenizers used in the GPT series and many models built on the
          same design.
        </p>
      </section>

      <!-- SentencePiece BPE (Meta, Mistral, Qwen) -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          SentencePiece BPE (Meta, Mistral, Qwen)
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          SentencePiece is a language-independent tokenization framework developed at Google in 2018.
          It implements both BPE and Unigram Language Model under a single, unified training pipeline.
          SentencePiece BPE is used in models like Meta's LLaMA, Mistral, and Alibaba's Qwen, and
          starts from <strong>Unicode characters</strong> instead of bytes.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Because Unicode characters are human-readable, the resulting vocabulary is much easier to
          inspect and reason about. The trade-off is that vocabulary sizes tend to be somewhat larger
          than byte-level BPE for equivalent coverage, because individual Unicode code points are a
          less compact base alphabet than raw bytes.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          SentencePiece BPE trades off <strong>absolute universality</strong> for readability and a
          slightly more natural alignment with how words appear in human languages. For multilingual
          models especially, starting from characters rather than bytes can produce more interpretable
          merges.
        </p>
      </section>

      <!-- Whitespace Replacement Characters -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          Whitespace Replacement Characters
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          If you have ever inspected a tokenizer vocabulary directly or worked hands-on with LLM
          tokenization output, you have almost certainly encountered unusual-looking characters taking
          the place of spaces and newlines:
          <code class="blog-article__code">▁</code>,
          <code class="blog-article__code">Ġ</code>, and
          <code class="blog-article__code">Ċ</code> are the most common. These are not accidents or
          encoding errors. They exist for a principled reason rooted in how merge rules are stored.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          When Sennrich et al. (2016) first repurposed BPE for NLP, the learned merge rules were
          stored in a plain-text <code class="blog-article__code">merges.txt</code> file. Each line
          represented one merge:
        </p>

        <!-- Code block for merge format -->
        <pre class="blog-article__codeblock mt-3 mb-6"><code>left_token SPACE right_token NEWLINE</code></pre>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The format uses spaces to separate the two tokens being merged, and newlines to separate
          individual merge rules. This creates a hard constraint: <strong>token strings themselves
          cannot contain spaces or newlines</strong>. If they did, parsing the file would become
          ambiguous, as you could no longer tell where one token ended and the separator began.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The solution is to replace whitespace characters with visible, non-whitespace Unicode symbols
          before storing them. The two main tokenizer families handle this differently.
        </p>
      </section>

      <!-- Why Ġ Represents a Space -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Why <code class="blog-article__code">Ġ</code> Represents a Space in GPT-Style Tokenizers
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          This choice traces back to the byte-level BPE design introduced by Radford et al. (2019)
          for GPT-2. Although byte-level BPE uses individual bytes as its base alphabet, the team
          wanted vocabulary files to remain <strong>human-readable</strong>. So rather than storing
          raw bytes, tokens are stored as Unicode characters.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The problem is that some bytes do not map cleanly to printable Unicode characters. The
          solution was a remapping scheme: common printable ASCII and Latin-1 characters are preserved
          as-is, while the remaining non-printable byte values are mapped to unused Unicode code points
          starting at 256. This also includes spaces and newlines, that would break the format of the
          file storing the merges, as detailed above.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Concretely:
        </p>

        <ul class="blog-article__list text-sm leading-relaxed mt-3 space-y-2" style="color: var(--text-secondary)">
          <li>
            <strong>Space (byte 32)</strong> is mapped to Unicode code point 288 → <strong>Ġ</strong>
          </li>
          <li>
            <strong>Newline (byte 10)</strong> is mapped to Unicode code point 266 → <strong>Ċ</strong>
          </li>
        </ul>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The mapping is injective and reversible: by splitting any token string into its Unicode
          characters and reversing the mapping from Unicode characters back to byte values, you can
          recover the original byte sequence. The scheme guarantees a printable character, no collision
          with standard ASCII, and a clean round-trip back to bytes — exactly what the file-backed
          vocabulary format requires.
        </p>
      </section>

      <!-- Why ▁ Represents a Space -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Why <code class="blog-article__code">▁</code> Represents a Space in SentencePiece Tokenizers
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          SentencePiece uses a different approach. Rather than a byte-level remapping, it simply
          replaces all whitespace characters with the <strong>lower one-eighth block</strong> character
          <code class="blog-article__code">▁</code> (U+2581) before tokenization.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The motivation is stability: text preprocessing pipelines sometimes trim, collapse, or
          normalize whitespace in inconsistent ways. By replacing spaces with a visible, safe
          placeholder before any merges are applied, SentencePiece ensures that tokenization is stable
          and reproducible regardless of external whitespace quirks. The
          <code class="blog-article__code">▁</code> character was chosen because it is visually distinct
          and very rare in natural text, making collisions with genuine input essentially impossible.
        </p>
      </section>

      <!-- How Tokenizers Split Text After Training -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          How Tokenizers Split Text After Training
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The output of the BPE training step is an ordered list of merge rules, which together define
          the vocabulary. When a tokenizer encounters a new string at inference time, such as a user's
          prompt, it does not run the training loop again. Instead, it applies the learned merges in
          a fast forward pass:
        </p>

        <ol class="blog-article__olist text-sm leading-relaxed mt-3 space-y-2" style="color: var(--text-secondary)">
          <li>
            <strong>Split into base units.</strong> For byte-level BPE, this means converting the input
            to its UTF-8 byte sequence and treating each byte as an individual token. For character-level
            variants, the input is split into Unicode characters.
          </li>
          <li>
            <strong>Apply merges greedily in learned order.</strong> Starting from the first merge rule,
            the tokenizer scans the token sequence and replaces all occurrences of the learned pair with
            the merged token. Then it moves to the second merge rule, and so on.
          </li>
          <li>
            <strong>Stop when no more merges apply.</strong> Once the tokenizer has exhausted the merge
            list or no remaining adjacent pairs match any rule, the current token sequence is the final
            tokenization.
          </li>
        </ol>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The ordering of merge rules matters. A pair that was merged earlier in training due to higher
          frequency gets priority over pairs merged later. This is what gives BPE its greedy,
          frequency-aware character: common sequences collapse into single tokens early, while rare or
          novel sequences remain split into their more primitive constituents.
        </p>
      </section>

      <!-- Alternative Approaches -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          Alternative Approaches
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          BPE is not the only subword tokenization algorithm, and it is worth briefly understanding
          the alternatives and why BPE has prevailed in practice.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          <strong>WordPiece</strong> (2016, Google) is also a merge-based subword tokenizer, but the
          criterion for choosing which pair to merge is different. Rather than always picking the most
          frequent pair, WordPiece selects merges that <strong>maximize the improvement to the corpus
          likelihood</strong> — a probabilistic objective. This tends to produce more linguistically
          meaningful merges, and its objective is conceptually aligned with how masked language models
          like BERT are trained. WordPiece is used in BERT and its derivatives.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          <strong>Unigram Language Model</strong> (2018) takes the opposite approach entirely. Rather
          than starting small and merging up, it starts with a large candidate vocabulary and
          <strong>prunes it down</strong> by iteratively removing tokens whose removal least degrades
          the corpus likelihood. The result is a probabilistic tokenizer with a unique property: the
          same word can legitimately be tokenized in multiple ways, each with a probability. This is
          useful for training with regularization, since the model sees the same word represented
          differently across training steps.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          BPE has prevailed in practice largely due to its <strong>simplicity and scalability</strong>.
          It is straightforward to implement, easy to parallelize, and fast on very large corpora. The
          quality differences between BPE, WordPiece, and Unigram LM are small at scale, so the
          practical advantages of BPE — speed, predictability, and a long track record — have made it
          the default choice for most modern LLM tokenizers.
        </p>
      </section>

      <!-- Your Turn -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          Your Turn!
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Now is a good moment to try the interactive visualizer! Now that we have covered the algorithm
          in theory, step through the merge process and watch how the vocabulary gradually emerges from
          the training data. Keep an eye on which fragments get merged first. You will often see common
          subwords like <code class="blog-article__code">ing</code>,
          <code class="blog-article__code">tion</code>, or
          <code class="blog-article__code">pre</code> quickly turn into single tokens, while rarer
          sequences remain split into smaller pieces.
        </p>
      </section>

      <!-- References -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          References
        </h2>

        <div class="blog-article__refs">
          <div class="blog-article__ref">
            <span class="blog-article__ref-authors">Sennrich, R., Haddow, B., Birch, A.</span>
            <span class="blog-article__ref-year">(2016)</span>
            <span class="blog-article__ref-title">Neural Machine Translation of Rare Words with Subword Units</span>.
            <a
              href="https://arxiv.org/abs/1508.07909"
              target="_blank"
              rel="noopener"
              class="blog-article__link"
            >arXiv:1508.07909</a>
          </div>
          <div class="blog-article__ref">
            <span class="blog-article__ref-authors">Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.</span>
            <span class="blog-article__ref-year">(2019)</span>
            <span class="blog-article__ref-title">Language Models are Unsupervised Multitask Learners</span>.
            <a
              href="https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf"
              target="_blank"
              rel="noopener"
              class="blog-article__link"
            >PDF</a>
          </div>
        </div>
      </section>

    </div>
  </article>
</template>

<style scoped>
/* Container */
.blog-article {
  background: var(--bg-primary);
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.blog-article__inner {
  max-width: 100%;
}

/* Header */
.blog-article__header {
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 1.5rem;
}

.blog-article__title {
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.blog-article__subtitle {
  font-size: 1.05rem;
  line-height: 1.65;
}

.blog-article__meta {
  font-size: 0.8rem;
}

/* Special characters in subtitle */
.blog-article__char {
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
  font-weight: 600;
}

/* Headings */
.blog-article__h2 {
  font-size: 1.5rem;
  letter-spacing: -0.025em;
  margin-top: 3.5rem;
  margin-bottom: 1.25rem;
  line-height: 1.3;
}

.blog-article__h3 {
  font-size: 1.15rem;
  letter-spacing: -0.015em;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.35;
}

/* Paragraphs */
.blog-article__paragraph {
  margin: 0 0 1em 0;
  font-size: 1.05rem;
  line-height: 1.75;
}

.blog-article__paragraph:last-child {
  margin-bottom: 0;
}

/* Lists */
.blog-article__list {
  padding-left: 1.5rem;
  list-style: disc;
  font-size: 1.05rem;
  line-height: 1.75;
  margin-bottom: 1em;
}

.blog-article__olist {
  padding-left: 1.5rem;
  list-style: decimal;
  font-size: 1.05rem;
  line-height: 1.75;
  margin-bottom: 1em;
}

/* Inline code */
.blog-article__code {
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  background: var(--bg-tertiary);
  padding: 0.2em 0.45em;
  border-radius: 4px;
  font-weight: 500;
}

/* Code block */
.blog-article__codeblock {
  background: var(--bg-secondary);
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  margin: 1.25rem 0 1.5rem;
  overflow-x: auto;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* Figures */
.blog-article__figure {
  margin: 2rem 0;
}

.blog-article__image {
  width: 100%;
  border-radius: 8px;
  display: block;
}

.blog-article__caption {
  font-size: 0.85rem;
  line-height: 1.55;
  font-style: italic;
  margin-top: 0.75rem;
}

/* Links */
.blog-article__link {
  color: var(--primary);
  text-decoration: none;
}

.blog-article__link:hover {
  text-decoration: underline;
}

/* References */
.blog-article__refs {
  font-size: 0.9rem;
  line-height: 1.6;
}

.blog-article__ref {
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.blog-article__ref:last-child {
  margin-bottom: 0;
}

.blog-article__ref-authors {
  font-style: italic;
}

.blog-article__ref-year {
  font-weight: 600;
}

.blog-article__ref-title {
  font-weight: 600;
}
</style>
