import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const SITE = 'https://noahwalsey.com';
const CONSULTING = 'consulting@noahwalsey.com';
const CALENDLY = 'https://calendly.com/noahwalsey/free-20-minute-ai-scan';
const LINKEDIN = 'https://www.linkedin.com/in/noah-walsey-4870ba28a';

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function tags(source, name) {
  return [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
}

test('Open Graph URLs use the production domain', () => {
  const metas = tags(html, 'meta');
  const content = (key, value) => {
    const tag = metas.find((el) => attr(el, key) === value);
    assert.ok(tag, `missing meta ${key}="${value}"`);
    return attr(tag, 'content');
  };

  assert.equal(content('property', 'og:url'), `${SITE}/`);
  assert.equal(content('property', 'og:image'), `${SITE}/og-image.png`);
});

test('visible email and callback use the consulting address', () => {
  const form = tags(html, 'form').find((el) => attr(el, 'id') === 'callback');
  assert.ok(form, 'missing #callback form');

  const mailto = tags(html, 'a').filter((el) => (attr(el, 'href') || '').startsWith('mailto:'));
  assert.equal(mailto.length, 1);
  assert.equal(attr(mailto[0], 'href'), `mailto:${CONSULTING}`);
  const start = html.indexOf(mailto[0]);
  const visible = html.slice(start, html.indexOf('</a>', start));
  assert.match(visible, new RegExp(`>${CONSULTING}$`));

  assert.match(html, /Opens an email to consulting@noahwalsey\.com\./);
  assert.match(
    app,
    /window\.location\.href = "mailto:consulting@noahwalsey\.com\?subject=" \+ encodeURIComponent\("Call back request"\)/
  );
});

test('placeholders and Gmail are gone from the page', () => {
  for (const source of [html, app]) {
    assert.doesNotMatch(source, /YOUR-SITE-URL/);
    assert.doesNotMatch(source, /gmail/i);
    assert.doesNotMatch(source, /noahwalsey@gmail\.com/i);
  }
});

test('Calendly and LinkedIn links match the tabbed page', () => {
  const booking = tags(html, 'a').filter((el) => attr(el, 'href') === CALENDLY);
  assert.equal(booking.length, 2);
  for (const link of booking) {
    assert.equal(attr(link, 'target'), '_blank');
    assert.equal(attr(link, 'rel'), 'noopener');
  }

  const social = tags(html, 'a').filter((el) => attr(el, 'href') === LINKEDIN);
  assert.equal(social.length, 2);
  for (const link of social) {
    assert.equal(attr(link, 'target'), '_blank');
    assert.equal(attr(link, 'rel'), 'noopener');
  }
});
