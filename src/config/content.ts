export interface ContentSchema {
  meta: {
    title: string;
    plaque: string;
    credit: string;
    defaultCharacter: 'jenil' | 'rutu';
  };
  photos: Record<string, { caption: string }>;
  videos: Record<string, { caption: string }>;
  boards: Record<string, string>;
  exits: {
    exit1: {
      signText: string;
      originalText: string;
      resultText: string;
      originalResultText: string;
    };
    exit2: {
      signText: string;
      originalText: string;
      resultText: string;
      originalResultText: string;
      retryQuestion: string;
      yesLabel: string;
      noLabel: string;
      farewellText: string;
      tryAgainLabel: string;
    };
  };
  ui: {
    replayLabel: string;
  };
}

export const DEFAULT_CONTENT: ContentSchema = {
  meta: {
    title: 'Our Museum',
    plaque: 'Jenil & Rutu — Our Museum',
    credit: 'Made with love by Jenil',
    defaultCharacter: 'rutu'
  },
  photos: {
    P1: { caption: 'Placeholder caption for P1' },
    P2: { caption: 'Placeholder caption for P2' },
    P3: { caption: 'Placeholder caption for P3' },
    P4: { caption: 'Placeholder caption for P4' },
    P5: { caption: 'Placeholder caption for P5' },
    P6: { caption: 'Placeholder caption for P6' },
    P7: { caption: 'Placeholder caption for P7' },
    P8: { caption: 'Placeholder caption for P8' }
  },
  videos: {
    V1: { caption: 'Placeholder video V1' },
    V2: { caption: 'Placeholder video V2' }
  },
  boards: {
    B1: 'Dummy text for B1 - edit me later.',
    B2: 'Dummy text for B2 - edit me later.',
    B3: 'Dummy text for B3 - edit me later.',
    B4: 'Dummy text for B4 - edit me later.',
    B5: 'Dummy text for B5 - edit me later.'
  },
  exits: {
    exit1: {
      signText: 'Do you want to go out with me for a ride!',
      originalText: 'Do you want to go out with me for a ride!',
      resultText: 'Congratulations! You chose the right path.',
      originalResultText: 'Congraculation you choose right path'
    },
    exit2: {
      signText: 'No, I will not come with you!',
      originalText: 'no i will not coming with you!',
      resultText: 'Sorry, you chose the wrong exit.',
      originalResultText: 'sorry you choose the wrong exit',
      retryQuestion: 'Do you need another chance?',
      yesLabel: 'Yes, give me another chance',
      noLabel: 'No',
      farewellText: 'Okay... the museum will be here whenever you change your mind.',
      tryAgainLabel: 'Actually, let me try again'
    }
  },
  ui: {
    replayLabel: 'Replay the museum'
  }
};

/**
 * Validates a loaded content object according to U-09:
 * Every slot has an entry, strings non-empty, board lines <= 80 chars.
 */
export function validateContent(content: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['Content is not a valid JSON object'] };
  }

  // Check photos P1-P8
  for (let i = 1; i <= 8; i++) {
    const id = `P${i}`;
    if (!content.photos || !content.photos[id] || typeof content.photos[id].caption !== 'string' || !content.photos[id].caption.trim()) {
      errors.push(`Missing or empty caption for photo ${id}`);
    }
  }

  // Check videos V1-V2
  for (let i = 1; i <= 2; i++) {
    const id = `V${i}`;
    if (!content.videos || !content.videos[id] || typeof content.videos[id].caption !== 'string' || !content.videos[id].caption.trim()) {
      errors.push(`Missing or empty caption for video ${id}`);
    }
  }

  // Check boards B1-B5
  for (let i = 1; i <= 5; i++) {
    const id = `B${i}`;
    if (!content.boards || typeof content.boards[id] !== 'string' || !content.boards[id].trim()) {
      errors.push(`Missing or empty text for board ${id}`);
    } else if (content.boards[id].length > 80) {
      errors.push(`Board ${id} exceeds 80 characters limit: length is ${content.boards[id].length}`);
    }
  }

  // Check exits
  if (!content.exits?.exit1?.signText?.trim() || !content.exits?.exit1?.resultText?.trim()) {
    errors.push('Missing or empty exit1 texts');
  }

  if (
    !content.exits?.exit2?.signText?.trim() ||
    !content.exits?.exit2?.resultText?.trim() ||
    !content.exits?.exit2?.retryQuestion?.trim() ||
    !content.exits?.exit2?.yesLabel?.trim() ||
    !content.exits?.exit2?.noLabel?.trim()
  ) {
    errors.push('Missing or empty exit2 texts');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function loadContent(): Promise<ContentSchema> {
  try {
    const res = await fetch('./content/content.json');
    if (!res.ok) {
      console.warn('Could not load ./content/content.json, using defaults');
      return DEFAULT_CONTENT;
    }
    const data = await res.json();
    const validation = validateContent(data);
    if (!validation.valid) {
      console.warn('content.json validation warnings:', validation.errors);
      return { ...DEFAULT_CONTENT, ...data };
    }
    return data as ContentSchema;
  } catch (err) {
    console.warn('Failed to parse content.json, using defaults:', err);
    return DEFAULT_CONTENT;
  }
}
