export interface TrainingPreset {
  id: string
  name: string
  data: string
}

export const trainingPresets: TrainingPreset[] = [
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  },
  {
    id: 'programming',
    name: 'Programming',
    data: 'function calculateSum(a, b) { return a + b; } const result = calculateSum(10, 20); console.log(result); // Output: 30\nlet array = [1, 2, 3, 4, 5]; array.forEach(num => console.log(num * 2));'
  },
  {
    id: 'conversation',
    name: 'Conversation',
    data: 'Hello! How are you doing today? I\'m doing great, thanks for asking. What brings you here? I wanted to learn more about tokenization. That\'s wonderful! Tokenization is a fundamental concept in natural language processing. It breaks text into smaller units called tokens.'
  }
]
