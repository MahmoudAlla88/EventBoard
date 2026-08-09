# Implementation notes

## Relationships
- **Venue → Events** and **Organizer (User) → Events**: stored as `ObjectId` references
  on the `Event` document (`event.venue`, `event.organizer`), as required by the brief.
- **Users ↔ Events (many-to-many)**: modeled with a separate `Registration` collection
  rather than an array on `Event`, so a registration can carry its own data
  (`ticketCount`, `createdAt`) and so an event with many registrations doesn't grow
  an unbounded array on the Event document.
- **Registration** has a compound **unique index** on `{ user: 1, event: 1 }`, enforced
  by MongoDB itself (not just app code), so the same user can't register twice for the
  same event — a duplicate insert throws a Mongo `E11000` error, which the central
  error handler turns into a `409`.
- **Event capacity**: an Event has no `capacity` field of its own — its limit is read
  from `event.venue.capacity` at registration time.
- Deleting an Event cascades: its Registrations are deleted in the same request
  (`DELETE /api/events/:id`).

## Text search
- Implemented with a MongoDB **text index** on `Event.title` and `Event.description`
  (`eventSchema.index({ title: 'text', description: 'text' })`), queried via `$text`.
- Chosen over regex scanning because it's built into MongoDB (no extra
  infrastructure), handles multi-word queries and relevance ranking reasonably well,
  and is a straightforward upgrade path to Elasticsearch later if needed.

## What I'd improve with more time
- (fill in as the project progresses)

## Status
Work in progress — see README.md for what's done so far.
