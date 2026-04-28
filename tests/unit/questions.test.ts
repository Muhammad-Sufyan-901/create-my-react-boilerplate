import { describe, it, expect } from 'vitest';
import { questions } from '../../src/prompts/questions.js';

describe('questions registry', () => {
  it('language question has correct shape and defaults', () => {
    const q = questions.language;
    expect(q.id).toBe('language');
    expect(q.message).toBeTruthy();
    const values = q.choices.map(c => c.value);
    expect(values).toContain('ts');
    expect(values).toContain('js');
    expect(q.defaultValue).toBe('ts');
  });

  it('router question has correct shape and defaults', () => {
    const q = questions.router;
    expect(q.id).toBe('router');
    expect(q.message).toBeTruthy();
    const values = q.choices.map(c => c.value);
    expect(values).toContain('react-router');
    expect(values).toContain('tanstack-router');
    expect(q.defaultValue).toBe('react-router');
  });

  it('ui question has correct shape and defaults', () => {
    const q = questions.ui;
    expect(q.id).toBe('ui');
    expect(q.message).toBeTruthy();
    const values = q.choices.map(c => c.value);
    expect(values).toContain('shadcn');
    expect(values).toContain('heroui');
    expect(q.defaultValue).toBe('shadcn');
  });

  it('packageManager question has correct shape and defaults', () => {
    const q = questions.packageManager;
    expect(q.id).toBe('packageManager');
    expect(q.message).toBeTruthy();
    const values = q.choices.map(c => c.value);
    expect(values).toContain('npm');
    expect(values).toContain('yarn');
    expect(values).toContain('pnpm');
    expect(values).toContain('bun');
    expect(q.defaultValue).toBe('npm');
  });

  it('every question has id, message, choices array, and defaultValue', () => {
    for (const q of Object.values(questions)) {
      expect(typeof q.id).toBe('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(typeof q.message).toBe('string');
      expect(q.message.length).toBeGreaterThan(0);
      expect(Array.isArray(q.choices)).toBe(true);
      expect(q.choices.length).toBeGreaterThan(0);
      expect(q.defaultValue).toBeTruthy();
    }
  });

  it('every choice has a non-empty value and label', () => {
    for (const q of Object.values(questions)) {
      for (const choice of q.choices) {
        expect(typeof choice.value).toBe('string');
        expect((choice.value as string).length).toBeGreaterThan(0);
        expect(typeof choice.label).toBe('string');
        expect(choice.label.length).toBeGreaterThan(0);
      }
    }
  });
});
