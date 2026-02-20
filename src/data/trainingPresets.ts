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

export const trainingPresets: TrainingPreset[] = [
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
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
  }
]
