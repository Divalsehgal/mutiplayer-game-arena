export const SNAKE_LADDER_BOARD = {
    ladders: {
        1: 38,
        4: 14,
        9: 31,
        21: 42,
        28: 84,
        36: 44,
        51: 67,
        71: 91,
        80: 100,
    } as Record<number, number>,
    snakes: {
        16: 6,
        47: 26,
        49: 11,
        56: 53,
        62: 19,
        64: 60,
        87: 24,
        93: 73,
        95: 75,
        98: 78,
    } as Record<number, number>,
};

export const GAME_NAMES: Record<string, string> = {
    RPS: 'Rock Paper Scissors',
    TIC_TAC_TOE: 'Tic-Tac-Toe',
    SNAKE_LADDER: 'Snakes & Ladders',
};
