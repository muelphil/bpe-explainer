<template>
  <article class="blog-article h-full overflow-y-auto">
    <div class="blog-article__content px-6 py-6">
      <h1 class="blog-article__title text-2xl font-bold mb-2" style="color: var(--text-primary)">
        Understanding Byte Pair Encoding
      </h1>
      <p class="blog-article__meta text-sm mb-6" style="color: var(--text-tertiary)">
        An interactive guide to tokenization in modern language models
      </p>

      <section class="blog-article__section mb-6">
        <h2 class="blog-article__heading text-lg font-semibold mb-3" style="color: var(--text-primary)">
          What is Tokenization?
        </h2>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
          mollit anim id est laborum.
        </p>
      </section>

      <section class="blog-article__section mb-6">
        <h2 class="blog-article__heading text-lg font-semibold mb-3" style="color: var(--text-primary)">
          The BPE Algorithm
        </h2>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
          Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero
          sit amet quam egestas semper. Aenean ultricies mi vitae est.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum
          erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget
          tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus
          faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat.
        </p>
      </section>

      <section class="blog-article__section mb-6">
        <h2 class="blog-article__heading text-lg font-semibold mb-3" style="color: var(--text-primary)">
          Vocabulary Growth
        </h2>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Nam dui ligula, fringilla a, euismod sodales, sollicitudin vel, wisi. Morbi auctor lorem non
          justo. Nam lacus libero, pretium at, lobortis vitae, ornare vel, eros. Ut tempus purus at lorem.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor,
          sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in
          faucibus orci luctus et ultrices posuere cubilia curae.
        </p>
      </section>

      <section class="blog-article__section mb-6">
        <h2 class="blog-article__heading text-lg font-semibold mb-3" style="color: var(--text-primary)">
          Compression and Efficiency
        </h2>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel,
          egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Curabitur sit amet mauris. Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer
          lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi.
          Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Proin sodales libero in arcu convallis tincidunt. Phasellus nec felis eu ante vehicula gravida.
          In accumsan justo vel metus tempus viverra. Aliquam erat volutpat. Nunc eleifend leo vitae
          magna vehicula, et vehicula purus ornare.
        </p>
      </section>

      <section class="blog-article__section mb-6">
        <h2 class="blog-article__heading text-lg font-semibold mb-3" style="color: var(--text-primary)">
          Real-World Applications
        </h2>
        <p class="blog-article__paragraph text-sm leading-relaxed mb-3" style="color: var(--text-secondary)">
          Fusce fermentum. Nullam varius nulla at tellus. Sed sollicitudin lectus at mi. Praesent blandit
          laoreet nibh. Fusce convallis metus id felis luctus adipiscing. Pellentesque egestas neque sit
          amet convallis ullamcorper posuere nisl lorem.
        </p>
        <p class="blog-article__paragraph text-sm leading-relaxed" style="color: var(--text-secondary)">
          Aenean lacinia bibendum nulla sed consectetur. Donec sed odio dui. Cras mattis consectetur
          purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Nullam
          quis risus eget urna mollis ornare vel eu leo.
        </p>
      </section>
    </div>
  </article>
</template>

<style scoped>
.blog-article {
  background: var(--bg-primary);
}
</style>
