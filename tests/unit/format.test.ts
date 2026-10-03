import { describe, expect, it } from 'vitest';
import {
  displaySeconds,
  formatHMS,
  formatMMSS,
  formatPrice,
  gradientFor,
  greetingKey,
  normalizeUrl,
  remainingMs,
} from '../../src/core/format';

describe('time formatting', () => {
  it('formats mm:ss and hh:mm:ss', () => {
    expect(formatMMSS(1500)).toBe('25:00');
    expect(formatMMSS(-5)).toBe('00:00');
    expect(formatHMS(3725)).toBe('01:02:05');
  });

  it('picks greeting by hour', () => {
    expect(greetingKey(6)).toBe('greeting.morning');
    expect(greetingKey(13)).toBe('greeting.afternoon');
    expect(greetingKey(18)).toBe('greeting.evening');
    expect(greetingKey(23)).toBe('greeting.night');
    expect(greetingKey(3)).toBe('greeting.night');
  });
});

describe('timer math', () => {
  it('uses endTime when running and remainingMs when paused', () => {
    expect(remainingMs({ endTime: 10_000, remainingMs: 0 }, 4_000)).toBe(6_000);
    expect(remainingMs({ endTime: 1_000, remainingMs: 0 }, 4_000)).toBe(0);
    expect(remainingMs({ endTime: null, remainingMs: 1234 }, 4_000)).toBe(1234);
  });

  it('rounds display seconds up', () => {
    expect(displaySeconds(1_500_000)).toBe(1500);
    expect(displaySeconds(1_499_001)).toBe(1500);
    expect(displaySeconds(0)).toBe(0);
  });
});

describe('formatPrice', () => {
  it('scales precision with magnitude', () => {
    expect(formatPrice(65432.1)).toBe('$65,432');
    expect(formatPrice(3.14159)).toBe('$3.14');
    expect(formatPrice(0.123456)).toBe('$0.1235');
    expect(formatPrice(0.00012345)).toBe('$0.000123');
    expect(formatPrice(10, 'eur')).toBe('€10.00');
  });
});

describe('normalizeUrl', () => {
  it('adds https and keeps valid urls', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com/');
    expect(normalizeUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
  });

  it('rejects dangerous or invalid input', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,hi')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
  });
});

describe('gradientFor', () => {
  it('is deterministic', () => {
    expect(gradientFor('https://a.com')).toBe(gradientFor('https://a.com'));
  });
});
