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

## Registration: duplicate vs. capacity ordering
`POST /api/events/:id/register` checks for an existing registration
**before** checking venue capacity. Found this the hard way while testing:
with capacity check first, a user who was already registered but retried
the request got told "event is full" instead of "you're already
registered" — technically true but a confusing answer to someone who
already has a seat. Duplicate is checked first now; the unique index on
`Registration{user, event}` still backstops both paths against race
conditions.

## Extra credit
Skipped JWT auth and Elasticsearch on purpose. Both are explicitly optional
in the brief, and given the interview goes through the code together, I'd
rather ship a smaller app I can explain every line of than a bigger one
with auth/search plumbing bolted on that I can't justify under questioning.

## What I'd improve with more time
- Elasticsearch-backed search with typo tolerance and highlighting (see above).
- A waitlist instead of hard-rejecting registrations once a venue is full.
- A few automated tests around the capacity/duplicate registration logic,
  since that's the trickiest business rule in the app.

## Status
Backend complete and verified: seed script + every endpoint tested against
real data (pagination, `q` search, city/category filters, single-event
populate, attendees, top-venues aggregation, 400/404/409 paths, cascade
delete). Frontend: Events List page done; Event Detail and Create Event
pages in progress.
