---
sidebar_position: 3
---

## `isCollectionDirty`

detect if the collection have changed

```ts
const { isDirty, newCtag } = await isCollectionDirty({
  collection: calendars[1],
  headers: {
    authorization: 'Basic x0C9uFWd9Vz8OwS0DEAtkAlj',
  },
});
```

### Arguments

- `collection` **required**, [DAVCollection](../../types/DAVCollection.md) to detect
- `headers` request headers

### Return Value

- `isDirty` a boolean indicate if the collection is dirty
- `newCtag` if collection is dirty, new ctag of the collection

### Behavior

use PROPFIND to fetch new ctag of the collection and compare it with current ctag, if the ctag changed, it means collection changed.
