import { Question, QuestionOption } from './types';

export interface ParseResult {
  questions: Question[];
  totalFound: number;
  validCount: number;
  invalidCount: number;
}

export function parseRawQuestions(rawText: string, groupId: string = ''): ParseResult {
  const lines = rawText.split(/\r?\n/);
  const questions: Question[] = [];

  let currentQuestion: Partial<Question> | null = null;
  let currentOption: QuestionOption | null = null;
  let mode: 'QUESTION' | 'OPTIONS' | 'ANSWER' | 'EXPLANATION' | 'IDLE' = 'IDLE';

  const finalizeCurrentQuestion = () => {
    if (!currentQuestion) return;

    if (currentOption && currentQuestion.options) {
      currentQuestion.options.push({ ...currentOption });
      currentOption = null;
    }

    // Default options array if missing
    if (!currentQuestion.options) {
      currentQuestion.options = [];
    }

    // Clean up strings
    const qText = (currentQuestion.question || '').trim();
    const options = currentQuestion.options.map((opt) => ({
      letter: opt.letter.toUpperCase(),
      text: opt.text.trim(),
    }));

    let correctLetter = currentQuestion.correctAnswer?.letter?.toUpperCase() || '';
    let correctText = currentQuestion.correctAnswer?.text?.trim() || '';

    // If answer text is present but letter missing, match against options
    if (!correctLetter && correctText) {
      const match = options.find(
        (o) => o.text.toLowerCase() === correctText.toLowerCase()
      );
      if (match) {
        correctLetter = match.letter;
      }
    }

    // If letter present but text missing, fill from matching option
    if (correctLetter && !correctText) {
      const match = options.find((o) => o.letter === correctLetter);
      if (match) {
        correctText = match.text;
      }
    }

    // Validation checks
    let isValid = true;
    const errors: string[] = [];

    if (!qText) {
      isValid = false;
      errors.push('Missing question text');
    }

    if (options.length < 2) {
      isValid = false;
      errors.push(`Requires at least 2 options (found ${options.length})`);
    }

    if (!correctLetter) {
      isValid = false;
      errors.push('Missing correct answer');
    } else if (!options.some((o) => o.letter === correctLetter)) {
      isValid = false;
      errors.push(`Answer key "${correctLetter}" does not match any option`);
    }

    const questionObj: Question = {
      id: currentQuestion.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      groupId,
      question: qText,
      options,
      correctAnswer: {
        letter: correctLetter,
        text: correctText,
      },
      explanation: currentQuestion.explanation?.trim() || undefined,
      isValid,
      validationError: errors.join('; '),
    };

    questions.push(questionObj);
    currentQuestion = null;
    currentOption = null;
    mode = 'IDLE';
  };

  const questionHeaderRegex = /^\s*(?:Q(?:uestion)?\s*)?\(?(\d+)\)?[.:\)\s]\s*(.*)$/i;
  const optionRegex = /^\s*\(?([A-Ea-e])\)?[.:\)\s]\s*(.+)$/;
  const answerRegex = /^\s*(?:Correct\s*)?(?:Answer|Ans|Key)\s*[:=\-]?\s*([A-Ea-e])?(?:[\s\-:\.]+(.*))?$/i;
  const explanationRegex = /^\s*(?:Explanation|Explain|Note)\s*[:=\-]?\s*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      // Empty line - if we have an active option, finalize it
      if (currentOption && currentQuestion?.options) {
        currentQuestion.options.push({ ...currentOption });
        currentOption = null;
      }
      continue;
    }

    // Check for Answer line
    const ansMatch = line.match(answerRegex);
    if (ansMatch && currentQuestion) {
      if (currentOption && currentQuestion.options) {
        currentQuestion.options.push({ ...currentOption });
        currentOption = null;
      }
      const ansLetter = ansMatch[1] ? ansMatch[1].toUpperCase() : '';
      const ansText = ansMatch[2] || '';

      currentQuestion.correctAnswer = {
        letter: ansLetter,
        text: ansText,
      };
      mode = 'ANSWER';
      continue;
    }

    // Check for Explanation line
    const expMatch = line.match(explanationRegex);
    if (expMatch && currentQuestion) {
      if (currentOption && currentQuestion.options) {
        currentQuestion.options.push({ ...currentOption });
        currentOption = null;
      }
      currentQuestion.explanation = expMatch[1] || '';
      mode = 'EXPLANATION';
      continue;
    }

    // Check for Option line (A. HTTP, B) FTP, etc.)
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      if (currentOption && currentQuestion.options) {
        currentQuestion.options.push({ ...currentOption });
      }
      currentOption = {
        letter: optMatch[1].toUpperCase(),
        text: optMatch[2].trim(),
      };
      mode = 'OPTIONS';
      continue;
    }

    // Check for Question Header line (1. Which protocol..., Q2: ..., Question 3)
    const qMatch = line.match(questionHeaderRegex);

    // Ensure it's not mistakenly matching an option or answer
    const looksLikeQuestion =
      qMatch &&
      !line.match(optionRegex) &&
      !line.match(answerRegex) &&
      !line.match(explanationRegex);

    if (looksLikeQuestion) {
      if (currentQuestion) {
        finalizeCurrentQuestion();
      }

      currentQuestion = {
        id: `q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        groupId,
        question: qMatch[2] ? qMatch[2].trim() : '',
        options: [],
        correctAnswer: { letter: '', text: '' },
      };
      mode = 'QUESTION';
      continue;
    }

    // Continuation of text based on mode
    if (currentQuestion) {
      if (mode === 'EXPLANATION') {
        currentQuestion.explanation = `${currentQuestion.explanation || ''} ${line}`.trim();
      } else if (mode === 'OPTIONS' && currentOption) {
        currentOption.text = `${currentOption.text} ${line}`.trim();
      } else if (mode === 'QUESTION') {
        currentQuestion.question = `${currentQuestion.question || ''} ${line}`.trim();
      }
    }
  }

  // Finalize last question
  if (currentQuestion) {
    finalizeCurrentQuestion();
  }

  const validCount = questions.filter((q) => q.isValid).length;
  const invalidCount = questions.length - validCount;

  return {
    questions,
    totalFound: questions.length,
    validCount,
    invalidCount,
  };
}

export const SAMPLE_QUESTION_TEXT = `1. Which protocol is primarily used to secure website communications using encryption?
A. HTTP
B. FTP
C. HTTPS
D. SMTP
Answer: C
Explanation: HTTPS uses SSL/TLS protocols to encrypt data transmitted between a web browser and a website server.

2. What does AWS stand for in cloud computing?
A. Amazon Web System
B. Amazon Web Services
C. Automated Web Storage
D. American Web Standards
Ans: B
Explanation: Amazon Web Services (AWS) is a comprehensive cloud platform provided by Amazon.

3. Which layer of the OSI model is responsible for logical IP addressing and routing?
A. Physical Layer
B. Data Link Layer
C. Network Layer
D. Transport Layer
Correct Answer: C Network Layer

4. In Java, which keyword is used to prevent a class from being subclassed or inherited?
A. static
B. final
C. abstract
D. private
Answer: B`;
