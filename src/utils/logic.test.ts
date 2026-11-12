import test from 'node:test';
import assert from 'node:assert/strict';
import { isLineArtBorder, colorsMatch, hexToRgba } from './floodFill';
import { getDistance, calculateTracingScore, generateLetterGuidePoints } from './tracing';

test('hexToRgba correctly parses hex colors', () => {
  const red = hexToRgba('#FF0000');
  assert.equal(red.r, 255);
  assert.equal(red.g, 0);
  assert.equal(red.b, 0);
  assert.equal(red.a, 255);

  const pastel = hexToRgba('#A9D9FF', 200);
  assert.equal(pastel.r, 169);
  assert.equal(pastel.g, 217);
  assert.equal(pastel.b, 255);
  assert.equal(pastel.a, 200);
});

test('isLineArtBorder detects black outlines and ignores light backgrounds', () => {
  // Pure black with full opacity is a border
  assert.equal(isLineArtBorder(0, 0, 0, 255), true);
  // Dark charcoal border
  assert.equal(isLineArtBorder(30, 30, 30, 255), true);
  // White canvas is NOT a border
  assert.equal(isLineArtBorder(255, 255, 255, 255), false);
  // Light pastel yellow is NOT a border
  assert.equal(isLineArtBorder(255, 229, 138, 255), false);
  // Transparent pixel is NOT a border
  assert.equal(isLineArtBorder(0, 0, 0, 0), false);
});

test('colorsMatch respects tolerance distance', () => {
  // Exactly matching colors
  assert.equal(colorsMatch(200, 100, 50, 255, 200, 100, 50, 255, 10), true);
  // Slightly varying color within tolerance
  assert.equal(colorsMatch(205, 105, 52, 255, 200, 100, 50, 255, 10), true);
  // Beyond tolerance
  assert.equal(colorsMatch(250, 100, 50, 255, 200, 100, 50, 255, 10), false);
});

test('getDistance computes accurate Euclidean distance', () => {
  const d = getDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
  assert.equal(d, 5);
});

test('calculateTracingScore gives appropriate stars and completion state', () => {
  const guidePoints = [
    { x: 10, y: 10 },
    { x: 20, y: 20 },
    { x: 30, y: 30 },
    { x: 40, y: 40 },
  ];

  // User traced near all points
  const perfectStrokes = [
    { x: 11, y: 10 },
    { x: 20, y: 21 },
    { x: 29, y: 30 },
    { x: 41, y: 40 },
  ];
  const perfectResult = calculateTracingScore(perfectStrokes, guidePoints, 15);
  assert.equal(perfectResult.accuracy, 100);
  assert.equal(perfectResult.stars, 3);
  assert.equal(perfectResult.completed, true);

  // User missed most points
  const poorStrokes = [{ x: 10, y: 10 }];
  const poorResult = calculateTracingScore(poorStrokes, guidePoints, 5);
  assert.equal(poorResult.accuracy, 25);
  assert.equal(poorResult.stars, 0);
  assert.equal(poorResult.completed, false);
});

test('generateLetterGuidePoints returns valid coordinate lists', () => {
  const pointsA = generateLetterGuidePoints('A');
  assert.ok(pointsA.length > 5);
  const pointsStar = generateLetterGuidePoints('STAR');
  assert.ok(pointsStar.length >= 8);
});
