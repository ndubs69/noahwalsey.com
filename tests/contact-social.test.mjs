import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const SITE = 'https://noahwalsey.com';
const CONSULTING = 'consulting@noahwalsey.com';
const CALENDLY = 'https://calendly.com/noahwalsey/free-20-minute-ai-scan';

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function tags(name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
}

test('Open Graph and Twitter URLs use the production domain', () => {
  const metas = tags('meta');
  const content = (key, value) => {
    const tag = metas.find((el) => attr(el, key) === value);
    assert.ok(tag, `missing meta ${key}="${value}"`);
    return attr(tag, 'content');
  };

  assert.equal(content('property', 'og:url'), `${SITE}/`);
  assert.equal(content('property', 'og:image'), `${SITE}/og-image.png`);
  assert.equal(content('name', 'twitter:url'), `${SITE}/`);
  assert.equal(content('name', 'twitter:image'), `${SITE}/og-image.png`);
  assert.equal(content('name', 'twitter:card'), 'summary_large_image');
});

test('contact form and visible email use the consulting address', () => {
  const form = tags('form').find((el) => attr(el, 'id') === 'ask');
  assert.ok(form, 'missing #ask form');
  assert.equal(form && attr(form, 'action'), `https://formsubmit.co/${CONSULTING}`);
  assert.equal(form && attr(form, 'method').toUpperCase(), 'POST');

  const next = tags('input').find((el) => attr(el, 'id') === 'ask-next');
  assert.equal(next && attr(next, 'name'), '_next');
  assert.equal(next && attr(next, 'value'), `${SITE}/#thanks`);

  const mailto = tags('a').find((el) => (attr(el, 'href') || '').startsWith('mailto:'));
  assert.equal(mailto && attr(mailto, 'href'), `mailto:${CONSULTING}?subject=Consulting`);
  const visible = html.slice(html.indexOf(mailto), html.indexOf('</a>', html.indexOf(mailto)));
  assert.match(visible, new RegExp(`>${CONSULTING}$`));

  assert.match(
    html,
    /window\.location\.href='mailto:consulting@noahwalsey\.com\?subject='/
  );
});

test('placeholders and Gmail are gone from the page', () => {
  assert.doesNotMatch(html, /YOUR-SITE-URL/);
  assert.doesNotMatch(html, /gmail/i);
  assert.doesNotMatch(html, /noahwalsey@gmail\.com/i);
});

test('Calendly booking links are unchanged', () => {
  const booking = tags('a').filter((el) => attr(el, 'data-booking') === CALENDLY);
  assert.equal(booking.length, 6);
  for (const link of booking) {
    assert.equal(attr(link, 'href'), CALENDLY);
    assert.equal(attr(link, 'target'), '_blank');
  }
});
