<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  sentence?: string
  rows?: string[][]
  annotationToken?: string
  annotationSubword?: string
  annotationTokenId?: string
}>(), {
  sentence: 'Tokenization divides text into smaller meaningful units — typically words or subwords.',
  rows: () => [
    ['Token', 'ization', '▁divides', '▁text', '▁into'],
    ['▁smaller', '▁meaningful', '▁units', ',', ],
    ['▁typically', '▁words', '▁or', '▁sub', 'words', '.']
  ],
  annotationToken: '▁into',
  annotationSubword: 'ization',
  annotationTokenId: '▁words',
})

function tokenId(s: string): number {
  if (s.length === 1) return s.charCodeAt(0)
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) & 0x7fff
  }
  return (Math.abs(h) % 49488) + 512
}

const annotationKeys = computed(() => {
  const findKey = (token: string): string | null => {
    for (const [rIdx, row] of props.rows.entries()) {
      const tIdx = row.indexOf(token)
      if (tIdx !== -1) return `${rIdx}-${tIdx}`
    }
    return null
  }
  return {
    token: findKey(props.annotationToken),
    subword: findKey(props.annotationSubword),
    tokenId: findKey(props.annotationTokenId),
  }
})
const annotationArea = ref<HTMLDivElement | null>(null)
const tokenRefs = ref<Map<string, HTMLDivElement>>(new Map())

function setTokenRef(el: unknown, rowIndex: number, tokenIndex: number): void {
  if (el instanceof HTMLDivElement) {
    tokenRefs.value.set(`${rowIndex}-${tokenIndex}`, el)
  }
}

const tokenAnnStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const subwordAnnStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const tokenIdAnnStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })

const svgScale = 0.4

function updateAnnotations(): void {
  if (!annotationArea.value) return
  const areaRect = annotationArea.value.getBoundingClientRect()

  // Token annotation (downward, tip at bottom-right of viewBox 0 0 159 150)
  const tokenKey = annotationKeys.value.token
  if (tokenKey) {
    const intoEl = tokenRefs.value.get(tokenKey)
    if (intoEl) {
      const intoRect = intoEl.getBoundingClientRect()
      const vbW = 159
      const vbH = 150
      const renderedW = vbW * svgScale
      const renderedH = vbH * svgScale
      const tipX = 147.075
      const tipY = 147.869

      const targetCX = intoRect.left + intoRect.width / 2 - areaRect.left
      const targetCY = intoRect.top - areaRect.top

      const svgLeft = targetCX - (tipX / vbW) * renderedW
      const svgTop = targetCY - (tipY / vbH) * renderedH

      tokenAnnStyle.value = {
        left: `${svgLeft}px`,
        top: `${svgTop}px`,
        width: `${renderedW}px`,
        height: `${renderedH}px`
      }
    }
  }

  // Subword annotation (downward, tip at bottom-left of viewBox 0 0 237 150)
  const subwordKey = annotationKeys.value.subword
  if (subwordKey) {
    const izationEl = tokenRefs.value.get(subwordKey)
    if (izationEl) {
      const izationRect = izationEl.getBoundingClientRect()
      const vbW = 237
      const vbH = 150
      const renderedW = vbW * svgScale
      const renderedH = vbH * svgScale
      const tipX = 13.664
      const tipY = 147.869

      const targetCX = izationRect.left + izationRect.width / 2 - areaRect.left
      const targetCY = izationRect.top - areaRect.top

      const svgLeft = targetCX - (tipX / vbW) * renderedW
      const svgTop = targetCY - (tipY / vbH) * renderedH

      subwordAnnStyle.value = {
        left: `${svgLeft}px`,
        top: `${svgTop}px`,
        width: `${renderedW}px`,
        height: `${renderedH}px`
      }
    }
  }

  // Token-ID annotation (upward, tip at top-left of viewBox 0 0 229 162)
  const tokenIdKey = annotationKeys.value.tokenId
  if (tokenIdKey) {
    const wordsEl = tokenRefs.value.get(tokenIdKey)
    if (wordsEl) {
      const tokenIdEl = wordsEl.querySelector('.token-id') as HTMLElement | null
      const el = tokenIdEl || wordsEl
      const elRect = el.getBoundingClientRect()
      const vbW = 229
      const vbH = 162
      const renderedW = vbW * svgScale
      const renderedH = vbH * svgScale
      const tipX = 16.955
      const tipY = 2.254

      const targetCX = elRect.left + elRect.width / 2 - areaRect.left
      const targetCY = elRect.bottom - areaRect.top

      const svgLeft = targetCX - (tipX / vbW) * renderedW
      const svgTop = targetCY - (tipY / vbH) * renderedH

      tokenIdAnnStyle.value = {
        left: `${svgLeft}px`,
        top: `${svgTop}px`,
        width: `${renderedW}px`,
        height: `${renderedH}px`
      }
    }
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  setTimeout(() => {
    updateAnnotations()
  }, 50)

  if (annotationArea.value) {
    resizeObserver = new ResizeObserver(updateAnnotations)
    resizeObserver.observe(annotationArea.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div class="subword-example-annotated">
    <div
      class="token-annotation-area"
      ref="annotationArea"
    >
      <div
        v-for="(row, rIdx) in rows"
        :key="rIdx"
        class="token-row"
      >
        <div
          v-for="(token, tIdx) in row"
          :key="`${rIdx}-${tIdx}`"
          class="token-wrapper"
          :ref="(el) => setTokenRef(el, rIdx, tIdx)"
        >
          <span class="token">
            {{ token }}
            <span class="token-id">{{ tokenId(token) }}</span>
          </span>
        </div>
      </div>

      <svg
        class="annotation"
        :style="tokenAnnStyle"
        viewBox="0 0 159 150"
        style="fill-rule:evenodd;clip-rule:evenodd"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xml:space="preserve"
      >
        <g>
          <g>
            <path d="M148.438,135.495c2.185,-2.481 5.676,-15.546 9.568,-11.354c1.377,1.484 1.338,2.068 -6.275,17.173c-1.166,2.314 -3.626,10.454 -8.866,4.3c-11.765,-13.819 -15.741,-15.386 -12.754,-18.002c3.383,-2.962 9.711,7.725 11.003,8.281c0.319,0.137 1.452,-0.494 1.532,-1.044c0.062,-0.422 -4.634,-19.519 -5.27,-21.619c-6.678,-22.03 -21.674,-42.92 -40.16,-54.879c-5.348,-3.46 -7.233,-5.405 -4.44,-7.465c1.223,-0.902 2.045,-1.37 16.265,9.822c8.386,6.6 15.292,15.956 16.432,17.501c12.946,17.54 17.861,37.716 18.718,41.236c1.722,7.071 1.622,7.053 2.815,14.235c0.281,1.69 1.284,1.627 1.431,1.814Z" fill="currentColor" />
            <g>
              <path d="M41.645,25.619c3.279,-12.648 18.098,-5.91 20.718,-3.759c10.721,8.801 -4.251,17.587 -12.614,16.359c-10.167,-1.493 -8.062,-10.316 -8.104,-12.6Zm6.053,-0.542c3.414,-2.706 3.587,-3.084 7.747,-1.992c0.545,0.143 4.923,1.291 5.781,4.015c2.632,8.36 -22.38,10.35 -13.528,-2.023Z" fill="currentColor" />
              <path d="M83.3,35.768c-2.999,-2.281 -3.033,-2.19 -5.609,-4.987c-2.166,-2.353 -2.522,1.987 -2.545,2.258c-0.434,5.295 -5.082,5.33 -4.658,1.317c2.435,-23.081 -1.002,-23.123 -0.03,-32.062c0.188,-1.726 4.026,-4.172 4.437,2.834c0.786,13.378 -0.773,17.836 4.263,15.291c0.879,-0.444 14.832,-7.494 12.274,-0.979c-0.569,1.45 -1.025,0.956 -4.901,2.485c-15.135,5.971 4.732,11.255 5.322,12.522c0.292,0.628 1.074,6.325 -8.553,1.321Z" fill="currentColor" />
              <path d="M96.658,28.567c0.535,-1.345 5.479,-13.773 14.538,-10.775c5.506,1.822 5.983,9.555 0.002,12.516c-6.103,3.022 -12.809,-3.811 -10.175,2.519c3.04,7.303 15.874,2.148 17.196,3.122c4.648,3.427 -9.697,8.135 -17.105,3.659c-6.399,-3.866 -4.649,-9.575 -4.456,-11.041Zm9.818,-6.163c0.595,-0.059 1.094,-0.547 1.69,-0.606c1.816,-0.18 3.813,1.42 2.446,3.525c-1.576,2.427 -11.078,3.297 -4.135,-2.919Z" fill="currentColor" />
              <path d="M20.589,8.663c17.353,-2.005 21.202,-1.353 21.741,0.889c1.309,5.443 -11.84,0.774 -17.047,3.547c-4.084,2.175 0.583,23.204 -2.228,25.166c-5.407,3.774 -3.323,-14.521 -3.603,-21.487c-0.296,-7.366 -15.564,2.776 -17.923,0.043c-4.414,-5.113 14.292,-7.297 19.06,-8.158Z" fill="currentColor" />
              <path d="M131.116,29.755c-3.12,4.739 -4.731,7.398 -6.668,5.705c-0.683,-0.597 -0.89,-0.778 -0.283,-11.329c0.402,-6.989 3.746,-3.286 3.961,-2.647c0.142,0.422 0.09,0.888 0.18,1.325c1.233,5.978 7.24,-9.544 12.887,-1.299c0.794,1.159 4.687,15.643 2.059,16.076c-5.618,0.926 -2.967,-17.857 -8.819,-11.926c-0.296,0.3 -0.246,0.303 -3.317,4.095Z" fill="currentColor" />
            </g>
          </g>
        </g>
      </svg>

      <svg
        class="annotation"
        :style="subwordAnnStyle"
        viewBox="0 0 237 150"
        style="fill-rule:evenodd;clip-rule:evenodd"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xml:space="preserve"
      >
        <g>
          <g>
            <path d="M10.625,146.122c-8.769,-14.21 -8.968,-14.072 -9.633,-15.361c-1.412,-2.735 2.31,-5.51 4.544,-2.329c3.786,5.389 4.329,9.043 6.091,7.466c0.351,-0.314 0.584,-9.473 1.226,-13.765c0.86,-5.748 5.361,-35.904 28.396,-57.688c10.925,-10.332 12.422,-8.662 13.241,-7.748c1.686,1.881 -1.068,4.118 -1.351,4.348c-7.345,5.964 -7.498,5.739 -13.967,12.705c-21.158,22.783 -22.75,62.181 -22.656,62.513c1.393,4.904 7.229,-11.992 11.351,-8.651c2.543,2.062 -2.228,7.37 -3.242,8.61c-6.618,8.094 -9.419,17.28 -14,9.899Z" fill="currentColor" />
            <g>
              <path d="M229.018,21.602c-0.03,-1.659 -0.491,-26.894 5.618,-19.967c3.425,3.884 -1.919,20.893 -0.346,27.225c0.41,1.649 4.57,10.487 0.78,10.247c-3.933,-0.249 -3.287,-10.534 -6.924,-5.47c-0.688,0.958 -6.454,8.988 -13.598,5.711c-7.075,-3.245 -1.214,-22.091 10.401,-17.918c1.605,0.577 1.931,1.438 3.281,0.913c0.336,-0.131 0.452,-0.611 0.788,-0.742Zm-1.714,5.839c-0.489,0.77 -4.857,7.648 -8.267,7.858c-6.151,0.378 -2.601,-15.353 8.267,-7.858Z" fill="currentColor" />
              <path d="M107.832,12.909c-0.528,9.538 -1.441,11.564 1.675,10.938c20.97,-4.211 17.976,13.884 5.896,15.689c-2.739,0.409 -13.126,-0.111 -12.989,-9.113c0.163,-10.699 1.021,-12.443 1.632,-21.857c0.04,-0.612 0.471,-7.254 2.54,-7.233c2.561,0.026 1.673,5.842 1.246,11.576Zm6.02,14.217c11.356,0.84 4.631,9.151 -1.502,8.077c-0.647,-0.113 -12.91,-4.021 1.502,-8.077Z" fill="currentColor" />
              <path d="M163.639,27.519c2.648,-11.408 15.783,-7.068 18.562,-5.334c18.09,11.287 -11.187,23.354 -17.278,14.139c-2.255,-3.412 -1.406,-6.487 -1.284,-8.804Zm5.444,-0.174c6.558,-7.176 14.504,-0.138 14.003,3.195c-0.641,4.269 -18.887,10.443 -14.003,-3.195Z" fill="currentColor" />
              <path d="M68.473,29.13c0.305,0.484 2.993,4.752 1.409,7.014c-5.659,8.082 -29.628,2.06 -24.275,-3.949c2.219,-2.491 7.141,4.625 17.111,2.44c1.65,-0.362 2.78,-2.216 -0.155,-3.877c-4.498,-2.546 -26.117,-9.61 -14.093,-17.364c4.819,-3.107 18.326,-4.666 15.46,0.794c-0.95,1.809 -16.45,1.238 -11.383,6.046c2.638,2.503 6.669,1.789 15.925,8.896Z" fill="currentColor" />
              <path d="M157.667,26.038c-3.385,5.054 -10.22,16.884 -13.982,11.156c-0.053,-0.08 -1.286,-4.196 -3.79,-1.246c-5.954,7.014 -8.925,2.208 -9.735,-6.992c-0.242,-2.751 -1.762,-10.634 2.847,-8.988c3.092,1.104 -0.827,22.257 6.281,9.36c4.391,-7.967 6.401,2.969 7.089,3.355c3.12,1.752 10.297,-17.963 14.228,-13.928c1.584,1.626 -1.691,5.575 -2.938,7.283Z" fill="currentColor" />
              <path d="M77.729,37.316c-6.099,-6.826 -0.896,-20.429 2.204,-15.441c0.659,1.061 -2.937,16.08 4.88,11.667c4.045,-2.284 5.659,-8.068 5.888,-8.89c1.115,-3.999 0.897,-6.988 4.15,-4.37c1.853,1.491 -0.052,8.445 1.248,13.133c1.058,3.816 2.766,6.078 -1.184,5.693c-3.066,-0.298 -2.26,-7.4 -6.274,-3.427c-5.947,5.886 -10.071,2.075 -10.913,1.635Z" fill="currentColor" />
              <path d="M198.58,28.979c-2.168,8.312 0.847,10.996 -2.984,10.768c-3.415,-0.203 -3.45,-20.184 -2.81,-20.949c2.06,-2.461 2.735,-0.567 3.508,2.584c0.973,3.965 4.933,-4.298 10.877,-2.252c2.253,0.775 2.476,3.628 0.133,3.92c-4.832,0.601 -5.444,0.33 -8.724,5.928Z" fill="currentColor" />
            </g>
          </g>
        </g>
      </svg>

      <svg
        class="annotation"
        :style="tokenIdAnnStyle"
        viewBox="0 0 229 162"
        style="fill-rule:evenodd;clip-rule:evenodd"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xml:space="preserve"
      >
        <g>
          <g>
            <path d="M14.216,41.729c-3.963,-17.646 -0.511,-24.048 -0.929,-26.6c-0.967,-5.911 -6.162,11.292 -11.053,9.697c-3.242,-1.057 0.4,-5.868 0.705,-6.271c11.088,-14.645 12.749,-20.593 17.291,-13.882c3.243,4.791 9.213,10.888 11.549,13.649c3.312,3.915 -0.318,5.974 -3.099,4.263c-2.127,-1.309 -6.71,-7.263 -7.235,-7.944c-0.168,-0.219 -3.722,-4.835 -3.439,0.305c0.159,2.895 -7.724,38.83 34.185,86.46c5.655,6.427 0.101,6.906 -1.05,6.411c-1.536,-0.661 -13.793,-16.479 -14.358,-17.325c-13.584,-20.347 -18.85,-32.273 -22.567,-48.762Z" fill="currentColor" />
            <g>
              <path d="M202.098,148.113c-0.347,-15.91 0.557,-17.005 -2.916,-18.463c-0.475,-0.199 -6.17,-2.589 -4.176,-4.901c2.684,-3.112 33.405,9.468 33.047,21.916c-0.366,12.741 -31.619,13.347 -32.628,12.604c-4.55,-3.353 4.809,-4.224 5.355,-4.275c2.566,-0.239 2.049,-1.335 1.318,-6.881Zm4.911,-0.045c-0.656,-5.398 -2.09,-15.263 1.099,-15.431c0.858,-0.045 29.491,13.19 5.673,20.583c-7.733,2.4 -6.534,-3.798 -6.773,-5.153Z" fill="currentColor" />
              <path d="M50.688,146.653c0.022,-0.071 -0.166,-4.342 5.455,-6.325c4.573,-1.613 8.448,-0.381 9.145,-0.159c15.182,4.826 7.662,19.368 -6.073,18.391c-10.818,-0.769 -8.516,-11.29 -8.527,-11.906Zm5.074,1.223c0.331,-0.608 2.712,-4.971 7.773,-3.801c11.498,2.659 3.889,11.758 -4.409,10.321c-4.451,-0.771 -4.124,-2.092 -3.364,-6.52Z" fill="currentColor" />
              <path d="M82.406,130.597c0.164,9.084 -0.906,13.967 4.782,10.654c7.323,-4.266 11.464,-3.822 10.384,-0.233c-0.715,2.377 -17.959,3.193 -5.922,10.997c1.455,0.944 8.961,1.825 5.947,5.168c-2.3,2.551 -7.784,0.15 -11.756,-3.748c-4.58,-4.495 -2.501,4.357 -6.193,4.443c-3.7,0.087 -0.849,-2.267 -1.217,-14.156c-0.617,-19.93 -1.267,-20.424 0.175,-21.337c0.074,-0.047 1.831,-0.696 2.586,0.847c0.782,1.599 0.509,1.658 1.213,7.364Z" fill="currentColor" />
              <path d="M31.482,130.557c1.631,-0.217 18.386,-3.012 20.2,0.175c2.913,5.118 -11.373,2.176 -15.872,4.142c-3.352,1.466 0.13,21.278 -1.645,23.222c-5.444,5.965 -3.698,-16.486 -3.742,-18.784c-0.18,-9.337 -16.533,3.583 -17.917,-1.427c-1.43,-5.174 13.403,-6.491 18.976,-7.328Z" fill="currentColor" />
              <path d="M103.093,146.683c0.562,-0.875 5.067,-7.889 10.169,-8.094c5.688,-0.229 8.718,5.275 5.701,9.43c-5.175,7.127 -12.849,0.605 -12.822,4.478c0.053,7.375 16.611,3.127 17.115,3.4c5.991,3.258 -13.88,9.953 -20.158,0.914c-2.609,-3.756 -0.311,-9.377 -0.005,-10.127Zm8.45,-3.39c0.314,-0.106 3.598,-1.221 4.093,0.629c0.432,1.614 -1.691,3.669 -3.869,3.78c-0.353,0.018 -5.783,-0.011 -0.224,-4.408Z" fill="currentColor" />
              <path d="M177.477,129.093c5.098,-0.847 5.051,-0.903 10.187,-0.949c3.354,-0.03 4.486,3.99 -0.054,4.667c-0.973,0.145 -1.971,0.068 -2.945,0.214c-3.812,0.573 -3.715,7.266 -4.085,10.717c-0.713,6.655 -2.433,10.059 4.266,9.346c0.436,-0.046 6.279,-0.669 4.858,2.54c-0.775,1.75 -18.121,4.248 -19.573,2.746c-3.009,-3.112 4.024,-4.268 4.995,-5.48c0.634,-0.791 1.978,-15.861 1.996,-16.428c0.127,-3.967 -6.899,-0.725 -7.175,-4.399c-0.262,-3.487 6.629,-2.952 7.528,-2.976Z" fill="currentColor" />
              <path d="M144.958,143.891c0.251,0.917 0.156,0.927 2.649,11.589c0.562,2.405 -3.974,4.465 -5.314,-2.963c-0.972,-5.384 -0.751,-5.45 -1.293,-5.892c-4.21,-3.432 -9.163,14.181 -12.994,8.674c-0.793,-1.14 -0.638,-16.121 2.666,-14.207c1.013,0.587 1.824,5.56 3.897,3.419c2.864,-2.959 5.617,-8.133 10.39,-0.62Z" fill="currentColor" />
              <path d="M155.569,147.858c-7.33,0.119 -4.326,-3.385 -3.969,-3.625c1.461,-0.986 17.599,-1.896 14.366,2.521c-0.849,1.159 -4.972,1.059 -10.397,1.104Z" fill="currentColor" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>
