<script setup lang="ts">
import AutoregressiveLLM from './tokenization/AutoregressiveLLM.vue'
import CharacterTokenization from './tokenization/CharacterTokenization.vue'
import CharacterCombinations from './tokenization/CharacterCombinations.vue'
import VocabularySpaces from './tokenization/VocabularySpaces.vue'
</script>

<template>
  <!-- Main blog article container -->
  <article class="blog-article h-full overflow-y-auto">
    <div class="blog-article__inner px-6 py-6">

      <!-- ============================================= -->
      <!-- POST 1: From Text to Tokens                   -->
      <!-- ============================================= -->

      <!-- Title -->
      <header class="blog-article__header mb-8">
        <h1 class="blog-article__title font-bold leading-tight" style="color: var(--text-primary); font-size:1.8rem;">
          From Text to Tokens: The Balancing Act Behind LLM Vocabularies
        </h1>
        <p class="blog-article__subtitle text-sm mt-2 leading-relaxed" style="color: var(--text-secondary)">
          Before a large language model can generate a single word, it needs to convert raw text into tokens.
          This post works through the design space of tokenization vocabularies, going from character-level
          extremes to word-level pitfalls, to build intuition for why modern models settle on subword tokenization.
        </p>
        <p class="blog-article__meta text-xs mt-3" style="color: var(--text-tertiary)">
          Philip Müller &middot; Feb 27, 2026 &middot; 8 minute read
        </p>
      </header>

      <!-- Introduction -->
      <section class="blog-article__section mb-8">
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Understanding how large language models work is crucial for both effective use and research.
          This post covers the very first step in the processing chain of an LLM: tokenization.
        </p>
      </section>

      <!-- What Are Transformers, Really? -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          What Are Transformers, Really?
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Transformers are named for the architecture's mechanism of transforming sequence representations via
          self-attention and feed-forward layers, replacing recurrence and convolution. While originally
          designed to translate text in one language into another, they were quickly adapted to solve all
          kinds of transformations: text to image, image to text, speech to text. What makes this
          architecture so general is how it splits up input data into processable chunks that can carry
          semantic meaning. Depending on the use case, these chunks might be pixel patches, segments of a
          sound wave, or — in the case of text — words, subwords, or even single characters.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Large language models are built on this same architecture. Fundamentally, they are
          <em>next-token predictors</em>: given a sequence of tokens, the model predicts the most likely
          next token based on context and learned internal representations, one after another.
        </p>

        <figure class="blog-article__figure mt-6 mb-6">
          <AutoregressiveLLM
            :start-tokens="['Paris', 'is', 'the']"
            :inferred-tokens="[' city', 'of', 'light', '.', '&lt;endoftext&gt;']"
            :speed="1"
          />
          <figcaption class="blog-article__caption text-xs leading-relaxed mt-2" style="color: var(--text-tertiary)">
            Autoregressive inference: the model processes a sequence of tokens and predicts the next token
            at each step. After each prediction, the newly generated token is appended to the sequence and
            fed back into the model as part of the context for the next forward pass. The visualization
            shows both the textual tokens and their corresponding integer token IDs (bottom right).
          </figcaption>
        </figure>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The first step on this journey is tokenization: splitting raw text into the chunks that can be
          fed to the LLM. This post builds intuition for the tradeoffs of different vocabulary structures
          and sizes from first principles. In the next one, we will see how the frequency-based compression
          algorithms used in modern tokenizers arrive at a remarkably similar solution through statistical
          optimization.
        </p>
      </section>

      <!-- Understanding the Sizes of Vocabularies -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          Understanding the Sizes of Vocabularies
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Before diving into the tradeoffs, it helps to establish some shared vocabulary (no pun intended):
        </p>

        <ul class="blog-article__list text-sm leading-relaxed mt-3 space-y-2" style="color: var(--text-secondary)">
          <li>
            <strong>Tokens</strong> are the discrete units a language model processes and predicts. In text
            models, a token might be a single character, part of a word, or an entire word, depending on
            how the tokenizer splits the input.
          </li>
          <li>
            <strong>Subwords</strong> are common fragments of words learned from patterns in the training
            data, many of them aligning with meaningful parts like prefixes or suffixes. For example,
            <code class="blog-article__code">ability</code> is a subword that may be used in the construction
            of <code class="blog-article__code">applicability</code> and
            <code class="blog-article__code">generalizability</code>.
          </li>
          <li>
            <strong>Token IDs</strong> are the unique numerical identifiers for each token in the vocabulary.
            After tokenization, the model works with these IDs, which identify the token regardless of
            whether it represents a character, subword, or whole word.
          </li>
          <li>
            <strong>Vocabulary</strong> is the complete set of tokens a model knows.
          </li>
        </ul>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The goal of tokenization is to produce discrete units that carry semantic meaning. Later, these
          meanings are captured by learned vectors of fixed size, called embeddings. After tokenization and
          embedding, most of the computation an LLM performs to predict the next token operates on these
          embeddings.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Today, tokenizers are the only components trained independently <em>before</em> the otherwise
          end-to-end training pipelines of LLMs. Modern models use vocabularies ranging from tens of
          thousands of tokens to several hundred thousand in multilingual settings. As an example,
          <a
            href="https://ai.meta.com/blog/meta-llama-3/"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >Llama-3.1-70B supports 7 languages and has a vocabulary size of 128,000</a>.
          Deciding which tokens go into the vocabulary (and how many) is far from trivial.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          As a software engineer, I like to evaluate edge cases to get a full picture of the tradeoffs at
          play. Working through the extremes is what really helped me understand why researchers chose the
          tokenization algorithms and vocabulary sizes most common in modern LLMs. So let's start there.
        </p>
      </section>

      <!-- Using Characters -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Using Characters (and Only Characters) as Tokens
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          A simple edge case would be to use the alphabet as a vocabulary; essentially the same idea as
          ASCII (American Standard Code for Information Interchange), which was first developed to represent
          text as numbers for electronic communication.
        </p>

        <figure class="blog-article__figure mt-6 mb-6">
          <CharacterTokenization text="I love chocolate cookies at work." />
          <figcaption class="blog-article__caption text-xs leading-relaxed mt-2" style="color: var(--text-tertiary)">
            Character-level tokenization: each character becomes its own token. While maximally flexible,
            this results in very long sequences. Here, 25 characters produce 25 tokens.
          </figcaption>
        </figure>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          This approach has one genuine advantage: a small vocabulary reduces computation. In the final
          step of next-token prediction, the model computes a score (also called a <em>logit</em>) for
          every token in the vocabulary. It then applies a <em>softmax</em>, a function that converts these
          arbitrary scores into a probability distribution, assigning higher probability to higher-scoring
          tokens. Both the logit computation and the softmax scale with vocabulary size. Keeping the
          vocabulary small saves real computation in these steps.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The problem is severe token inflation: one token per character. Because LLMs are autoregressive,
          every token requires its own full forward pass through the model. The same amount of computation
          is expended regardless of whether the generated token represents a single letter or an entire
          word. Generating a six-character word would therefore require six forward passes instead of one,
          making this approach prohibitively expensive at scale.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          There is also the problem of context size. LLMs are limited in how many tokens they can attend to
          at once. With character-level tokens, the same amount of text consumes far more of that context
          budget, leaving less room for longer inputs or richer reasoning.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          An even more fundamental issue is that this approach conflicts with the goal of tokenization: to
          produce units that carry semantic meaning, rich enough that the model can build useful
          representations around them. Single characters largely fail this test. The letter
          <code class="blog-article__code">o</code> appears in <code class="blog-article__code">chocolate</code>
          and in <code class="blog-article__code">work</code>, but the two words have less in common than I
          would like them to. Without the surrounding characters, there is almost nothing for the model to
          deduce meaningful representations from.
        </p>
      </section>

      <!-- Using All Possible Word Tokens -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Using One Token for Every Single Word Imaginable
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          At the other extreme: why not generate all possible tokens by enumerating every character
          combination up to a certain length from a base alphabet, effectively covering every word that
          could ever be written?
        </p>

        <figure class="blog-article__figure mt-6 mb-6">
          <CharacterCombinations
            alphabet="abcdefghijklmnopqrstuvwxyz"
            :rows="4"
          />
          <figcaption class="blog-article__caption text-xs leading-relaxed mt-2" style="color: var(--text-tertiary)">
            All possible tokens from character combinations of lengths 1–4. Even with just 26 letters, the
            vocabulary grows exponentially: 26 + 676 + 17,576 + 456,976 = 475,254 entries.
          </figcaption>
        </figure>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The problem is that this vocabulary explodes exponentially. Using only the 26 lowercase letters
          of the Roman alphabet, all character combinations of up to five characters already yield over
          12.3 million distinct tokens. That's roughly 100 times the vocabulary sizes used in modern LLMs,
          and that is before adding uppercase letters, digits, punctuation, any other language or longer
          words.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Beyond the sheer size, the vast majority of these tokens would carry no semantic meaning. The
          sequence <code class="blog-article__code">zxqbw</code> is a valid combination, but there is
          nothing for a model to learn from it. A vocabulary saturated with meaningless entries is not just
          wasteful; it actively crowds out the useful representations the model needs to build.
        </p>
      </section>

      <!-- Using One Token Per Word -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Using One Token for Every Single Word
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The next idea is more intuitive: take the training corpus, extract every distinct word, and
          assign each one a unique token. This is the underlying idea behind many classical NLP systems:
          Bag of Words models, TF-IDF, Word2Vec and GloVe embeddings. Early neural language models all
          worked roughly along these lines.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The
          <a
            href="https://en.wikipedia.org/wiki/List_of_dictionaries_by_number_of_words"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >Oxford English Dictionary lists approximately 171,476 words currently in use</a>.
          In theory, this sounds manageable. In practice, the real number is far larger. Add inflected word
          forms (<code class="blog-article__code">play</code>,
          <code class="blog-article__code">plays</code>,
          <code class="blog-article__code">playing</code>,
          <code class="blog-article__code">played</code>), neologisms, compound words, domain-specific
          terminology, other natural languages, and programming languages, and the vocabulary quickly
          becomes enormous.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Three distinct problems follow.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          <strong>Size and memory.</strong> During training, for every token in the vocabulary the model
          learns a high dimensional vector capturing the semantic meaning of the token. If the vocabulary
          grows into the millions, the model's embedding and output projection matrices (which convert
          between token IDs and embedding vectors) becomes enormous.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          <strong>Rare words.</strong> Including every word from a training corpus means including many
          that appear only a handful of times. The model sees too few examples of these tokens to learn
          meaningful representations for them. Their embeddings remain undertrained and noisy, contributing
          little to the model's capabilities, or even resulting in hallucinations, gibberish. For a deep
          dive on that, read upon the
          <a
            href="https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >SolidGoldMagikarp token</a>.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          <strong>Out-of-vocabulary words.</strong> Any word not seen during training has no token. Be it a
          simple typo or a woman descending from the sky trying to type
          <code class="blog-article__code">supercalifragilisticexpialidocious</code> — tokenization simply
          breaks for inputs the model was never trained to handle.
        </p>
      </section>

      <!-- Subword Tokenization -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          The Result: Subword Tokenization
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The approach that modern tokenizers converge on is subword tokenization: splitting text into
          words and subword units that are large enough to carry semantic meaning, while keeping the
          vocabulary to a manageable size.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          The intuition is clean. If you know what a <code class="blog-article__code">book</code> is, and
          you know what a <code class="blog-article__code">store</code> is, then you already know what a
          <code class="blog-article__code">bookstore</code> is, even if you have never encountered the
          compound before. Subword units allow the model to compose meaning from parts, generalizing to
          new combinations of familiar pieces.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          To ensure that tokenization never completely breaks (even on novel words, typos, or new emojis)
          modern tokenizers include all individual bytes in the vocabulary as a fallback. This guarantees
          that any input string can always be tokenized, regardless of what it contains.
        </p>

        <div class="blog-article__codeblock mt-4 mb-4" style="display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.95rem;">
          <span style="font-size: 1.3rem; line-height: 1.5; flex-shrink: 0;">ℹ️</span>
          <div style="color: var(--text-secondary); line-height: 1.7;">
            <strong>Try it yourself:</strong> You can experiment with
            <a
              href="https://platform.openai.com/tokenizer"
              target="_blank"
              rel="noopener"
              class="blog-article__link"
            >OpenAI's Online Tokenizer</a>.
            Try long technical terms from your field, deliberate typos, compound words, capitalization or
            even emojis. Notice how familiar chunks reappear across words. That repetition is not
            accidental, but what makes subword tokenization powerful.
          </div>
        </div>
      </section>

      <!-- Why Spaces Are Folded Into Tokens -->
      <section class="blog-article__section mb-8">
        <h3 class="blog-article__h3 text-base font-semibold mb-3" style="color: var(--text-primary)">
          Extra: Why Spaces Are Folded Into Tokens
        </h3>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          When exploring the vocabularies of different LLMs, you will notice something: rather than a
          single space token, there are many tokens that come in both a space-prefixed and a non-space-prefixed
          form. The word <code class="blog-article__code">man</code> and
          <code class="blog-article__code">▁man</code> (with a leading space) are two distinct vocabulary
          entries with distinct token IDs.
        </p>

        <figure class="blog-article__figure mt-6 mb-6">
          <VocabularySpaces
            :tokens="['A', ' man', ' walked', ' past', ' a', ' snow', 'man']"
            :highlight="['man', ' man']"
          />
          <figcaption class="blog-article__caption text-xs leading-relaxed mt-2" style="color: var(--text-tertiary)">
            Leading spaces are part of the token.
            <span class="token small"> man</span> and
            <span class="token small">man</span> are two distinct vocabulary entries with different token IDs.
            The tokenizer encodes the boundary between words directly into the token itself.
          </figcaption>
        </figure>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          The reasoning is practical. A standalone space character carries almost no semantic meaning on its
          own, but naively including it as a separate token would roughly double the token count for most
          natural text, slowing down inference and cluttering up the context window that is fixed to a
          certain token count. Instead, the space is absorbed into a new token:
          <code class="blog-article__code">▁man</code> encodes both the word boundary and the word itself
          in a single unit, as a separate token.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          There is also a structural consequence for vocabulary construction: merging rules in most
          LLM-oriented implementations explicitly prohibit merges that result in tokens containing spaces
          at the end or in the middle of a word. This keeps word boundaries legible in the vocabulary
          structure and prevents semantically incoherent merges that would blur where one word ends and
          another begins.
        </p>
      </section>

      <!-- The Core Tradeoff -->
      <section class="blog-article__section mb-8">
        <h2 class="blog-article__h2 text-lg font-semibold mb-4" style="color: var(--text-primary)">
          The Core Tradeoff
        </h2>

        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Tokenization sits at the intersection of three competing pressures:
        </p>

        <ul class="blog-article__list text-sm leading-relaxed mt-3 space-y-2" style="color: var(--text-secondary)">
          <li>
            <strong>Vocabulary size</strong> — Larger vocabularies increase memory and output-layer
            computation.
          </li>
          <li>
            <strong>Sequence length</strong> — Smaller tokens increase the number of forward passes and
            consume context window capacity.
          </li>
          <li>
            <strong>Semantic coherence</strong> — Tokens should carry enough meaning to support useful
            internal representations.
          </li>
        </ul>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          Character-level tokenization minimizes vocabulary size but explodes sequence length.<br>
          Word-level tokenization minimizes sequence length but explodes vocabulary size and breaks on
          new words.<br>
          Subword tokenization balances both while preserving compositional meaning.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          While we have now deduced the logic behind subword tokenization, vocabularies are not handpicked
          (that would be way too much work). Instead, good subwords emerge from an algorithmic process
          based on the frequencies in the training data.
        </p>

        <p class="blog-article__paragraph text-sm leading-relaxed mt-4" style="color: var(--text-secondary)">
          In the next post, we will look at how modern tokenizers actually <em>learn</em> these subword
          units and why the specific algorithms used today are surprisingly elegant.
        </p>
      </section>

      <!-- ============================================= -->
      <!-- POST 2: BPE Explained                         -->
      <!-- ============================================= -->

      <hr style="border: none; border-top: 1px solid var(--border-primary); margin: 3rem 0;">

      <!-- Title -->
      <header class="blog-article__header mb-8">
        <h1 class="blog-article__title font-bold leading-tight" style="color: var(--text-primary); font-size:1.8rem;">
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
