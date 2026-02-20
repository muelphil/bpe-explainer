export interface TrainingPreset {
  id: string
  name: string
  data: string
}

const programmingPreset = `function breadthFirstSearch(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];

  while (queue.length > 0) {
    const node = queue.shift();

    if (!visited.has(node)) {
      visited.add(node);
      result.push(node);

      for (const neighbor of graph[node]) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return result;
}

function depthFirstSearch(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];

  while (stack.length > 0) {
    const node = stack.pop();

    if (!visited.has(node)) {
      visited.add(node);
      result.push(node);

      // Reverse to preserve left-to-right order
      const neighbors = graph[node];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        if (!visited.has(neighbors[i])) {
          stack.push(neighbors[i]);
        }
      }
    }
  }

  return result;
}`

// Generate a large text for performance testing
const generateLargeText = () => {
  const paragraphs = [
    'The quick brown fox jumps over the lazy dog.',
    'Internationalization and localization often begin with standardization and normalization.',
    'Machine learning algorithms process vast amounts of data to identify patterns and make predictions.',
    'Web development has evolved significantly with modern frameworks and tooling.',
    'Natural language processing enables computers to understand and generate human language.'
  ]

  let text = ''
  for (let i = 0; i < 100; i++) {
    text += paragraphs[i % paragraphs.length] + ' '
    if (i % 5 === 4) text += '\n'
  }
  return text
}

export const trainingPresets: TrainingPreset[] = [
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    // https://generator.lorem-ipsum.info/
    data: 'Lorem ipsum dolor sit amet, vel ex nusquam liberavisse signiferumque, cum in porro dolore dignissim, te dicam feugiat admodum mea. Dolorem incorrupte scribentur cu has, posse ornatus minimum cu vis. Cum ne timeam oblique platonem, laudem mandamus ut est, latine regione sed at. Vis diam tation volutpat ei. Quaestio dignissim vel ea, ad eam malis probatus repudiandae, mei nullam aliquam dolorum te. Tritani concludaturque at nam. Vero electram cum ea. Doming detraxit cum ad. Qui at dicit aliquando definiebas. Vim an facilis officiis constituam. Ex ius aliquam recteque, duo ei nostrud insolens, facer suscipit definiebas mea ut. Eam aeque ancillae no. Ad case scribentur has. Eros civibus eu duo, in mazim debet mel. Ei meis reque facilisis qui, cu animal recteque sit, ei vel minim dicit. Eam no ancillae detracto necessitatibus. At habeo dicunt vix, ocurreret disputando mea ea. Eum volumus principes disputationi cu. Quo inermis consectetuer ad, minim erroribus cum at. Te diam commodo molestie eos, amet posidonium nam id. Eu alia scaevola lobortis mei, solum moderatius cu sea. Veniam patrioque abhorreant et his, nostrud hendrerit duo cu. Eam ea regione iuvaret consequat.'
  },
  {
    id: 'programming',
    name: 'Programming',
    data: programmingPreset
  },
  {
    id: 'conversation',
    name: 'Conversation',
    data: 'Hello! How are you doing today? I\'m doing great, thanks for asking. What brings you here? I wanted to learn more about tokenization. That\'s wonderful! Tokenization is a fundamental concept in natural language processing. It breaks text into smaller units called tokens.'
  },
  {
    id: 'text',
    name: 'Text',
    data: `Internationalization and localization often begin with standardization and normalization. The organization prioritized optimization, visualization, and customization to improve usability and scalability. Reliability and adaptability were central to maintainability, encouraging interoperability and reusability across the application. In this configuration, synchronization and serialization supported automation, while flexibility and stability ensured long-term sustainability and compatibility.`
  },
  // {
  //   id: 'large',
  //   name: 'Large Text (25k+ chars)',
  //   data: generateLargeText()
  // }
]
