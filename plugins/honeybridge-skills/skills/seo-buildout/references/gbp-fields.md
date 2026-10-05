# Google Business Profile - the complete fill-out

Read before Phase 5. Work top to bottom. Every row gets a state in `plan.md`:
**fill** / **fix** / **already correct** / **blocked on client**.

Attended only. Honey Bridge browser, deviceId `4c40c7fc-fc02-42ea-8940-345d086c2e69`. Confirm
which client's profile before the first write.

## Why we fill this out, stated honestly

Google documents three local ranking factors: **relevance, distance, prominence**
(<https://support.google.com/business/answer/7091>). That page does **not** name services,
products, attributes, Q&A, posts or the description as ranking levers. Prominence is the only
place it connects an off-profile signal to ranking, and it names inbound links and review count.

So the case for a complete profile is: relevance improves with complete and accurate business
information, and a filled-out profile converts the person already looking at it. That is true
and it is enough. **Do not sell a ranking gain the documentation does not support**, and do not
repeat the community's ranked-factor folklore ("photos are the number two factor") - there is no
ranked list at Google for anything to be number two of.

## Read limits off the field, do not assert them

Earlier versions of this file stated a 750-character description limit as fact. That number is
not stated on Google's own *Edit your Business Profile* page
(<https://support.google.com/business/answer/3039617>). It is widely repeated and unverified at
source.

**Rule: read the character counter in the field at edit time. Never write a limit into a plan or
a client document from memory.** The same applies to any other field limit.

## Identity

| Field | Rule |
|---|---|
| Business name | Exactly the real-world name. No keyword stuffing; it is a suspension risk and Client H is already suspended. Must match the site's `LocalBusiness` schema and the footer NAP, character for character. |
| Primary category | The single closest match. Check what the top map-pack rivals from lane 2a use. |
| Additional categories | One per real service line. Never a category for something they do not do. |
| Address | Must match the site and every citation exactly, including suite and abbreviation style. |
| Service area | Only for businesses that travel to the customer. |
| Phone | The real number. If call tracking is in play, the site and the profile must agree. |
| Website | The **live public domain**. Verify it loads before saving. A legacy or parked domain here silently costs every click, and at least one client's profile has pointed at a dead `.net`. |
| Appointment / order / menu links | The real ordering or booking system, not a dead alias. |

## Services

Every row in `services.md` becomes a service here. For each one:

- **Name** - what a customer would call it, not internal jargon.
- **Description** - a few plain sentences: what it is, who it is for, what is included. Written
  from what the business actually does. No invented detail, no borrowed marketing phrasing, no
  em dashes or en dashes.
- **Price** - only when a source confirms it. The ordering system beats memory. If prices vary,
  leave it off; a wrong price on the profile is worse than none.
- **Link** - the URL Phase 4 gave that service. A hub anchor counts and is the normal case.

Group services under the category they belong to. A service with no matching category means the
category list is incomplete.

**Open question, not a rule.** One practitioner in the 2026-09 research corpus argued that "if
you have 20 services on your Google Business Profile, that's going to deter people because
that's too many options." No evidence was attached, and it was the only voice arguing against
maximal fill-out. It is recorded here because it cuts directly against this section's premise.
Watch for it on the first real run; do not act on it yet, and do not pretend it is settled.

## Products

For anything sold as an item rather than performed as a service. Name, price or range,
description, photo. Worth filling: product cards surface in search and most competitors leave
this empty. Google's ranking page mentions products only as merchandising for retail, not as a
ranking lever.

## Attributes

Work the whole list the category offers. These drive filtered searches, which is how someone
with a specific need finds a business they were not searching for by name. Halal, dietary
options, accessibility, payment methods, parking, seating, service options, amenities, ownership
attributes. **Only tick what is true.**

## Hours

| | |
|---|---|
| Regular hours | Verify against the live source before editing. Several clients' hours are wrong in more than one place at once, and the ordering system usually wins. |
| Special hours | Holidays, at least the next quarter. |
| More hours | Kitchen, delivery, pickup, happy hour, senior hours, whatever the category offers. |

Never edit hours from memory or from the site alone. Confirm, then edit, then re-read.

## Description

Lead with what they are and where. Cover the services in natural sentences rather than a list.
Include the locality once, naturally. No offers, no prices, no links, no ALL CAPS. Read the
character limit off the field.

## Photos and video

House practice: **use photos captured at the location.** Exterior with signage, interior, the
team, the product, and the logo and cover as branded assets.

**Status of this rule, honestly.** Google's *Business Profile photos and videos policy*
(<https://support.google.com/business/answer/7213077>) states that the prohibited and restricted
content policies apply and that photos "must also meet additional criteria", but the retrieved
text does not state a capture-location requirement, and the linked criteria page has not been
retrieved. So this is Honey Bridge house practice with an unverified basis, not a quoted Google
rule. Follow it, and stop citing it as policy until the criteria page is actually read. Note
that as house practice it rules out stock imagery as firmly as generated imagery
([[gbp-image-provenance-rule]]).

If we do not have location photos, that is a client queue item, not a reason to use something
else.

## Posts

One post live at the end of the run, tied to something real: a service, hours, an event, an
offer the client actually authorised.

**Verified rule: a post may not contain a phone number.** "To avoid the risk of abuse, we do not
allow your post content to include a phone number." Attach a Call now button instead, which uses
the verified profile number (<https://support.google.com/business/answer/7213077>).

Posts expire. Note the next one in the worklog.

## Q&A

Seed the questions customers actually ask - parking, halal status, delivery, reservations,
accessibility - and answer them from the owner account. The most-ignored and cheapest section on
the profile. Not a documented ranking lever; it is there for the person reading.

## Reviews

Not a fill-out item, but check it while here: the owner response rate. Prominence explicitly
includes review count, and unanswered reviews are a visible conversion cost. Drafting responses
is a separate job ([[gbp-review-responder]]) and posting is attended.

## Messaging

Turn on only if someone will actually answer. An unanswered inbox is worse than no messaging.

## Before leaving

- Re-read every section fresh after saving. The editor shows optimistic state.
- Screenshot each saved section. Nothing is `[done, verified]` without it.
- Check for a pending verification or suspension banner. If one is up, **fix the underlying cause
  before appealing** - a burned appeal is expensive ([[client-h-gbp-suspension]]).
