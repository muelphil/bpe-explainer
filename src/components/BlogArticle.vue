<script setup lang="ts">
import AutoregressiveLLM from './tokenization/AutoregressiveLLM.vue'
import CharacterTokenization from './tokenization/CharacterTokenization.vue'
import CharacterCombinations from './tokenization/CharacterCombinations.vue'
import SubwordExample from './tokenization/SubwordExample.vue'
import Callout from './Callout.vue'
import StepList from './StepList.vue'
import type { StepItem } from './StepList.vue'
import {Play, SkipForward} from "lucide-vue-next";

const tokenizerSteps: StepItem[] = [
  {
    title: 'Split into base units.',
    description: 'For byte-level BPE, this means converting the input to its UTF-8 byte sequence and treating each byte as an individual token. For character-level variants, the input is split into Unicode characters.'
  },
  {
    title: 'Apply merges greedily in learned order.',
    description: 'Starting from the first merge rule, the tokenizer scans the token sequence and replaces all occurrences of the learned pair with the merged token. Then it moves to the second merge rule, and so on.'
  },
  {
    title: 'Stop when no more merges apply.',
    description: 'Once the tokenizer has exhausted the merge list or no remaining adjacent pairs match any rule, the current token sequence is the final tokenization.'
  }
]

const bpeTrainingSteps: StepItem[] = [
  {
    title: 'Initialize the vocabulary.',
    description: 'The training data is split into base units, in case of Compression BPE the individual characters present in the trianing data, which form the starting vocabulary.'
  },
  {
    title: 'Select and merge the most frequent pair.',
    description: 'The algorithm finds the most frequently occurring pair of adjacent tokens. You can see and highlight these pairs in the <strong>Frequency of Pairs</strong> panel. The selected pair is merged into a new token, which gets added to the vocabulary tracked in the <strong>Vocabulary</strong> panel. All occurrences of the pair in the text are replaced.'
  },
  {
    title: 'Repeat until the stop condition is reached.',
    description: 'The algorithm continues until no pair of tokens appears more than once in the text (the natural break condition of the compression use case), or until a target compression rate is reached. Each step is logged chronologically in the <strong>Steps</strong> panel.'
  }
]
</script>

<template>
  <!-- Main blog article container -->
  <article class="blog-article h-full overflow-y-auto">
    <div class="blog-article__inner px-6 py-6">

      <!-- ============================================= -->
      <!-- PART 1: From Text to Tokens                   -->
      <!-- ============================================= -->

      <!-- Title -->
      <header class="blog-article__header">
        <h1 class="blog-article__title">
          From Text to Tokens: An Interactive Introduction to LLM Tokenization and Byte-Pair
          Encoding
        </h1>
        <p class="blog-article__subtitle">
          Before a large language model can generate a single word, it needs to convert raw text
          into tokens.
          This article works through the design space of tokenization vocabularies — from
          character-level
          extremes to word-level pitfalls — before diving into Byte-Pair Encoding: the compression
          algorithm
          repurposed to build the tokenizers that power modern LLMs. An interactive visualization
          embedded
          alongside this article lets you explore the algorithm hands-on as you read.
        </p>
        <p class="blog-article__meta">
          Philip Müller &middot; 2026
        </p>
      </header>

      <!-- Introduction -->
      <section>
        <p>
          Understanding how large language models work is crucial for both effective use and
          research.
          This article covers the very first step in the processing chain of an LLM: tokenization —
          from the design space of vocabularies to the algorithm that builds them. The interactive
          visualizer alongside this article lets you explore that algorithm hands-on as you read.
        </p>
      </section>

      <!-- What Are Transformers, Really? -->
      <section>
        <h2>
          What Are Transformers, Really?
        </h2>

        <p>
          Transformers are named for the architecture's mechanism of transforming sequence
          representations via
          self-attention and feed-forward layers, replacing recurrence and convolution. While
          originally
          designed to translate text in one language into another, they were quickly adapted to
          solve all
          kinds of transformations: text to image, image to text, speech to text. What makes this
          architecture so general is how it splits up input data into processable chunks that can
          carry
          semantic meaning. Depending on the use case, these chunks might be pixel patches, segments
          of a
          sound wave, or — in the case of text — words, subwords, or even single characters.
        </p>

        <p>
          Large language models are built on this same architecture. Fundamentally, they are
          <em>next-token predictors</em>: given a sequence of tokens, the model predicts the most
          likely
          next token based on context and learned internal representations, one after another.
        </p>

        <figure>
          <AutoregressiveLLM
            :start-tokens="['Paris', 'is', 'the']"
            :inferred-tokens="[' city', 'of', 'light', '.', '&lt;endoftext&gt;']"
            :speed="1"
          />
          <figcaption>
            Autoregressive inference: the model processes a sequence of tokens and predicts the next
            token
            at each step. After each prediction, the newly generated token is appended to the
            sequence and
            fed back into the model as part of the context for the next forward pass. The
            visualization
            shows both the textual tokens and their corresponding integer token IDs (bottom right).
          </figcaption>
        </figure>

        <p>
          The first step on this journey is tokenization: splitting raw text into the chunks that
          can be
          fed to the LLM. This article builds intuition for the tradeoffs of different vocabulary
          structures
          and sizes from first principles, and then walks through the algorithm that most modern
          tokenizers
          use to learn their vocabulary: Byte-Pair Encoding.
        </p>
      </section>

      <!-- Understanding the Sizes of Vocabularies -->
      <section>
        <h2>
          <!-- Here, add a graphic with the sentence “Tokenization divides text into smaller meaningful units — typically words or subwords.” -->
          Understanding the Sizes of Vocabularies
        </h2>

        <p>
          Before diving into the tradeoffs, it helps to establish some shared vocabulary (no pun
          intended):
        </p>

        <div>
          <SubwordExample/>
        </div>

        <p>
          <strong>Tokens</strong> are the discrete units a language model processes and predicts. In
          text
          models, a token might be a single character, part of a word, or an entire word, depending
          on
          how the tokenizer splits the input.
        </p>

        <p>
          <strong>Subwords</strong> are common fragments of words learned from patterns in the
          training
          data, many of them aligning with meaningful parts like prefixes or suffixes. For example,
          <code class="blog-article__code">ability</code> is a subword that may be used in the
          construction
          of <code class="blog-article__code">applicability</code> and
          <code class="blog-article__code">generalizability</code>.
        </p>

        <p>
          <strong>Token IDs</strong> are the unique numerical identifiers for each token in the
          vocabulary.
          After tokenization, the model works with these IDs, which identify the token regardless of
          whether it represents a character, subword, or whole word.
        </p>

        <p>
          <strong>Vocabulary</strong> is the complete set of tokens a model knows.
        </p>

        <p>
          <strong>Tokenizer</strong> is the component — and the algorithm driving it — responsible
          for
          splitting raw text into tokens and defining the vocabulary. The tokenizer is trained
          independently,
          before language model training begins, and the resulting merge rules and vocabulary are
          then
          fixed for the lifetime of the model.
        </p>

        <p>
          The goal of tokenization is to produce discrete units that carry semantic meaning. Later,
          these
          meanings are captured by learned vectors of fixed size, called embeddings. After
          tokenization and
          embedding, most of the computation an LLM performs to predict the next token operates on
          these
          embeddings.
        </p>

        <p>
          Modern models use vocabularies ranging from tens of
          thousands of tokens to several hundred thousand in multilingual settings. As an example,
          <a
            href="https://ai.meta.com/blog/meta-llama-3/"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >Llama-3.1-70B supports 7 languages and has a vocabulary size of 128,000</a>.
          Deciding which tokens go into the vocabulary (and how many) is far from trivial.
        </p>

        <p>
          As a software engineer, I like to evaluate edge cases to get a full picture of the
          tradeoffs at
          play. Working through the extremes is what really helped me understand why researchers
          chose the
          tokenization algorithms and vocabulary sizes most common in modern LLMs. So let's start
          there.
        </p>
      </section>

      <!-- Using Characters -->
      <section>
        <h3>
          Using Characters (and Only Characters) as Tokens
        </h3>

        <p>
          A simple edge case would be to use the alphabet as a vocabulary; essentially the same idea
          as
          ASCII (American Standard Code for Information Interchange), which was first developed to
          represent
          text as numbers for electronic communication.
        </p>

        <figure>
          <CharacterTokenization text="I love chocolate cookies at work."/>
          <figcaption>
            Character-level tokenization: each character becomes its own token. While maximally
            flexible,
            this results in very long sequences. Here, 25 characters produce 25 tokens.
          </figcaption>
        </figure>

        <p>
          This approach has one genuine advantage: a small vocabulary reduces computation. In the
          final
          step of next-token prediction, the model computes a score (also called a <em>logit</em>)
          for
          every token in the vocabulary. It then applies a <em>softmax</em>, a function that
          converts these
          arbitrary scores into a probability distribution, assigning higher probability to
          higher-scoring
          tokens. Both the logit computation and the softmax scale with vocabulary size. Keeping the
          vocabulary small saves real computation in these steps.
        </p>

        <p>
          The problem is severe token inflation: one token per character. Because LLMs are
          autoregressive,
          every token requires its own full forward pass through the model. The same amount of
          computation
          is expended regardless of whether the generated token represents a single letter or an
          entire
          word. Generating a six-character word would therefore require six forward passes instead
          of one,
          making this approach prohibitively expensive at scale.
        </p>

        <p>
          There is also the problem of context size. LLMs are limited in how many tokens they can
          attend to
          at once. With character-level tokens, the same amount of text consumes far more of that
          context
          budget, leaving less room for longer inputs or richer reasoning.
        </p>

        <p>
          An even more fundamental issue is that this approach conflicts with the goal of
          tokenization: to
          produce units that carry semantic meaning, rich enough that the model can build useful
          representations around them. Single characters largely fail this test. The letter
          <code class="blog-article__code">o</code> appears in <code class="blog-article__code">chocolate</code>
          and in <code class="blog-article__code">work</code>, but the two words have less in common
          than I
          would like them to. Without the surrounding characters, there is almost nothing for the
          model to
          deduce meaningful representations from.
        </p>
      </section>

      <!-- Using All Possible Word Tokens -->
      <section>
        <h3>
          Using One Token for Every Single Word Imaginable
        </h3>

        <p>
          At the other extreme: why not generate all possible tokens by enumerating every character
          combination up to a certain length from a base alphabet, effectively covering every word
          that
          could ever be written?
        </p>

        <figure>
          <CharacterCombinations
            alphabet="abcdefghijklmnopqrstuvwxyz"
            :rows="4"
          />
          <figcaption>
            All possible tokens from character combinations of lengths 1–4. Even with just 26
            letters, the
            vocabulary grows exponentially: 26 + 676 + 17,576 + 456,976 = 475,254 entries.
          </figcaption>
        </figure>

        <p>
          The problem is that this vocabulary explodes exponentially. Using only the 26 lowercase
          letters
          of the Roman alphabet, all character combinations of up to five characters already yield
          over
          12.3 million distinct tokens. That's roughly 100 times the vocabulary sizes used in modern
          LLMs,
          and that is before adding uppercase letters, digits, punctuation, any other language or
          longer
          words.
        </p>

        <p>
          Beyond the sheer size, the vast majority of these tokens would carry no semantic meaning.
          The
          sequence <code class="blog-article__code">zxqbw</code> is a valid combination, but there
          is
          nothing for a model to learn from it. A vocabulary saturated with meaningless entries is
          not just
          wasteful; it actively crowds out the useful representations the model needs to build.
        </p>
      </section>

      <!-- Using One Token Per Word -->
      <section>
        <h3>
          Using One Token for Every Single Word
        </h3>

        <p>
          The next idea is more intuitive: take the training corpus, extract every distinct word,
          and
          assign each one a unique token. This is the underlying idea behind many classical NLP
          systems:
          Bag of Words models, TF-IDF, Word2Vec and GloVe embeddings. Early neural language models
          all
          worked roughly along these lines.
        </p>

        <p>
          The
          <a
            href="https://en.wikipedia.org/wiki/List_of_dictionaries_by_number_of_words"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >Oxford English Dictionary lists approximately 171,476 words currently in use</a>.
          In theory, this sounds manageable. In practice, the real number is far larger. Add
          inflected word
          forms (<code class="blog-article__code">play</code>,
          <code class="blog-article__code">plays</code>,
          <code class="blog-article__code">playing</code>,
          <code class="blog-article__code">played</code>), neologisms, compound words,
          domain-specific
          terminology, other natural languages, and programming languages, and the vocabulary
          quickly
          becomes enormous.
        </p>

        <p>
          Three distinct problems follow.
        </p>

        <p>
          <strong>Size and memory.</strong> During training, for every token in the vocabulary the
          model
          learns a high dimensional vector capturing the semantic meaning of the token. If the
          vocabulary
          grows into the millions, the model's embedding and output projection matrices (which
          convert
          between token IDs and embedding vectors) becomes enormous.
        </p>

        <p>
          <strong>Rare words.</strong> Including every word from a training corpus means including
          many
          that appear only a handful of times. The model sees too few examples of these tokens to
          learn
          meaningful representations for them. Their embeddings remain undertrained and noisy,
          contributing
          little to the model's capabilities, or even resulting in hallucinations, gibberish. For a
          deep
          dive on that, read upon the
          <a
            href="https://www.lesswrong.com/posts/aPeJE8bSo6rAFoLqg/solidgoldmagikarp-plus-prompt-generation"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >SolidGoldMagikarp token</a>.
        </p>

        <p>
          <strong>Out-of-vocabulary words.</strong> Any word not seen during training has no token.
          Be it a
          simple typo or a woman descending from the sky trying to type
          <code class="blog-article__code">supercalifragilisticexpialidocious</code> — tokenization
          simply
          breaks for inputs the model was never trained to handle.
        </p>
      </section>

      <!-- Subword Tokenization -->
      <section>
        <h3>
          The Result: Subword Tokenization
        </h3>

        <p>
          The approach that modern tokenizers converge on is subword tokenization: splitting text
          into
          words and subword units that are large enough to carry semantic meaning, while keeping the
          vocabulary to a manageable size.
        </p>

        <p>
          The intuition is clean. If you know what a <code class="blog-article__code">book</code>
          is, and
          you know what a <code class="blog-article__code">store</code> is, then you already know
          what a
          <code class="blog-article__code">bookstore</code> is, even if you have never encountered
          the
          compound before. Subword units allow the model to compose meaning from parts, generalizing
          to
          new combinations of familiar pieces.
        </p>

        <Callout icon="task" title="Try it yourself">
          You can experiment with
          <a
            href="https://platform.openai.com/tokenizer"
            target="_blank"
            rel="noopener"
            class="blog-article__link"
          >OpenAI's Online Tokenizer</a>.
          Try long technical terms from your field, deliberate typos, compound words, capitalization
          or
          even emojis. Notice how familiar chunks reappear across words. That repetition is not
          accidental, but what makes subword tokenization powerful.
        </Callout>
      </section>

      <!-- Why Spaces Are Folded Into Tokens -- moved to Adapting BPE section -->

      <!-- The Core Tradeoff -->
      <section>
        <h2>
          The Core Tradeoff
        </h2>

        <p>
          Tokenization sits at the intersection of three competing pressures:
        </p>

        <ul>
          <li>
            <strong>Vocabulary size</strong> — Larger vocabularies increase memory and output-layer
            computation.
          </li>
          <li>
            <strong>Sequence length</strong> — Smaller tokens increase the number of forward passes
            and
            consume context window capacity.
          </li>
          <li>
            <strong>Semantic coherence</strong> — Tokens should carry enough meaning to support
            useful
            internal representations.
          </li>
        </ul>

        <p>
          Character-level tokenization minimizes vocabulary size but explodes sequence length.
          Word-level tokenization minimizes sequence length but explodes vocabulary size and breaks
          on
          new words.
          Subword tokenization balances both while preserving compositional meaning.
        </p>

        <p>
          While we have now deduced the logic behind subword tokenization, vocabularies are not
          handpicked
          (that would be way too much work). Instead, good subwords emerge from an algorithmic
          process
          based on the frequencies in the training data. The following sections walk through that
          process
          in detail — starting with the original compression algorithm, then tracing how it was
          adapted
          for language model training.
        </p>
      </section>

      <!-- ============================================= -->
      <!-- BPE: The Algorithm                            -->
      <!-- ============================================= -->

      <!-- Exploring BPE Through Visualization -->
      <section>
        <h2>
          Exploring BPE Through Visualization
        </h2>

        <p>
          The algorithm most modern tokenizers use to learn their vocabulary is called
          <strong>Byte-Pair Encoding</strong> (BPE), a compression algorithm from 1994 that was
          later repurposed for language model training. To the right of this article sits an
          interactive
          visualization of the BPE training process, built to let you explore each step of the
          algorithm
          as you read — stepping through manually, playing automatically, or jumping to any point in
          training. Among the several tokenizer algorithms that exist, BPE-based tokenizers are the
          most
          common in modern LLMs today.
        </p>

        <p>
          Before diving into the algorithm, it helps to understand how tokens appear visually in the
          application. The main panel displays the training corpus as a sequence of colored token
          blocks. Initially, the corpus is broken into individual bytes — each character in the text
          starts as its own token. As training progresses, adjacent tokens merge and grow,
          reflecting
          the decisions the algorithm has made so far. Each token is color-coded consistently: the
          same token always receives the same color, making it easy to track how individual tokens
          accumulate across the text.
        </p>

        <Callout icon="info" title="Space representation">
          Both in this article and in the application, spaces are represented by a special visible
          character to make word boundaries explicit. In this article, we are using the <a
          href="https://www.compart.com/en/unicode/U+2581">Lower One Eighth Block</a> <code
          class="blog-article__code">▁</code>. For
          example, <code class="blog-article__code">▁man</code> encodes both the leading space and
          the word itself as a single token. This convention is common in real tokenizers and
          ensures that merge rules can be applied without ambiguity.
        </Callout>
      </section>

      <!-- The Original Byte-Pair Encoding -->
      <section>
        <h2>
          The Original Byte-Pair Encoding
        </h2>

        <p>
          BPE was first described in 1994 by Philip Gage, not as a tokenization strategy, but as a
          method for <strong>compressing bytes</strong>. The goal was to optimize the byte-level
          storage
          size of text by replacing frequently recurring byte combinations with shorter
          representations,
          building a translation table in the process.
        </p>

        <StepList :steps="bpeTrainingSteps" />

        <Callout icon="task" title="Try it yourself">

          In the visualizer on the right, open the settings menu (upper-right corner), select
          <em>Compression BPE</em>, and save your changes.<br>

          Hover over the most frequent pair in the <strong>Frequency of Pairs</strong> panel to
          highlight
          all of its occurrences in the training data.<br>

          Click
          <SkipForward style="display: inline;" :size="18"/>
          to step through the algorithm one merge at a time and observe how the vocabulary
          evolves.<br>

          Alternatively, press
          <Play :size="18" style="display: inline;"/>
          <strong>Play</strong>
          in the Control Panel to run the algorithm automatically until the stopping condition is
          reached.
          As training progresses, watch the tokens in the main panel grow through successive merges.<br>

          Once training has converged, inspect the resulting <strong>compression rate</strong> in
          the
          <strong>Steps</strong> panel and the final <strong>vocabulary size</strong> in the
          <strong>Vocabulary</strong> panel.<br>

          <span class="note">
          Note: The stopping condition (e.g., target compression rate) can be adjusted in the settings.
          </span>
        </Callout>

        <p>
          The algorithm continues until no pair of tokens appears more than once in the text (the
          natural break condition of the compression use case), or until a target compression rate
          is
          reached. The result is a tokenizer defined by an ordered list of merge rules, alongside
          the
          original sequence compressed into a sequence of token IDs. To reconstruct the original
          text,
          the receiver needs the tokenizer's merge table once, then the token IDs.
        </p>

        <Callout icon="task" title="Try it yourself">
          Once training has converged, navigate to the
          <strong>Validation</strong> view using the tab in the top-right corner of the visualizer.
          Enter some text to see how it is tokenized, e.g. <em>The quick brown fox jumped over the
          fence</em>. What do you
          notice?
          Some characters may have no corresponding token in the vocabulary, causing tokenization to
          fail for those parts of the input. This is a fundamental limitation of the original
          compression use case and the motivation for the adaptations described below.
        </Callout>

        <p>
          It is a simple and elegant algorithm, and that simplicity turns out to be one of the main
          reasons it has held up so well.
        </p>
      </section>

      <!-- Adapting BPE for LLM Tokenization -->
      <section>
        <h2>
          Adapting BPE for LLM Tokenization
        </h2>

        <p>
          BPE was originally designed to minimize storage size. When Sennrich et al. (2016) proposed
          repurposing it for neural machine translation, the <strong>goal shifted</strong>: instead
          of
          compressing text as far as possible, the aim is to produce a fixed-size vocabulary that
          efficiently represents the language. The model needs enough tokens to understand and
          generate
          text fluently, but not so many that memory and computation become unmanageable.
        </p>

        <p>
          The algorithm is largely the same, but a few key adjustments make it work well for this
          new
          purpose:
        </p>


        <p>
          <strong>Stop condition.</strong> Instead of merging until no pair occurs more than once,
          training stops once the vocabulary reaches a <strong>target size</strong>. This is the
          primary design knob: a larger vocabulary means fewer tokens per sequence, but more memory
          and output-layer computation.
        </p>
        <p>
          <strong>Base units.</strong> Depending on the tokenizer variant, training starts from
          <strong>bytes or characters</strong>. This choice has significant downstream consequences
          for vocabulary coverage and readability, as we will see in the variants below.
        </p>
        <p>
          <strong>Whitespace and control symbols.</strong> Spaces, newlines, and non-printable
          characters need special handling so that merge rules remain unambiguous. Rather than
          treating
          spaces as separate tokens, most LLM tokenizers fold the leading space directly into the
          following word: <code class="blog-article__code">▁man</code> encodes both the word
          boundary
          and the word itself in a single token. A standalone space carries almost no semantic
          meaning
          and would roughly double the token count for most text if treated separately. Beyond
          efficiency, this folding has a structural consequence: LLM-oriented BPE implementations
          explicitly restrict merges that would produce tokens with spaces in the middle or at the
          end
          of a word, keeping word boundaries legible in the vocabulary structure.
        </p>
        <p>
          <strong>Special tokens.</strong> Special control tokens representing end-of-text markers,
          user and system message delimiters and tool call boundaries are added <strong>after
          training</strong> is complete. They are not part of the learned merge list and therefore
          can never be produced by tokenizing ordinary user input — an important security and
          correctness property.
        </p>

        <p>
          Despite these adjustments, the core BPE behavior carries over directly. Merges are applied
          greedily in the order they were learned. Common sequences tend to become single tokens,
          and
          rare sequences are split into smaller, more frequent subwords. The frequency-aware
          compression
          that made the original algorithm effective is exactly what makes it useful for language
          model
          tokenization: the vocabulary naturally mirrors the statistics of the training corpus.
        </p>
      </section>

      <!-- Byte-Level BPE (GPT-2) -->
      <section>
        <h3>
          Byte-Level BPE (GPT-2)
        </h3>

        <p>
          The variant introduced by Radford et al. (2019) for <strong>GPT-2</strong> takes
          byte-level
          BPE further by starting from all 256 possible byte values as the base alphabet. Before any
          merges are applied, the input text is converted to its UTF-8 byte representation.
        </p>

        <p>
          This has one crucial advantage: <strong>universal coverage</strong>. Any string — emojis,
          rare scripts, novel words, deliberate typos — can always be tokenized, because every
          possible
          input ultimately decomposes into bytes, all of which are in the vocabulary. There is no
          out-of-vocabulary problem.
        </p>

        <p>
          GPT-style byte-level BPE remains conceptually simple and scales cleanly to large corpora.
          It is the foundation of the tokenizers used in the GPT series and many models built on the
          same design.
        </p>
      </section>

      <!-- SentencePiece BPE (Meta, Mistral, Qwen) -->
      <section>
        <h3>
          SentencePiece BPE (Meta, Mistral, Qwen)
        </h3>

        <p>
          SentencePiece is a language-independent tokenization framework developed at Google in
          2018.
          It implements both BPE and Unigram Language Model under a single, unified training
          pipeline.
          SentencePiece BPE is used in models like Meta's LLaMA, Mistral, and Alibaba's Qwen, and
          starts from <strong>Unicode characters</strong> instead of bytes.
        </p>

        <p>
          Because Unicode characters are human-readable, the resulting vocabulary is much easier to
          inspect and reason about. SentencePiece BPE starts from the Unicode characters observed in
          the training data rather than from a fixed set of bytes. The trade-off is that vocabulary
          sizes tend to be somewhat larger than byte-level BPE for equivalent coverage, because
          individual Unicode code points form a less compact base alphabet than raw bytes. Unlike
          byte-level BPE, this also reintroduces the need to handle previously unseen characters at
          inference time. Traditional SentencePiece maps such characters to a special
          <code class="blog-article__code">&lt;unk&gt;</code> token, while many modern
          implementations use byte fallback, decomposing unseen
          characters into their UTF-8 bytes so that any input can still be represented exactly.
        </p>

        <p>
          SentencePiece BPE trades off <strong>absolute universality</strong> for readability and a
          slightly more natural alignment with how words appear in human languages. For multilingual
          models especially, starting from characters rather than bytes can produce more
          interpretable
          merges.
        </p>
      </section>

      <!-- How Tokenizers Split Text After Training -->
      <section>
        <h2>
          How Tokenizers Split Text After Training
        </h2>

        <p>
          The output of the BPE training step is an ordered list of merge rules, which together
          define
          the vocabulary. When a tokenizer encounters a new string at inference time, such as a
          user's
          prompt, it does not run the training loop again. Instead, it applies the learned merges in
          a fast forward pass:
        </p>

        <StepList :steps="tokenizerSteps" />

        <p>
          The ordering of merge rules matters. A pair that was merged earlier in training due to
          higher
          frequency gets priority over pairs merged later. This is what gives BPE its greedy,
          frequency-aware character: common sequences collapse into single tokens early, while rare
          or
          novel sequences remain split into their more primitive constituents.
        </p>
      </section>

      <!-- Alternative Approaches -->
      <section>
        <h2>
          Alternative Approaches
        </h2>

        <p>
          BPE is not the only subword tokenization algorithm, and it is worth briefly understanding
          the alternatives and why BPE has prevailed in practice.
        </p>

        <p>
          <strong>WordPiece</strong> (2016, Google) is also a merge-based subword tokenizer, but the
          criterion for choosing which pair to merge is different. Rather than always picking the
          most
          frequent pair, WordPiece selects merges that <strong>maximize the improvement to the
          corpus
          likelihood</strong> — a probabilistic objective. This tends to produce more linguistically
          meaningful merges, and its objective is conceptually aligned with how masked language
          models
          like BERT are trained. WordPiece is used in BERT and its derivatives.
        </p>

        <p>
          <strong>Unigram Language Model</strong> (2018) takes the opposite approach entirely.
          Rather
          than starting small and merging up, it starts with a large candidate vocabulary and
          <strong>prunes it down</strong> by iteratively removing tokens whose removal least
          degrades
          the corpus likelihood. The result is a probabilistic tokenizer with a unique property: the
          same word can legitimately be tokenized in multiple ways, each with a probability. This is
          useful for training with regularization, since the model sees the same word represented
          differently across training steps.
        </p>

        <p>
          BPE has prevailed in practice largely due to its <strong>simplicity and
          scalability</strong>.
          It is straightforward to implement, easy to parallelize, and fast on very large corpora.
          The
          quality differences between BPE, WordPiece, and Unigram LM are small at scale, so the
          practical advantages of BPE — speed, predictability, and a long track record — have made
          it
          the default choice for most modern LLM tokenizers.
        </p>
      </section>

      <!-- References -->
      <section>
        <h2>
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
