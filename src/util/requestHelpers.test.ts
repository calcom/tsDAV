import { DAVNamespace } from '../consts';
import {
  cleanupFalsy,
  formatFilters,
  formatProps,
  getDAVAttribute,
  mergeObjectDupKeyArray,
  urlContains,
  urlEquals,
} from './requestHelpers';

test('cleanupFalsy should clean undefined from object', () => {
  const objA = {
    test1: 123,
    test2: 'abc',
    test3: undefined,
    test4: undefined,
    test5: null,
    test6: '',
    test7: 0,
    test8: {},
    test9: '0',
  };
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test1')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test2')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test3')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test4')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test5')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test6')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test7')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test8')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(cleanupFalsy(objA), 'test9')).toBe(true);
});

test('urlEquals should handle almost identical urls', () => {
  const url = 'https://www.example.com';
  const url1 = 'https://www.example.com/';
  const url2 = 'https://www.example.com  ';
  const url3 = 'https://www.example.com/  ';
  const url4 = 'www.example.com/';
  const url5 = 'www.example.com';
  const url6 = 'example.com';
  expect(urlEquals('', '')).toBe(true);
  expect(urlEquals('', url1)).toBe(false);
  expect(urlEquals(url, url1)).toBe(true);
  expect(urlEquals(url, url2)).toBe(true);
  expect(urlEquals(url, url3)).toBe(true);
  expect(urlEquals(url, url4)).toBe(false);
  expect(urlEquals(url, url5)).toBe(false);
  expect(urlEquals(url, url6)).toBe(false);
});

test('urlContains should handle almost substring of urls', () => {
  const url = 'https://www.example.com';
  const url1 = 'https://www.example.com/';
  const url2 = 'https://www.example.com  ';
  const url3 = 'https://www.example.com/  ';
  const url4 = 'www.example.com/';
  const url5 = 'www.example.com';
  const url6 = 'example.com';
  const url7 = 'blog.example.com';
  expect(urlContains('', '')).toBe(true);
  expect(urlContains('', url1)).toBe(false);
  expect(urlContains(url, url1)).toBe(true);
  expect(urlContains(url, url2)).toBe(true);
  expect(urlContains(url, url3)).toBe(true);
  expect(urlContains(url, url4)).toBe(true);
  expect(urlContains(url, url5)).toBe(true);
  expect(urlContains(url, url6)).toBe(true);
  expect(urlContains(url, url7)).toBe(false);
});

test('mergeObjectDupKeyArray should be able to merge objects', () => {
  const objA = {
    test1: 123,
    test2: 'aaa',
    test4: {
      test5: {
        test6: 'bbb',
      },
    },
    test7: 'ooo',
  };
  const objB = {
    test1: 234,
    test2: 'ccc',
    test4: {
      test5: {
        test6: 'ddd',
      },
    },
    test8: 'ttt',
  };
  const mergedObj = mergeObjectDupKeyArray(objA, objB);
  expect(mergedObj).toEqual({
    test1: [234, 123],
    test2: ['ccc', 'aaa'],
    test4: [{ test5: { test6: 'ddd' } }, { test5: { test6: 'bbb' } }],
    test7: 'ooo',
    test8: 'ttt',
  });
});

test('getDAVAttribute can extract dav attribute values', () => {
  const attributes = getDAVAttribute([
    DAVNamespace.CALDAV,
    DAVNamespace.CALENDAR_SERVER,
    DAVNamespace.CALDAV_APPLE,
    DAVNamespace.DAV,
  ]);

  expect(attributes).toEqual({
    'xmlns:c': 'urn:ietf:params:xml:ns:caldav',
    'xmlns:cs': 'http://calendarserver.org/ns/',
    'xmlns:ca': 'http://apple.com/ns/ical/',
    'xmlns:d': 'DAV:',
  });
});

test('formatProps should be able to format props to expected format', () => {
  const formattedProps = formatProps([
    { name: 'calendar-description', namespace: DAVNamespace.CALDAV },
    { name: 'calendar-timezone', namespace: DAVNamespace.CALDAV },
    { name: 'displayname', namespace: DAVNamespace.DAV },
    { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
    { name: 'resourcetype', namespace: DAVNamespace.DAV },
    { name: 'supported-calendar-component-set', namespace: DAVNamespace.CALDAV },
    { name: 'sync-token', namespace: DAVNamespace.DAV },
  ]);
  expect(formattedProps).toEqual({
    'c:calendar-description': {},
    'c:calendar-timezone': {},
    'd:displayname': {},
    'cs:getctag': {},
    'd:resourcetype': {},
    'c:supported-calendar-component-set': {},
    'd:sync-token': {},
  });
});

test('formatFilters should be able to format filters to expected format', () => {
  const formattedFilters = formatFilters([
    {
      type: 'comp-filter',
      attributes: { name: 'VCALENDAR' },
      children: [
        {
          type: 'comp-filter',
          attributes: { name: 'VEVENT' },
        },
      ],
    },
  ]);
  expect(formattedFilters).toEqual([
    {
      'comp-filter': {
        _attributes: { name: 'VCALENDAR' },
        'comp-filter': { _attributes: { name: 'VEVENT' }, _text: '' },
        _text: '',
      },
    },
  ]);
});
