
// Fisher-Yates shuffle algorithm
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const formatDate = (date: Date | string | undefined, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit',
    ...options 
  });
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let result = '';
  if (h > 0) result += `${h} jam `;
  if (m > 0) result += `${m} menit`;
  return result.trim() || '0 menit';
};

export const calculateScore = (
  answers: { questionId: string; answer?: string; score?: number; isCorrect?: boolean }[],
  questions: { id: string; type: string; correctAnswer?: string; options?: { id: string; isCorrect: boolean }[]; points: number }[]
): { totalScore: number; maxScore: number } => {
  let totalScore = 0;
  let maxScore = 0;

  questions.forEach(q => {
    maxScore += q.points;
    const studentAnswer = answers.find(a => a.questionId === q.id);
    if (studentAnswer) {
      if (q.type === 'Multiple Choice') {
        if (studentAnswer.isCorrect) { // Assuming isCorrect is pre-calculated or checked during submission
          totalScore += q.points;
        }
      } else if (q.type === 'Essay') {
        totalScore += studentAnswer.score || 0; // Use pre-graded score for essays
      }
    }
  });
  return { totalScore, maxScore };
};

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
    