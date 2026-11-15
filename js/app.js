"use strict";

import { BADGES_CATALOG } from './badges.js';
import { data } from './data.js';
import { showNetworkError } from './utils.js';
import { openDb, getScore, setScore, getUnlockedBadgeIds, setBadgeUnlocked, getLeaderboardEntries } from './db.js';
import { startGame, stopGame, GameUI } from './game.js';
import { renderBadges } from './badges.js'; // maybe badges.js exports render function?
import { renderLeaderboard } from './leaderboard.js';
import { shareMeme } from './share.js';