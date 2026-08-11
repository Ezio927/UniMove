# Logout Dropdown Fix Design

## Context

The deployed authenticated header renders the username trigger, but its Ant Design popup remains `ant-dropdown-hidden` after user interaction. The logout reducer and navigation handler already exist; the defect is limited to discovering and opening the user menu.

## Approved behavior

- Keep the compact avatar-and-username menu.
- Make the menu explicitly click-triggered instead of relying on the default hover behavior.
- Add a downward indicator so the trigger is visibly expandable.
- Preserve the existing profile and logout actions.
- On narrow screens, keep the existing compact username behavior without adding a second permanent action.

## Component and data flow

`AppLayout` remains the only changed production component. A click on the authenticated user trigger opens the existing menu. Choosing logout dispatches the existing `logout` action, which clears the token and user from Redux/local storage, then navigates to `/`.

No backend, API, database, authorization, or deployment configuration changes are required.

## Failure handling

The menu uses Ant Design's documented click trigger. Logout continues to use the existing synchronous reducer and success feedback; no new network request or error state is introduced.

## Verification

Add focused component tests proving that:

1. An authenticated user sees an expandable trigger.
2. Clicking it reveals both the profile and logout items.
3. Choosing logout clears persisted authentication and returns to the home route.
4. An unauthenticated user still sees login and registration actions.

Run the focused test first for RED/GREEN, then the frontend quality gates and repository verification before integration.

