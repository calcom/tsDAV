import getLogger from 'debug';
import URL from 'url';

import { collectionQuery, supportedReportSet } from './collection';
import { DAVNamespace, DAVNamespaceShorthandMap } from './consts';
import { createObject, deleteObject, propfind, updateObject } from './request';
import { DAVDepth, DAVFilter, DAVProp, DAVResponse } from './types/DAVTypes';
import { DAVAccount, DAVAddressBook, DAVVCard } from './types/models';
import { formatFilters, formatProps, getDAVAttribute, urlEquals } from './util/requestHelpers';
import { findMissingFieldNames, hasFields } from './util/typeHelper';

const debug = getLogger('tsdav:addressBook');

export const addressBookQuery = async (
  url: string,
  props: DAVProp[],
  options?: { depth?: DAVDepth; headers?: { [key: string]: any } }
): Promise<DAVResponse[]> => {
  return collectionQuery(
    url,
    {
      'addressbook-query': {
        _attributes: getDAVAttribute([DAVNamespace.CARDDAV, DAVNamespace.DAV]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        filter: {
          'prop-filter': {
            _attributes: {
              name: 'FN',
            },
          },
        },
      },
    },
    { depth: options?.depth, headers: options?.headers }
  );
};

export const addressBookMultiGet = async (
  url: string,
  props: DAVProp[],
  ObjectUrls: string[],
  options?: {
    filters?: DAVFilter[];
    depth: DAVDepth;
    headers?: { [key: string]: any };
  }
): Promise<DAVResponse[]> =>
  collectionQuery(
    url,
    {
      'addressbook-multiget': {
        _attributes: getDAVAttribute([DAVNamespace.DAV, DAVNamespace.CALDAV]),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:prop`]: formatProps(props),
        [`${DAVNamespaceShorthandMap[DAVNamespace.DAV]}:href`]: ObjectUrls,
        filter: formatFilters(options?.filters),
      },
    },
    { depth: options?.depth, headers: options?.headers }
  );

export const fetchAddressBooks = async (options?: {
  headers?: { [key: string]: any };
  account?: DAVAccount;
}): Promise<DAVAddressBook[]> => {
  const requiredFields: Array<keyof DAVAccount> = ['homeUrl', 'rootUrl'];
  if (!options?.account || !hasFields(options?.account, requiredFields)) {
    if (!options?.account) {
      throw new Error('no account for fetchAddressBooks');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        options.account,
        requiredFields
      )} before fetchAddressBooks`
    );
  }
  const { account } = options;
  const res = await propfind(
    account.homeUrl,
    [
      { name: 'displayname', namespace: DAVNamespace.DAV },
      { name: 'getctag', namespace: DAVNamespace.CALENDAR_SERVER },
      { name: 'resourcetype', namespace: DAVNamespace.DAV },
      { name: 'sync-token', namespace: DAVNamespace.DAV },
    ],
    { depth: '1', headers: options?.headers }
  );
  return Promise.all(
    res
      .filter((r) => r.props?.displayname && r.props.displayname.length)
      .map((rs) => {
        debug(`Found address book named ${rs.props?.displayname},
             props: ${JSON.stringify(rs.props)}`);
        return {
          data: rs,
          account,
          url: URL.resolve(account.rootUrl ?? '', rs.href ?? ''),
          ctag: rs.props?.getctag,
          displayName: rs.props?.displayname,
          resourcetype: rs.props?.resourcetype,
          syncToken: rs.props?.syncToken,
        };
      })
      .map(async (addr) => ({ ...addr, reports: await supportedReportSet(addr, options) }))
  );
};

export const fetchVCards = async (
  addressBook: DAVAddressBook,
  options?: { headers?: { [key: string]: any }; account?: DAVAccount }
): Promise<DAVVCard[]> => {
  debug(`Fetching vcards from ${addressBook?.url}
  ${options?.account?.credentials?.username}`);
  const requiredFields: Array<keyof DAVAccount> = ['rootUrl'];
  if (!options?.account || !hasFields(options?.account, requiredFields)) {
    if (!options?.account) {
      throw new Error('no account for fetchVCards');
    }
    throw new Error(
      `account must have ${findMissingFieldNames(
        options.account,
        requiredFields
      )} before fetchVCards`
    );
  }
  return (
    await addressBookQuery(
      addressBook.url,
      [
        { name: 'getetag', namespace: DAVNamespace.DAV },
        { name: 'address-data', namespace: DAVNamespace.CARDDAV },
      ],
      { depth: '1', headers: options?.headers }
    )
  ).map((res) => {
    return {
      data: res,
      addressBook,
      url: URL.resolve(options.account?.rootUrl ?? '', res.href ?? ''),
      etag: res.props?.getetag,
      addressData: res.props?.addressData,
    };
  });
};

export const createVCard = async (
  addressBook: DAVAddressBook,
  vCardString: string,
  filename: string,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return createObject(URL.resolve(addressBook.url, filename), vCardString, {
    headers: {
      'content-type': 'text/vcard; charset=utf-8',
      ...options?.headers,
    },
  });
};

export const updateVCard = async (
  vCard: DAVVCard,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return updateObject(vCard.url, vCard.data, vCard.etag, {
    headers: {
      'content-type': 'text/vcard; charset=utf-8',
      ...options?.headers,
    },
  });
};

export const deleteVCard = async (
  vCard: DAVVCard,
  options?: { headers?: { [key: string]: any } }
): Promise<Response> => {
  return deleteObject(vCard.url, vCard.etag, options);
};
